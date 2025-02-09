const rootPrefix = "..",
    Constant = require(rootPrefix + "/configs/constants"),
    cronConstants = require(rootPrefix + "/lib/globalConstants/cronConstants"),
    GetBlockScannerData = require(rootPrefix + "/services/get_block_scanner_data_service"),
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

    async perform(processPrefix) {
        let oThis = this;
        process.on('SIGINT', oThis.handle);
        process.on('SIGTERM', oThis.handle);
        oThis.ProcessLocker.canStartProcess({
            process_title: processPrefix + Constant.ENVIRONMENT + "_" + Constant.SUB_ENVIRONMENT + "_" + Constant.ENV_SUFFIX
        });


        try {
            await oThis.start();
        } catch (e) {
            logger.error("Terminating error due to exception", e);
            return setTimeout(function(){ process.exit(1);}, 1000);
        }
        logger.log("Ending the process with success");
        return setTimeout(function(){ process.exit(0);}, 1000);
    }


}


module.exports = ExtractBase;