const rootPrefix = "../..",
    Base = require( "./base"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions");


class Transactions extends Base{
    constructor(params){
        super(params)

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

    /**
     * return file store path
     *
     * * @return {string}
     *
     */
    get getFilePath(){
        return "/transactions";
    }





}

module.exports = Transactions;