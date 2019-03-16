const rootPrefix = "..",
    RedshiftClient = require("node-redshift"),
    program = require("commander"),
    Constant = require(rootPrefix + "/configs/constants"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redShift/dataProcessingInfo");
    BlockScannerService = require(rootPrefix + "/services/block_scanner_service.js"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner/base");


//

program
    .version('0.1.0')
    .option('--chainId <chainId>', 'Chain id, mandatory param')
    .option('--blockScanner <blockScanner>', 'Extract data from block scanner')
    .option('--startBlock <startBlock>', 'start block number')
    .option('--endBlock <endBlock>', 'end block number')
    .option('--token <token>', 'Extract token data')
    .parse(process.argv);



class ExtractData {

    constructor() {
        const oThis = this;
        oThis.chainId = program.chainId;

        oThis.blockScanner = new BlockScanner(oThis.chainId);
        oThis.redshiftClient = new RedshiftClient(Constant.REDSHIFT_CLIENT)

    }

    async perform() {
        let oThis = this;
        // it means no parameter is given, in this case we need to extract data from block-scanner as well as
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
    }

    extractTokens() {

    }

    extractBlockScannerData(startBlock, endBlock) {
        const oThis = this;
        let blockScannerService = new BlockScannerService(oThis.chainId);
        return blockScannerService.processTransactions(startBlock, endBlock);
    }


    async getStartBlock() {
        const oThis = this;
        return program.startBlock ? parseInt(program.startBlock) : await oThis.getStartBlockFromRedShift();
    }

    getStartBlockFromRedShift() {
        const oThis = this;
        return oThis.redshiftClient.query("select * from " + dataProcessingInfoGC.getTableNameWithSchema).then((res) => {
            let lastProcessedBlock = res.rows.filter((row) => (row.property == dataProcessingInfoGC.lastProcessedBlockProperty));
            return parseInt(lastProcessedBlock[0].value);
        });
    }

    async getEndBlock() {
        const oThis = this;
        let lastFinalizedBlock = await oThis.getEndBlockFromBlockScanner();
        return program.endBlock && program.endBlock < lastFinalizedBlock ? parseInt(program.endBlock) : lastFinalizedBlock;
    }

    async getEndBlockFromBlockScanner() {
        const oThis = this,
            finalizedBlockResp = await oThis.blockScanner.getChainCronData();
        return finalizedBlockResp[oThis.chainId]["lastFinalizedBlock"];

    }


}


const extractData = new ExtractData();
extractData.perform();