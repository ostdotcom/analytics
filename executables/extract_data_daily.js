const rootPrefix = "..",
    program = require("commander"),
    GetBlockScannerData = require(rootPrefix + "/services/get_block_scanner_data_service"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    ExtractBase = require(rootPrefix + "/executables/extract_base"),
    MysqlServiceWrapper = require(rootPrefix + "/services/mysql_service_wrapper"),
    CreateRDSInstance = require(rootPrefix + "/services/create_rds_instance");


// commander
program
    .version('0.1.0')
    .option('--originChainId <originChainId>', 'Chain id, mandatory param')
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
 * node executables/extract_data_daily.js --mysql true --tables Token,ChainAddresses,TokenAddresses,StakerWhitelistedAddresses,Workflows,WorkflowSteps  --originChainId 3
 */
class ExtractDataDaily extends ExtractBase {

    constructor() {
        super();
        const oThis = this;
        oThis.chainType = blockScannerGC.originChainType;
        oThis.chainId = program.originChainId;
        oThis.startBlock = program.startBlock;
        oThis.endBlock = program.endBlock;
        oThis.mysqlParam = program.mysql;
        oThis.blockScannerParam = program.blockScanner;
        oThis.tables = program.tables ? program.tables.split(",") : ["Token", "TokenAddresses", "Workflows",
            "WorkflowSteps", "StakerWhitelistedAddresses", "ChainAddresses"];
    }

    perform() {
        const oThis = this;
        return super.perform('cron_extract_data_c_' + parseInt(oThis.chainId) + "_" + parseInt(oThis.startBlock) + "_" +
            parseInt(oThis.endBlock) + "_");
    }

    async start() {
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


    async extractMysqlData() {
        const oThis = this;
        let startTime = Date.now();
        let mysqlServiceWrapper;

        let createRDSInstance = new CreateRDSInstance();
        let r = await createRDSInstance.perform();
        if (!r.success) {
            return Promise.reject(r);
        }
        mysqlServiceWrapper = new MysqlServiceWrapper({
            chainId: oThis.chainId, tables: oThis.tables, chainType: oThis.chainType,
            defaultConfig: false
        });
        return await mysqlServiceWrapper.process();

    }
}


const extractDataDaily = new ExtractDataDaily();
extractDataDaily.perform();