const rootPrefix = "../../.."
    , Redshift = require('node-redshift')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
    , constants = require(rootPrefix + '/configs/constants')
    , Util = require('util')
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , ValidateAndSanitize = require(rootPrefix + '/lib/validateAndSanatize')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer')
;

/**
 * @file - Base class for all the BlockScanner Models
 */
class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.config.chainId;
        oThis.object = params.object || {};
        oThis.applicationMailer = new ApplicationMailer();
        oThis.validateAndSanitize = new ValidateAndSanitize({mapping: oThis.constructor.mapping,
            fieldsToBeMoveToAnalytics: oThis.constructor.fieldsToBeMoveToAnalytics })
    }

    formatBlockScannerDataToArray() {
        const oThis = this;
        let r = oThis.validateAndSanitize.perform({ object: oThis.object });
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }



    initRedshift() {
        const oThis = this;
        oThis.redshiftClient = new Redshift(constants.PRESTAGING_REDSHIFT_CLIENT);
    }


    copyFromS3(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_NAME + '/'
            , copyTable = Util.format('copy %s (%s) from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.getTempTableNameWithSchema(), oThis.getColumnList, s3BucketPath + fullFilePath, oThis.getIamRole())
            , truncateTempTable = Util.format('TRUNCATE TABLE %s;', oThis.getTempTableNameWithSchema())
        ;
        logger.log(s3BucketPath + fullFilePath);

        logger.log("Temp table delete if exists", truncateTempTable);
        return oThis.query(truncateTempTable)
            .then(function () {
                logger.log("Copying of table started", copyTable);
                return oThis.query(copyTable);
            }).then(function () {
                logger.log("copy to Temp table done");
                return responseHelper.successWithData({});
            }).catch((e)=>{
                logger.error(e);
                return responseHelper.error({
                    internal_error_identifier: 'm_r_b_b_cfs',
                    api_error_identifier: 'copy to temp table failed',
                    debug_options: {}
                });
            });
    };


    async query(commandString) {
        const oThis = this;
        logger.info("redshift query ::", commandString);
        oThis.initRedshift();
        return new Promise(function (resolve, reject) {
            try {
                oThis.redshiftClient.query(commandString, function (err, result) {
                    if (err) {
                        reject("Error in query " + err + commandString);
                    } else {
                        resolve(result);
                    }
                })
            } catch (err) {
                reject(err);
            }
        });

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
        const insertRemainingEntries = Util.format('INSERT into %s (%s, insertion_timestamp) (select %s, %s from %s);', oThis.getTableNameWithSchema(), oThis.getColumnList, oThis.getColumnList, oThis.getTimeStampInSecs, oThis.getTempTableNameWithSchema())
        return oThis.query(insertRemainingEntries).then((res) => {
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
            maxBlockNumberFromMainQuery = await oThis.query(Util.format('select coalesce(max(block_number), -1) as max_block_number  from %s where block_number <= %s ', oThis.getTableNameWithSchema(), maxAllowedEndblockInMain));

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

    get getColumnList() {
        const oThis = this;
        return oThis.constructor.fieldsToBeMoveToAnalytics.join(", ");
    }

    getModelImportString() {
        throw 'getModelImportString not implemented'
    };

    getTableNameWithSchema() {
        throw 'getModelImportString not implemented'
    };

    getTablePrimaryKey() {
        throw 'getTablePrimaryKey not implemented'
    };

    getTempTableNameWithSchema() {
        throw 'getTempTableNameWithSchema not implemented'
    };

    handleBlockError(){
        throw 'handleBlockError not implemented'
    }


}

module.exports = Base;