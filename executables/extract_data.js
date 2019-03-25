const rootPrefix = "..",
    RedshiftClient = require("node-redshift"),
    program = require("commander"),
    Constant = require(rootPrefix + "/configs/constants"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redShift/dataProcessingInfo"),
    BlockScannerService = require(rootPrefix + "/services/block_scanner_service.js"),
    TokenService = require(rootPrefix + "/services/token"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    logger = require(rootPrefix + "/helpers/custom_console_logger");


// commander
program
    .version('0.1.0')
    .option('--chainId <chainId>', 'Chain id, mandatory param')
    .option('--blockScanner <blockScanner>', 'Extract data from block scanner')
    .option('--startBlock <startBlock>', 'start block number')
    .option('--endBlock <endBlock>', 'end block number')
    .option('--token <token>', 'Extract token data')
    .parse(process.argv);

/**
 *
 * Class for data extraction
 * @class
 *
 */
class ExtractData {

    constructor() {
        const oThis = this;
        oThis.chainId = program.chainId;

        oThis.blockScanner = new BlockScanner(oThis.chainId);
        oThis.redshiftClient = new RedshiftClient(Constant.PRESTAGING_REDSHIFT_CLIENT)

    }


    handle() {
        process.exit(1);
    }

    async perform() {
        let oThis = this;
        // it means no parameter is given, in this case we need to extract data from block-scanner as well as mysql
        if (process.argv.length == 2) {
            await oThis.extractTokens();
            await oThis.extractBlockScannerData(await oThis.getStartBlock(), await oThis.getEndBlock());

        } else {

            if (program.token === 'true') {
                await oThis.extractTokens();
            }

            if (program.blockScanner === 'true') {
                await oThis.extractBlockScannerData(await oThis.getStartBlock(), await oThis.getEndBlock());
            }
        }

        process.on('SIGINT', oThis.handle);
        setTimeout(function() {
            logger.info('Ending the process. Sending SIGINT.');
            process.emit('SIGINT');
        }, 2*1000);

    }


    async extractTokens() {
        const oThis = this;
        let startTime = Date.now();
        logger.log("processing started at", startTime);


        let tokenService = new TokenService({chainId: oThis.chainId});
        await tokenService.processTokens();

        let endTime = Date.now();
        logger.log("processing finished at", endTime);

        logger.log("Total time to process in milliseconds", (endTime - startTime));
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
        logger.log("block processing started start block =>" + startBlock + ". end block => " + endBlock);

        logger.log("processing started at", startTime);

        isStartBlockGiven = program.startBlock ? true : false;

        let blockScannerService = new BlockScannerService(oThis.chainId, startBlock, endBlock, isStartBlockGiven);

        let lastProcessedBlock = await blockScannerService.process();

        let endTime = Date.now();
        logger.log("processing finished at", endTime);

        logger.log("Total time to process in milliseconds", (endTime - startTime));
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
        return oThis.redshiftClient.query("select * from " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId + " where property = '" +
            dataProcessingInfoGC.lastProcessedBlockProperty + "'").then((res) => {
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
        return program.endBlock && program.endBlock <= lastFinalizedBlock ? parseInt(program.endBlock) : parseInt(lastFinalizedBlock);
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