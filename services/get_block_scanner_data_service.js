const rootPrefix = "..",
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    BlockScannerService = require(rootPrefix + "/services/block_scanner_service"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    TransactionsModel = require(rootPrefix + "/models/redshift/blockScanner/transactions")
;


class GetBlockScannerDataService {


    constructor(params) {
        const oThis = this;
        oThis.chainId = params.chainId;
        oThis.chainType = params.chainType;
        oThis.startBlock = params.startBlock;
        oThis.endBlock = params.endBlock;
        oThis.redshiftClient = new RedshiftClient();
        oThis.blockScanner = new BlockScanner(oThis.chainId);
        oThis.transactionModel = new TransactionsModel({config: {chainId: oThis.chainId, chainType: oThis.chainType}});
    }


    async perform(startBlock, endBlock) {
        const oThis = this;
        oThis.isStartBlockGiven = !!startBlock;
        await oThis.extractBlockScannerData(startBlock, endBlock);
        return Promise.resolve(responseHelper.successWithData({}));
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

        startBlock = await oThis.getStartBlock(startBlock);
        endBlock = await oThis.getEndBlock(endBlock);

        let startTime = Date.now();
        logger.step("block processing started start block =>" + startBlock + ". end block => " + endBlock);

        logger.step("processing started at", startTime);


        let blockScannerService = new BlockScannerService({
            chainId: oThis.chainId, startBlock: startBlock,
            endBlock: endBlock, chainType: oThis.chainType,
            isStartBlockGiven: oThis.isStartBlockGiven
        });

        await blockScannerService.process();

        let endTime = Date.now();
        logger.win("processing finished at", endTime);

        logger.win("Total time to process in milliseconds", (endTime - startTime));

        return Promise.resolve(responseHelper.successWithData({}));
    }


    /**
     * get start block based on whether it is passed or not from command
     *
     * * @return {number} start block to process
     *
     */
    async getStartBlock(startBlock) {
        const oThis = this;
        return startBlock ? parseInt(startBlock) : await oThis.getStartBlockFromRedShift();
    }

    /**
     * get start block from redshift
     *
     * * @return {number} start block from redshift
     *
     */
    getStartBlockFromRedShift() {
        const oThis = this;

        return oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + " where property =$1", [oThis.transactionModel.getDataProcessingPropertyName]).then((res) => {
            return parseInt(res.rows[0].value) + 1;
        });
    }


    /**
     * get last finalized block if end block is not given. else passed end block is returned
     *
     * * @return {number} end block
     *
     */
    async getEndBlock(endBlock) {
        const oThis = this;
        let lastFinalizedBlock = await oThis.getEndBlockFromBlockScanner();
        return endBlock && parseInt(endBlock) <= lastFinalizedBlock ? parseInt(endBlock) : parseInt(lastFinalizedBlock);
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

module.exports = GetBlockScannerDataService;