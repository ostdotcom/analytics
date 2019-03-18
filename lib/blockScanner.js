const rootPrefix = "..",
    OSTBlockScanner = require("@ostdotcom/ost-block-scanner"),
    blockScannerConfigFile = require(rootPrefix + "/block_scanner_config.json"),
    Transactions = require(rootPrefix + "/lib/blockScanner/transactions"),
    Transfers = require(rootPrefix + "/lib/blockScanner/transfers");




class BlockScanner{
    constructor(chainId, localFilePath, blockScannerConfigParam){
        const oThis = this;
        oThis.chainId = chainId;
        oThis.localFilePath = localFilePath;
        let blockScannerConfig = blockScannerConfigParam || blockScannerConfigFile;
        oThis.blockScanner = new OSTBlockScanner(blockScannerConfig);
        oThis.pathToWrite = localFilePath;
    }

    async getTransactionHashes(blockNumber) {
        const oThis = this,
            getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber);
        oThis.blockNumber = blockNumber;
        oThis.transactionHashesResponse = await getTransaction.asyncPerform();
        return oThis.transactionHashesResponse.params.success_data.transactionHashes;
    }


    async asyncPerform(blockNumber){
        const oThis = this;
        oThis.transactionHashes = await oThis.getTransactionHashes(blockNumber);
        let transactions = new Transactions(oThis.getInitParams);
        await transactions.asyncPerform();

        let transfers = new Transfers(oThis.getInitParams);
        await transfers.asyncPerform();

    }


    get getInitParams(){
        const oThis = this;
        return {
            transactionHashes: oThis.transactionHashes,
            pathToWrite: oThis.pathToWrite,
            blockScanner: oThis.blockScanner,
            chainId: oThis.chainId,
            blockNumber: oThis.blockNumber
        }
    }


    async getChainCronData() {
        const oThis = this;
        const chainCronData = new oThis.blockScanner.model.ChainCronData({consistentRead: 1}),
            res = await chainCronData.getCronData(oThis.chainId);
        return res;

    }

}

module.exports = BlockScanner;