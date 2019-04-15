const rootPrefix = "..",
    program = require("commander"),
    Constant = require(rootPrefix + "/configs/constants"),
    cronConstants = require(rootPrefix + "/lib/globalConstants/cronConstants"),
    MysqlService = require(rootPrefix + "/services/mysql_service"),
    GetBlockScannerData = require(rootPrefix + "/services/get_block_scanner_data_service"),
    ProcessLockerKlass = require(rootPrefix + '/lib/processLocker'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    ExtractBase = require(rootPrefix + "/executables/extract_base");


// commander
program
    .version('0.1.0')
    .option('--chainId <chainId>', 'Chain id, mandatory param')
    .option('--blockScanner <blockScanner>', 'Extract data from block scanner')
    .option('--startBlock <startBlock>', 'start block number')
    .option('--endBlock <endBlock>', 'end block number')
    .option('--mysql <mysql>', 'Extract token data')
    .option('--tables <tables>', 'Extract tables data')
    .parse(process.argv);

/**
 *
 * Class for data extraction
 * @class
 * table name in cron should be comma separated value without space
 * node executables/extract_data.js --mysql true --tables Token,ChainAddresses,TokenAddresses,StakerWhitelistedAddresses,Workflows,WorkflowSteps     --chainId 202
 */
class ExtractData extends ExtractBase{

    constructor(params) {
        super(params);
        const oThis = this;
        oThis.chainType = "aux";
        oThis.chainId = program.chainId;
        oThis.startBlock = program.startBlock;
        oThis.endBlock = program.endBlock;
        oThis.mysqlParam = program.mysql;
        oThis.blockScannerParam = program.blockScanner;
        oThis.tables =  program.tables ? program.tables.split(",") : ["Token"];
    }

    perform(){
        const oThis = this;
        return super.perform('cron_extract_data_c_' + parseInt(oThis.chainId) + "_" + parseInt(oThis.startBlock) + "_" +
            parseInt(oThis.endBlock) + "_");
    }


    async extractMysqlData() {
        const oThis = this;
        let startTime = Date.now();
        let promiseArray = [];
        let mysqlService;


        for (let table of oThis.tables) {
            mysqlService = new MysqlService({chainId: oThis.chainId, model: table, chainType: oThis.chainType});
            promiseArray.push(mysqlService.process());
        }

        return Promise.all(promiseArray).then((res) => {
            let endTime = Date.now();
            logger.log("processing finished at", endTime);
            logger.log("Total time to process in milliseconds", (endTime - startTime));
            return Promise.resolve({});
        }).catch((e) => {
            return Promise.reject(e);
        });
    }


    async fetchData(){
        const oThis = this;
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
    }


}
const extractData = new ExtractData();
extractData.perform();