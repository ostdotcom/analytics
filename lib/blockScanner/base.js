const rootPrefix = "../..",
    shell = require("shelljs"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    LocalWrite = require(rootPrefix + "/lib/localWrite"),
    responseHelper = require(rootPrefix + '/lib/formatter/response');


class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.chainId;
        oThis.blockScanner = params.blockScanner;
        oThis.pathToWrite = params.pathToWrite;
        oThis.transactionHashes = params.transactionHashes;
        oThis.blockNumber = params.blockNumber;
    }



    async asyncPerform() { // 399018
        const oThis = this;
        return await oThis.splitTransactionHashesInBatchesAndPerform();
    }


    async splitTransactionHashesInBatchesAndPerform() {

        const oThis = this;
        let totalNoOfSplits = oThis.transactionHashes.length / oThis.recordsToProcessPerSplit,
            transactionsArray = [],
            noOfBatches = Math.ceil(totalNoOfSplits / blockScannerGC.maxSplitsCount),
            noOfTransactionsPerBatch = blockScannerGC.maxSplitsCount * oThis.recordsToProcessPerSplit;
        for (let i = 0; i < noOfBatches; i++) {
            try {
                var res = await oThis.splitTransactionHashesAndPerform(oThis.transactionHashes.slice(i * noOfTransactionsPerBatch,
                    i * noOfTransactionsPerBatch + noOfTransactionsPerBatch));
            } catch (err) {
                return Promise.reject(responseHelper.error({
                    internal_error_identifier: 'l_n_1',
                    api_error_identifier: 'unhandled_catch_response',
                    debug_options: {
                        blockNumber: oThis.blockNumber
                    }
                }));
            }
            transactionsArray.push(res);
        }
        let arrayOfList = oThis.formatData(transactionsArray);
        if (arrayOfList.length === 0) {
            return Promise.resolve(responseHelper.successWithData({hasTransactions: false}));
        }

        let localWrite = new LocalWrite({separator: "|"});
        shell.mkdir("-p", oThis.pathToWrite + oThis.getFilePath);
        localWrite.writeArray(arrayOfList, oThis.pathToWrite + oThis.getFilePath + "/" + oThis.blockNumber + ".txt");
        return Promise.resolve(responseHelper.successWithData({hasTransactions: true}));
    }


    async splitTransactionHashesAndPerform(transactionHashes) {
        const oThis = this;
        let noOfSplits = transactionHashes.length / oThis.recordsToProcessPerSplit,
            promiseArray = [];
        for (let i = 0; i < noOfSplits; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                const getBlockScannerData = oThis.getBlockScannerData(
                    oThis.transactionHashes.slice(i * oThis.recordsToProcessPerSplit,
                        oThis.recordsToProcessPerSplit * (1 + i)));
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
}


module.exports = Base;