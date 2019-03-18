const rootPrefix = "../..",
    Base = require("./base"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers");


class Transactions extends Base {
    constructor(params) {
        super(params)

    }

    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let innerArray of arrayToFormat) {
            for (let object of innerArray) {
                let data = object.data;
                for (let txHash in data) {
                    let transfers = data[txHash];
                    for (let transfer in transfers) {
                        let model = new TransfersModel({object: transfers[transfer], config: {chainId: oThis.chainId}});
                        let r = model.formatBlockScannerDataToArray();
                        if (!r.success) {
                            continue;
                        }
                        arrayOfObjects.push(r.data.data);
                    }


                }
            }
        }
        return arrayOfObjects;
    }


    get recordsToProcessPerSplit() {
        return blockScannerGC.transfersBatchSize;
    }

    getBlockScannerData(transactionHashes) {
        const oThis = this;
        return new oThis.blockScanner.transfer.GetAll(oThis.chainId, transactionHashes);
    }

    get getFilePath(){
       return "/transfers";
    }



}

module.exports = Transactions;