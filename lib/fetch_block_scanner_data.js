const BlockScanner = require("@ostdotcom/ost-block-scanner"),
    rootPrefix = "..",
    blockScannerConfig = require(rootPrefix + "/block_scanner_config.json")


;


const FetchBlockScannerData = function (blockScannerConfig, chainId) {

    const oThis = this;

    oThis.chainId = chainId;

    oThis.blockScanner = new BlockScanner(blockScannerConfig);


};


FetchBlockScannerData.prototype = {


    getTransactionHashes: async function (blockNumber) { //399018

        const oThis = this,
            getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber);
        oThis.transactionHashesResponse = await getTransaction.asyncPerform();
        oThis.transactionHashes =  oThis.transactionHashesResponse.params.success_data.transactionHashes;


        // console.log("*************************************************************");
        // // console.log(oThis.transactionHashes);
        // console.log(oThis.transactionHashes.params.success_data.transactionHashes);
        // console.log("*************************************************************");


    },

    getTransactions: async function (blockNumber) {

        const oThis = this;

        await oThis.getTransactionHashes(blockNumber);

        const getTransaction = new oThis.blockScanner.transaction.Get(oThis.chainId, oThis.transactionHashes);

        const transactions = await getTransaction.asyncPerform();

        console.log(transactions.params);
        return transactions.params;

    },


    getChainCronData:async function(){
        const oThis = this;
        const chainCronData = new oThis.blockScanner.model.ChainCronData({consistentRead: 1});
        resp = await chainCronData.getCronData(oThis.chainId);
        console.log(resp);
     },


    getTransfers: async function (blockNumber) {

        const oThis = this;

        await oThis.getTransactionHashes(blockNumber);

        const getTransfers = new oThis.blockScanner.transfer.GetAll(oThis.chainId, oThis.transactionHashes);

        const transfers = await getTransfers.asyncPerform();


        console.log(transfers.params);
        console.log("===============================================  =");
        console.log(transfers.params.success_data['0x8679a4c83feae1d353f888f6fd52765cae07c498e378675543f0c3c09511d644']['1']);

        console.log("===============================================  =");
        console.log(transfers.params.success_data['0x8679a4c83feae1d353f888f6fd52765cae07c498e378675543f0c3c09511d644']['2']);

        console.log("===============================================  =");


        return transfers.params.success_data;



    }

};


module.exports = FetchBlockScannerData;