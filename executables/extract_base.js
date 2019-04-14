const rootPrefix = "..",
    Constant = require(rootPrefix + "/configs/constants"),
    cronConstants = require(rootPrefix + "/lib/globalConstants/cronConstants"),
    GetBlockScannerData = require(rootPrefix + "/lib/getBlockScannerData"),
    ProcessLockerKlass = require(rootPrefix + '/lib/processLocker'),
    logger = require(rootPrefix + "/helpers/custom_console_logger");



/**
 *
 * Class for data extraction
 * @class
 * table name in cron should be comma separated value without space
 * node executables/extract_data.js --mysql true --tables Token,ChainAddresses,TokenAddresses,StakerWhitelistedAddresses,Workflows,WorkflowSteps     --chainId 202
 */
class ExtractBase {

    constructor() {
        const oThis = this;
        oThis.ProcessLocker = new ProcessLockerKlass();
    }


    handle() {
        cronConstants.setSigIntSignal();
    }

    async perform() {
        let oThis = this;
        process.on('SIGINT', oThis.handle);
        process.on('SIGTERM', oThis.handle);
        oThis.ProcessLocker.canStartProcess({
            process_title: 'cron_extract_data_c_' + parseInt(oThis.chainId) + "_" + parseInt(oThis.startBlock) + "_" +
                parseInt(oThis.endBlock) + "_" + Constant.ENVIRONMENT + "_" + Constant.SUB_ENVIRONMENT + "_" + Constant.ENV_SUFFIX
        });


        try {

            if (oThis.mysqlParam !== 'false' && oThis.mysqlParam != undefined) {
                await oThis.extractMysqlData();
            }

            if (oThis.blockScannerParam !== 'false' && oThis.blockScannerParam != undefined) {

                const getBlockScannerData = new GetBlockScannerData({
                    chainId: oThis.chainId,
                    chainType: oThis.chainType
                });
                await getBlockScannerData.perform(oThis.startBlock, oThis.endBlock);
            }
        } catch (e) {
            logger.error("Terminating error due to exception", e);
            process.exit(1);
        }
        logger.log("ending the process with success");
        process.exit(0);


    }


     extractMysqlData() {
        throw  "child should implement this";
    }


}


module.exports = ExtractBase;