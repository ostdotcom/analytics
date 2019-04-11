const rootPrefix = "..",
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    program = require("commander"),
    Constant = require(rootPrefix + "/configs/constants"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    cronConstants = require(rootPrefix + "/lib/globalConstants/cronConstants"),
    BlockScannerService = require(rootPrefix + "/services/block_scanner_service.js"),
    MysqlService = require(rootPrefix + "/services/mysql_service"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    ProcessLockerKlass = require(rootPrefix + '/lib/processLocker'),
    logger = require(rootPrefix + "/helpers/custom_console_logger");


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
 * node executables/extract_data.js --mysql true --tables Token,ChainAddresses     --chainId 202
 */

class ExtractData {

    constructor() {
        const oThis = this;
        oThis.chainId = program.chainId;

        oThis.blockScanner = new BlockScanner(oThis.chainId);
        oThis.ProcessLocker = new ProcessLockerKlass();
        oThis.chainType = "aux";
        oThis.redshiftClient = new RedshiftClient();

    }


    handle() {
        cronConstants.setSigIntSignal();
    }

    async perform() {
        let oThis = this;
        process.on('SIGINT', oThis.handle);
        process.on('SIGTERM', oThis.handle);
        oThis.ProcessLocker.canStartProcess({process_title: 'cron_extract_data_c_' + parseInt(program.chainId) + "_" + parseInt(program.startBlock) + "_" +
                parseInt(program.endBlock) + "_" + Constant.ENVIRONMENT + "_" + Constant.SUB_ENVIRONMENT + "_" + Constant.ENV_SUFFIX });


        try {

            if (program.mysql !== 'false' && program.mysql != undefined) {
                await oThis.extractMysqlData();
            }

            if (program.blockScanner !== 'false' && program.blockScanner != undefined){
                await oThis.extractBlockScannerData(await oThis.getStartBlock(), await oThis.getEndBlock());
            }
        } catch (e) {
            logger.error("Terminating error due to exception", e);
            process.exit(1);
        }
        logger.log("ending the process with success");
        process.exit(0);


    }


    async extractMysqlData() {
        const oThis = this;
        let startTime = Date.now();
        logger.log("processing started at", startTime);
        let promiseArray = [];
        let mysqlService;


        for (let table of program.tables.split(",")){
            mysqlService = new MysqlService({chainId: oThis.chainId, model: table});
            promiseArray.push(mysqlService.process());
        }

        Promise.all(promiseArray).then(()=>{
            let endTime = Date.now();
            logger.log("processing finished at", endTime);
            logger.log("Total time to process in milliseconds", (endTime - startTime));
            return Promise.resolve({});
        }).catch((e)=>{return Promise.reject(e);});



        // let mysqlService = new MysqlService({chainId: oThis.chainId, model: "token"});
        // await mysqlService.process();

            }

    /**
     * Method to call block-scanner service by passing start block, end block and chainId
     *
     * @param {number} startBlock - start block
     *
     * * @param {number} endBlock - end block
     *
     */
    async extractBlockScannerData(startBlock, endBlock) {

        const oThis = this;
        let isStartBlockGiven;
        let startTime = Date.now();
        logger.step("block processing started start block =>" + startBlock + ". end block => " + endBlock);

        logger.step("processing started at", startTime);

        isStartBlockGiven = !!program.startBlock;

        let blockScannerService = new BlockScannerService(oThis.chainId, startBlock, endBlock, oThis.chainType, isStartBlockGiven);



        let lastProcessedBlock = await blockScannerService.process();

        let endTime = Date.now();
        logger.win("processing finished at", endTime);

        logger.win("Total time to process in milliseconds", (endTime - startTime));
    }


    /**
     * get start block based on whether it is passed or not from command
     *
     * * @return {number} start block to process
     *
     */
    async getStartBlock() {
        const oThis = this;
        return program.startBlock ? parseInt(program.startBlock) : await oThis.getStartBlockFromRedShift();
    }

    /**
     * get start block from redshift
     *
     * * @return {number} start block from redshift
     *
     */
    getStartBlockFromRedShift() {
        const oThis = this;
        return oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId + " where property =$1", [dataProcessingInfoGC.lastProcessedBlockProperty]).then((res) => {
            return parseInt(res.rows[0].value) + 1;
        });
    }


    /**
     * get last finalized block if end block is not given. else passed end block is returned
     *
     * * @return {number} end block
     *
     */
    async getEndBlock() {
        const oThis = this;
        let lastFinalizedBlock = await oThis.getEndBlockFromBlockScanner();
        return program.endBlock && parseInt(program.endBlock) <= lastFinalizedBlock ? parseInt(program.endBlock) : parseInt(lastFinalizedBlock);
    }

    /**
     * get last finalized block
     *
     * * @return {number} end block
     *
     */
    async getEndBlockFromBlockScanner() {


        const oThis = this,
            finalizedBlockResp = await oThis.blockScanner.getChainCronData();

        return finalizedBlockResp[oThis.chainId]["lastFinalizedBlock"];
    }


}


const extractData = new ExtractData();
extractData.perform();