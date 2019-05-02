const rootPrefix = "..",
    program = require("commander"),
    GetBlockScannerData = require(rootPrefix + "/services/get_block_scanner_data_service"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    ExtractBase = require(rootPrefix + "/executables/extract_base"),
    CreateRDSInstance = require(rootPrefix + "/services/create_rds_instance"),
    MysqlService = require(rootPrefix + "/services/mysql_service"),
    CheckRDSInstance = require(rootPrefix + "/services/check_rds_instance"),
    DeleteRDSInstance = require(rootPrefix + "/services/delete_rds_instance"),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance')
;


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
        let promiseArray = [];
        let createRDSInstance, checkRDSInstance, deleteRDSInstance, restoreDBInstance;

        createRDSInstance = new CreateRDSInstance();
        checkRDSInstance = new CheckRDSInstance({});
        deleteRDSInstance = new DeleteRDSInstance();
        restoreDBInstance = new RestoreDBInstance();
        //let r = await createRDSInstance.perform();
        console.log(":::::::::::::-----**************************--------------:::::::::::::::::::::");
        console.log(r);
        console.log(":::::::::::::-----**************************--------------:::::::::::::::::::::");
        if (!r.success) {
            console.log(":::::::::::::-------------------:::::::::::::::::::::");
            console.log(r);
            console.log(":::::::::::::-------------------:::::::::::::::::::::");
            return Promise.reject(r);
        }
        let checkInstanceStatus = await checkRDSInstance.process();

        console.log(":::::::::::::-------------------:::::::::::::::::::::");
        console.log(checkInstanceStatus);
        console.log(":::::::::::::-------------------:::::::::::::::::::::");
        return;

        for (let table of oThis.tables) {
            let mysqlService = new MysqlService({
                chainId: oThis.chainId, model: table, chainType: oThis.chainType,
                dynamicMysqlHost: checkInstanceStatus.data.host
            });
            promiseArray.push(mysqlService.process());
        }

        return Promise.all(promiseArray).then(async (res) => {
            let endTime = Date.now();
            logger.log("processing finished at", endTime);
            logger.log("Total time to process in milliseconds", (endTime - startTime));
            await deleteRDSInstance.process({dbInstanceId: r.data.dbInstanceId});
            await restoreDBInstance.updateInstanceRowInDB(r.data.dbInstanceId, {'cron_status': RDSInstanceLogsGC.processed});

            return Promise.resolve({});
        }).catch(async (e) => {
            await deleteRDSInstance.process({dbInstanceId: r.data.dbInstanceId});
            return Promise.reject(e);
        });

    }
}


const extractDataDaily = new ExtractDataDaily();
extractDataDaily.perform();