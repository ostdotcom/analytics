const rootPrefix = "../..",
    Base = require("./base"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransfersModel = require(rootPrefix + "/models/redshift/blockScanner/transfers");


class Transfers extends Base {
    constructor(params) {
        super(params);
        const oThis = this;
        oThis.model = new TransfersModel({config: {chainId: oThis.chainId, chainType: oThis.chainType}});

    }


    /**
     * FORMAT data to array of array format
     *
     * @param {number} arrayToFormat
     * * @return {array}
     *
     */
    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let innerArray of arrayToFormat) {
            for (let object of innerArray) {
                let data = object.data;
                for (let txHash in data) {
                    let transfers = data[txHash];
                    for (let transfer in transfers) {
                        let r = oThis.formatBlockScannerDataToArray({object: transfers[transfer]});
                        if (!r.success) {
                            return Promise.reject(r);
                        }
                        if(r.data.data.length > 0){
                            arrayOfObjects.push(r.data.data);
                        }
                    }
                }
            }
        }
        return Promise.resolve(arrayOfObjects);
    }


    /**
     * No of records to process per split
     *
     * * @return {number}
     *
     */
    get recordsToProcessPerSplit() {
        return blockScannerGC.transfersBatchSize;
    }


    /**
     * return instance to fetch transfers for given tx hashes
     *
     * * @params {array} transactionHashes
     * * @return {object}
     *
     */
    getBlockScannerData(transactionHashes) {
        const oThis = this;
        return new oThis.blockScanner.transfer.GetAll(oThis.chainId, transactionHashes);
    }





}

module.exports = Transfers;