const rootPrefix = "../..",
    Base = require( "./base"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/blockScanner/transactions");



class Transactions extends Base{
    constructor(params){
        super(params);
        const oThis = this;
        oThis.model = new TransactionsModel({config: {chainId: oThis.chainId, chainType: oThis.chainType}});


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
                for (let txHash in object.data) {
                    let r = oThis.formatBlockScannerDataToArray({object: object.data[txHash]});
                    if (!r.success) {
                        return Promise.reject(r);
                    }
                    if(r.data.data.length > 0){
                        arrayOfObjects.push(r.data.data);
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
    get recordsToProcessPerSplit(){
        return blockScannerGC.transactionsBatchSize;
    }

    /**
     * return instance to fetch transactions for given tx hashes
     *
     * * @params {array} transactionHashes
     * * @return {object}
     *
     */
    getBlockScannerData(transactionHashes){
        const oThis = this;
        return new oThis.blockScanner.transaction.Get(oThis.chainId, transactionHashes);
    }





}

module.exports = Transactions;