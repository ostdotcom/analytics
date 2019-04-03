const rootPrefix = "..",
    OSTBlockScanner = require("@ostdotcom/ost-block-scanner"),
    constants = require(rootPrefix + "/configs/constants"),
    blockScannerConfigFile = constants.BLOCK_SCANNER_CONFIG_FILE_PATH ? require(constants.BLOCK_SCANNER_CONFIG_FILE_PATH) :
        require(rootPrefix + "/block_scanner_config.json"),
    Transactions = require(rootPrefix + "/lib/blockScanner/transactions"),
    Transfers = require(rootPrefix + "/lib/blockScanner/transfers"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    logger = require(rootPrefix + '/helpers/custom_console_logger.js')

;


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
        let res;


        try{
            res = await oThis.getTransactionHashes(blockNumber);
        } catch(err){
            return Promise.reject(err);
        }

            if (!res.success) return res;

            let transactionHashes = res.data.transactionHashes;

            if (transactionHashes.length == 0) {
                logger.note("no transactionHashes for block no. " + blockNumber);
                return Promise.resolve(responseHelper.successWithData({blockNumber: blockNumber, hasTransactionsHashes: false}));
            }

            logger.win("found transactionHashes for block " + blockNumber );

            let initParams = oThis.getInitParams(blockNumber, transactionHashes),
            transactions = new Transactions(initParams),
            transfers = new Transfers(initParams);
            return Promise.all([transfers.asyncPerform(), transactions.asyncPerform()]).then(function (res) {
                return Promise.resolve(responseHelper.successWithData({blockNumber: blockNumber, hasTransactionsHashes:true}));
            }).catch(function (err) {
                logger.error(err);
                return Promise.resolve(responseHelper.error({
                        internal_error_identifier: 'l_bs_ap',
                        api_error_identifier: '',
                        debug_options: {blockNumber: blockNumber, error: err}
                    }
                ));
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
        const oThis = this;
        let getTransaction, response, data, nextPagePayload = {}, txHashes = [];
        while(true){
            getTransaction = new oThis.blockScanner.block.GetTransaction(oThis.chainId, blockNumber, nextPagePayload);

            response = await getTransaction.asyncPerform();

            if(! response.success){
                return response;
            }

            data = response.data;
            if(data.transactionHashes.length){
                txHashes = txHashes.concat(data.transactionHashes);
            }
            if (! data.nextPagePayload.LastEvaluatedKey){
                  break;
            }
            nextPagePayload = {nextPagePayload: data.nextPagePayload};
        }
        return responseHelper.successWithData({transactionHashes: txHashes});

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