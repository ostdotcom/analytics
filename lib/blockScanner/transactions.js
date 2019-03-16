const rootPrefix = "../..",
    Base = require( "./base"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers");





class Transactions extends Base{
    constructor(chainId, localFilePathToWrite, blockScannerConfigParam){
        super(chainId, localFilePathToWrite, blockScannerConfigParam)

    }

    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let innerArray of arrayToFormat) {
            for (let object of innerArray) {
                for (let txHash in object.data) {
                    let model = new TransactionsModel({object: object.data[txHash], config: {chainId: oThis.chainId}});
                    let r = model.formatBlockScannerDataToArray();
                    if (!r.success) {
                        continue;
                    }
                    arrayOfObjects.push(r.data.data);
                }
            }
        }
        return arrayOfObjects;
    }


    get recordsToProcessPerSplit(){
        return blockScannerGC.transactionCount;
    }

    getBlockScannerData(transactionHashes){
        const oThis = this;
        return new oThis.blockScanner.transaction.Get(oThis.chainId, transactionHashes);
    }

    get getFilePath(){
        return "/transactions";
    }





}

module.exports = Transactions;