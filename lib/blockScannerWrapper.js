const BlockScanner = require("@ostdotcom/ost-block-scanner"),
    rootPrefix = "..",
    blockScannerConfigFile = require(rootPrefix + "/block_scanner_config.json")


;


class BlockScannerWrapper {
    constructor(chainId, blockScannerConfigParam) {

        const oThis = this;
        oThis.chainId = chainId;
        let blockScannerConfig = blockScannerConfigParam || blockScannerConfigFile;
        oThis.blockScanner = new BlockScanner(blockScannerConfig);
    }

    async getTransactionHashes(blockNumber) { // 399018
        console.log("==========getTransactionHashes===============");
        console.log(blockNumber);
        console.log("==========getTransactionHashes===============");
        const oThis = this;
            // getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber);
        // oThis.transactionHashesResponse = await getTransaction.asyncPerform();
        // oThis.transactionHashesResponse = await oThis.resolveAfter2Seconds(blockNumber);
        return oThis.resolveAfter2Seconds(blockNumber);
//        oThis.transactionHashes = oThis.transactionHashesResponse.params.success_data.transactionHashes;


        // console.log("*************************************************************");
        // // console.log(oThis.transactionHashes);
        // console.log(oThis.transactionHashes.params.success_data.transactionHashes);
        // console.log("*************************************************************");


    }


    resolveAfter2Seconds(x) {
        let arr = [20000, 20, 200];
        return new Promise(resolve => {
            setTimeout(() => {
                console.log("====timeout==================", arr[Math.floor(Math.random()*arr.length)]);
                resolve(x);
            }, arr[Math.floor(Math.random()*arr.length)]);
        });
    }


    async getTransactions(blockNumber) {

        const oThis = this;

        await oThis.getTransactionHashes(blockNumber);

        const getTransaction = new oThis.blockScanner.transaction.Get(oThis.chainId, oThis.transactionHashes);
        const transactions = await getTransaction.asyncPerform();
        return transactions.params;


    }


    async getChainCronData() {
        const oThis = this;
        const chainCronData = new oThis.blockScanner.model.ChainCronData({consistentRead: 1}),
            resp = await chainCronData.getCronData(oThis.chainId);
        console.log(resp);
    }


    async getTransfers(blockNumber) {

        const oThis = this;

        await oThis.getTransactionHashes(blockNumber);

        const getTransfers = new oThis.blockScanner.transfer.GetAll(oThis.chainId, oThis.transactionHashes);

        const transfers = await getTransfers.asyncPerform();

        console.log(transfers.params);
        return transfers.params.success_data;
    }

}


module.exports = BlockScannerWrapper;