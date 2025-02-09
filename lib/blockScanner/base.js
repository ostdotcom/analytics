const rootPrefix = "../..",
    shell = require("shelljs"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    LocalWrite = require(rootPrefix + "/lib/localWrite"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ValidateAndSanitize = require(rootPrefix + '/lib/validateAndSanatize');


class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.chainId;
        oThis.chainType = params.chainType;
        oThis.blockScanner = params.blockScanner;
        oThis.pathToWrite = params.pathToWrite;
        oThis.transactionHashes = params.transactionHashes;
        oThis.blockNumber = params.blockNumber;
    }


    /**
     * performs given block
     *
     * * @return {number}
     *
     */
    async asyncPerform() { // 399018
        const oThis = this;
        return await oThis.splitTransactionHashesInBatchesAndPerform();
    }

    /**
     * split transaction hashes in batches and performs
     *
     * * @return {number}
     *
     */
    async splitTransactionHashesInBatchesAndPerform() {

        const oThis = this;
        let totalNoOfSplits = oThis.transactionHashes.length / oThis.recordsToProcessPerSplit,
            transactionsArray = [],
            arrayOfList = [],
            noOfBatches = Math.ceil(totalNoOfSplits / blockScannerGC.maxSplitsCount),
            noOfTransactionsPerBatch = blockScannerGC.maxSplitsCount * oThis.recordsToProcessPerSplit;
        for (let i = 0; i < noOfBatches; i++) {
            try {
                var res = await oThis.splitTransactionHashesAndPerform(oThis.transactionHashes.slice(i * noOfTransactionsPerBatch,
                    i * noOfTransactionsPerBatch + noOfTransactionsPerBatch));
            } catch (err) {
                return Promise.reject(responseHelper.error({
                    internal_error_identifier: 's_t_h_i_b_a_p',
                    api_error_identifier: 'unhandled_catch_response',
                    debug_options: {
                        blockNumber: oThis.blockNumber,
                        error: err
                    }
                }));
            }
            transactionsArray.push(res);
        }

        try{
            arrayOfList = await oThis.formatData(transactionsArray);
        }
        catch(e){
            return Promise.reject(e);
        }

        if (arrayOfList.length === 0) {
            return Promise.resolve(responseHelper.successWithData({hasTransactions: false}));
        }
        
        let localWrite = new LocalWrite({separator: "|"}),
            directory = oThis.pathToWrite + "/" + oThis.getFilePath ;
        shell.mkdir("-p", directory);
        localWrite.writeArray(arrayOfList,  directory + "/" + oThis.blockNumber + ".txt");
        return Promise.resolve(responseHelper.successWithData({hasTransactions: true}));
    }

    /**
     * split transaction hashes for single batch and performs
     *
     * * @return {number}
     *
     */
    async splitTransactionHashesAndPerform(transactionHashes) {
        const oThis = this;
        let noOfSplits = Math.ceil(transactionHashes.length / oThis.recordsToProcessPerSplit),
            promiseArray = [];
        for (let i = 0; i < noOfSplits; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                const getBlockScannerData = oThis.getBlockScannerData(
                    transactionHashes.slice(i * oThis.recordsToProcessPerSplit,
                        oThis.getEndBlockToProcess(i)));
                return getBlockScannerData.asyncPerform().then((res) => {
                    return resolve(res);
                }).catch((err) => {
                    return reject(err);
                });
            }));
        }
        return Promise.all(promiseArray).then(function (res) {
            return Promise.resolve(res);
        }).catch(function (err) {
            return Promise.reject(err);
        });
    }

    getEndBlockToProcess(i){
        const oThis = this;
        return oThis.recordsToProcessPerSplit * (1 + i) > oThis.transactionHashes.length ?
            oThis.transactionHashes.length: oThis.recordsToProcessPerSplit * (1 + i);
    }

    formatBlockScannerDataToArray(params) {
        const oThis = this;
        oThis.validateAndSanitize = new ValidateAndSanitize({mapping: oThis.model.constructor.mapping,
            fieldsToBeMoveToAnalytics: oThis.model.constructor.fieldsToBeMoveToAnalytics });
        let r = oThis.validateAndSanitize.perform({ object: params.object|| {} });
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }


    /**
     * return file store path
     *
     * * @return {string}
     *
     */
    get getFilePath(){
        const oThis = this;
        return oThis.model.getTableName;
    }


}


module.exports = Base;