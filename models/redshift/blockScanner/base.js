const rootPrefix = "../../.."
    , RedshiftClient = require(rootPrefix + '/lib/redshift')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
    , Util = require('util')
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer')
    , blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner")
    , dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo")
;

/**
 * @file - Base class for all the BlockScanner Models
 */
class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.config.chainId;
        oThis.chainType = params.config.chainType;
        oThis.object = params.object || {};
        oThis.applicationMailer = new ApplicationMailer();
        oThis.redshiftClient = new RedshiftClient();
        oThis.tableNameSuffix = "";
        if(oThis.chainType == blockScannerGC.auxChainType){
            oThis.tableNameSuffix = "_aux_" + oThis.chainId
        }else if(oThis.chainType == blockScannerGC.originChainType){
            oThis.tableNameSuffix = "_origin"
        }else {
            throw 'Passed ChainType is incorrect.'
        }
    }

    async validateAndMoveFromTempToMain(minBlockNumberForTempTable, maxAllowedEndblockInMain) {

        const oThis = this;
        let r = await oThis.validateTempTableData(minBlockNumberForTempTable, maxAllowedEndblockInMain);
        if (r.success) {
            return oThis.insertToMainTable();
        } else {
            return oThis.handleBlockError({minBlock: minBlockNumberForTempTable, maxBlock: maxAllowedEndblockInMain});
        }
    }

    insertToMainTable() {
        logger.log("insert to main table");
        const oThis = this;
        const insertRemainingEntries = Util.format('INSERT into %s (%s, insertion_timestamp) (select %s, %s from %s);', oThis.getTableNameWithSchema, oThis.getColumnList, oThis.getColumnList, oThis.getTimeStampInSecs, oThis.getTempTableNameWithSchema)
        return oThis.redshiftClient.query(insertRemainingEntries).then(async (res) => {
            logger.log("data moved from temp to main table successfully");
            return Promise.resolve(res);
        }).catch((err)=>{
            return Promise.reject(err);
        });

    }

    get getTimeStampInSecs(){
        return parseInt(Date.now()/1000);
    }

    async validateTempTableData(minBlockNumberForTempTable, maxAllowedEndblockInMain) {

        const oThis = this,
            maxBlockNumberFromMainQuery = await oThis.redshiftClient.query(Util.format('select coalesce(max(block_number), -1) as max_block_number  from %s where block_number <= %s ', oThis.getTableNameWithSchema, maxAllowedEndblockInMain));

        let maxBlockNumberFromMain = parseInt(maxBlockNumberFromMainQuery.rows[0].max_block_number);

        logger.log("minBlockNumberForTempTable " + minBlockNumberForTempTable);
        logger.log("maxBlockNumberFromMain " + maxBlockNumberFromMain);

        if (minBlockNumberForTempTable > maxBlockNumberFromMain) {
            return responseHelper.successWithData({});
        } else {
            return responseHelper.error({
                internal_error_identifier: 'm_r_b_vttd',
                api_error_identifier: 'validateTempTableData failed',
                debug_options: {}
            });
        }
    }


    /**
     * update last processed block
     *
     * * @return {promise}
     *
     */
    async updateLastProcessedBlock(isStartBlockGiven, currentBatchEndBlock) {
        const oThis = this;
        if (isStartBlockGiven == false) {
            logger.step("Starting updateLastProcessedBlock");
            return oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema + " set value=$1 " +
                "where property=$2", [currentBatchEndBlock, oThis.getDataProcessingPropertyName]).then((res) => {
                logger.log("last processed block updated successfully");
            });
        }
    }

    get getColumnList() {
        const oThis = this;
        return oThis.constructor.fieldsToBeMoveToAnalytics.join(", ");
    }

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName() {
        const oThis = this;
        let suffix  = oThis.tableNameSuffix;
        return dataProcessingInfoGC.lastProcessedBlockProperty + suffix;
    }

    get chainSuffix(){
        const oThis = this;
        if (oThis.chainType == blockScannerGC.auxChainType) {
            return "_" + oThis.chainId ;
        } else if (oThis.chainType == blockScannerGC.originChainType) {
            return "" ;
        } else {
            throw 'Passed ChainType is incorrect.'
        }
    }


    get getTableNameWithSchema() {
        throw 'getTableNameWithSchema not implemented'
    };

    get getTablePrimaryKey() {
        throw 'getTablePrimaryKey not implemented'
    };

    get getTempTableNameWithSchema() {
        throw 'getTempTableNameWithSchema not implemented'
    };

    handleBlockError(){
        throw 'handleBlockError not implemented'
    }


}

module.exports = Base;