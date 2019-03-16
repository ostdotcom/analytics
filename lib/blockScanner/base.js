const BlockScanner = require("@ostdotcom/ost-block-scanner"),
    rootPrefix = "../..",
    shell = require("shelljs"),
    blockScannerConfigFile = require(rootPrefix + "/block_scanner_config.json"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers"),
    LocalWrite = require(rootPrefix + "/lib/localWrite"),
    responseHelper = require(rootPrefix + '/lib/formatter/response');


class Base {

    constructor(chainId, localFilePathToWrite, blockScannerConfigParam) {
        const oThis = this;
        oThis.chainId = chainId;
        let blockScannerConfig = blockScannerConfigParam || blockScannerConfigFile;
        oThis.blockScanner = new BlockScanner(blockScannerConfig);
        oThis.pathToWrite = localFilePathToWrite;
    }

    async getTransactionHashes(blockNumber) {
        const oThis = this,
            getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber);
        oThis.transactionHashesResponse = await getTransaction.asyncPerform();
        oThis.transactionHashes = oThis.transactionHashesResponse.params.success_data.transactionHashes;
    }

    async asyncPerform(blockNumber) { // 399018
        const oThis = this;
        await oThis.getTransactionHashes(blockNumber);
        return await oThis.splitTransactionHashesInBatchesAndPerform(blockNumber);
    }


    async splitTransactionHashesInBatchesAndPerform(blockNumber) {
        const oThis = this;
        let totalNoOfSplits = oThis.transactionHashes.length / oThis.recordsToProcessPerSplit,
            transactionsArray = [],
            noOfBatches = Math.ceil(totalNoOfSplits / blockScannerGC.maxSplitsCount),
            noOfTransactionsPerBatch = blockScannerGC.maxSplitsCount * oThis.recordsToProcessPerSplit;
        for (let i = 0; i < noOfBatches; i++) {
            try {
                var res = await oThis.splitTransactionHashesAndPerform(oThis.transactionHashes.slice(i * noOfTransactionsPerBatch,
                    i * noOfTransactionsPerBatch + noOfTransactionsPerBatch));
            } catch (Err) {
                return Promise.reject(responseHelper.error({
                    internal_error_identifier: 'l_n_1',
                    api_error_identifier: 'unhandled_catch_response',
                    debug_options: {
                        blockNumber: blockNumber
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
        localWrite.writeArray(arrayOfList, oThis.pathToWrite + oThis.getFilePath + "/" + blockNumber + ".txt");
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


    async getChainCronData() {
        const oThis = this;
        const chainCronData = new oThis.blockScanner.model.ChainCronData({consistentRead: 1}),
            res = await chainCronData.getCronData(oThis.chainId);
        return res;

    }
}


module.exports = Base;