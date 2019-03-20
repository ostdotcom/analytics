const rootPrefix = "..",
    OSTBlockScanner = require("@ostdotcom/ost-block-scanner"),
    blockScannerConfigFile = require(rootPrefix + "/block_scanner_config.json"),
    Transactions = require(rootPrefix + "/lib/blockScanner/transactions"),
    Transfers = require(rootPrefix + "/lib/blockScanner/transfers"),
    responseHelper = require(rootPrefix + '/lib/formatter/response');


class BlockScanner {
    constructor(chainId, localFilePath, blockScannerConfigParam) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.pathToWrite = localFilePath;
        let blockScannerConfig = blockScannerConfigParam || blockScannerConfigFile;
        oThis.blockScanner = new OSTBlockScanner(blockScannerConfig);
    }


    /**
     * get transactions and transfers. and write to local file system
     *
     * @param {number} blockNumber
     * * @return {Promise}
     *
     */
    async asyncPerform(blockNumber) {
        const oThis = this;


        return oThis.getTransactionHashes(blockNumber).then((res) => {

            if (!res.success) return res;

            let transactionHashes = res.params.success_data.transactionHashes;

            if (transactionHashes.length == 0) {
                return Promise.resolve(responseHelper.successWithData({blockNumber: blockNumber, hasTransactionsHashes: false}));
            }

            let initParams = oThis.getInitParams(blockNumber, transactionHashes),
            transactions = new Transactions(initParams),
            transfers = new Transfers(initParams);
            return Promise.all([transfers.asyncPerform(), transactions.asyncPerform()]).then(function (res) {
                return Promise.resolve(responseHelper.successWithData({blockNumber: blockNumber, hasTransactionsHashes:true}));
            }).catch(function (err) {
                return Promise.resolve(responseHelper.error({
                        internal_error_identifier: 'l_bs_ap',
                        api_error_identifier: '',
                        debug_options: {blockNumber: blockNumber}
                    }
                ));
            });

        }).catch((err) => {
            return Promise.reject(err)
        });

    }

    /**
     * fetches transactionsHashes for given block number
     *
     * @param {number} blockNumber
     * * @return {Promise}
     *
     */
    async getTransactionHashes(blockNumber) {
        const oThis = this,
            getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber);
        return getTransaction.asyncPerform().then((res) => {
            // res it self result helper
            return res;
        });
    }

    /**
     * returns init params to be send to transaction and transfers service
     *
     * @param {number} blockNumber
     * @param {list} transactionHashes
     * * @return {object}
     *
     */
    getInitParams(blockNumber, transactionHashes) {
        const oThis = this;
        return {
            transactionHashes: transactionHashes,
            pathToWrite: oThis.pathToWrite,
            blockScanner: oThis.blockScanner,
            chainId: oThis.chainId,
            blockNumber: blockNumber
        }
    }


    /**
     * returns chain cron data
     *
     * * @return {object}
     *
     */
    async getChainCronData() {
        const oThis = this;

        const chainCronData = new oThis.blockScanner.model.ChainCronData({consistentRead: 1}),
            res = await chainCronData.getCronData(parseInt(oThis.chainId));

        return res;
    }

}

module.exports = BlockScanner;