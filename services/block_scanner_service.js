const rootPrefix = "..",
    RedshiftClient = require("node-redshift"),
    Constants = require(rootPrefix + "/configs/constants"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    shell = require("shelljs"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    cronConstants = require(rootPrefix + "/lib/globalConstants/cronConstants"),
    TransactionsModel = require(rootPrefix + "/models/redshift/blockScanner/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/blockScanner/transfers"),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    responseHelper = require(rootPrefix + '/lib/formatter/response')

;


/**
 *
 * Block scanner service
 * @class
 *
 */
class BlockScannerService {
    /**
     *
     * @param {Object} chainId, startBlock, endBlock
     *
     * @constructor
     */
    constructor(chainId, startBlock, endBlock, isStartBlockGiven) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.batchStartBlock = oThis.nextBlockToProcess = startBlock;
        oThis.endBlock = endBlock;
        oThis.isStartBlockGiven = isStartBlockGiven;
        oThis.redshiftClient = new RedshiftClient(Constants.PRESTAGING_REDSHIFT_CLIENT);
        oThis.applicationMailer = new ApplicationMailer();

        oThis.operationIterator = {
            transactions: {localPath: "/transactions", model: TransactionsModel},
            transfers: {localPath: "/transfers", model: TransfersModel}
        };

        oThis.modelNamesInOrder = ['transfers', 'transactions'];
        oThis.redshiftClient = new RedshiftClient();
    }


    /**
     * process block scanning in batches
     *
     * * @return {number} last processed block
     *
     */
    async process() {
        const oThis = this;
        let res,
            batchNo = 1;

        logger.step("BlockScanner Service Started");

        while (oThis.batchStartBlock <= oThis.endBlock && (! cronConstants.getSigIntSignal )) {
            try {
                res = await oThis.runBatchBlockScanning(batchNo);
                batchNo++;
                if(! res.success){
                    return Promise.reject(res);
                }
                oThis.batchStartBlock = res.data.lastProcessedBlock + 1;
            } catch (e) {
                logger.log("exception =>", e);
                return Promise.reject(responseHelper.error({
                    internal_error_identifier: 's_bss_p_1',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: {error: e}
                }));
            }
        }
        logger.step("BlockScanner Service Ended");
        return Promise.resolve(responseHelper.successWithData({}));
    }

    /**
     * block scanning for each batch
     *
     * * @return {Promise}
     *
     */
    async runBatchBlockScanning(batchNo) {
        const oThis = this;
        let promiseArray = [],
            s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`,
            localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${s3UploadPath}`;

        logger.step("BlockScanner::runBatchBlockScanning Batch started- ", batchNo, " startBlock- " + oThis.batchStartBlock +
            "lastProcessBlock- " + oThis.batchEndBlock);
        oThis.currentBatchEndBlock = oThis.batchEndBlock;


        oThis.blockScanner = new BlockScanner(oThis.chainId, localDirFullFilePath);

        //run block parsers in parallel
        for (let i = 0; i < blockScannerGC.noOfBlocksToProcessTogether; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                oThis.nextBlockToProcess = oThis.batchStartBlock + i;
                oThis.processBlock(oThis.nextBlockToProcess, i).then((res)=>{
                    resolve(res);
                })
                    .catch(function (err) {
                        logger.error("err in runBatchBlockScanning", err);
                        reject(err);
                    });
            }));
        }

        return Promise.all(promiseArray).then(
            async function (res) {

                res = await oThis.loadIntoTempTable(batchNo, s3UploadPath, localDirFullFilePath);

                if (!res.success) {
									oThis.applicationMailer.perform({subject: 'blockScanner:loadIntoTempTable failed', body: {error:res}});
                    return Promise.resolve(res);
                }

                logger.log("Starting validateAndMoveFromTempToMain");

                for (let operationModelName of oThis.modelNamesInOrder) {
                    if (!res.data.modelsWithData[operationModelName]) {
                        continue;
                    }

                    try {
                        let operationModel = new oThis.operationIterator[operationModelName].model({config: {chainId: oThis.chainId}});
                        await operationModel.validateAndMoveFromTempToMain(oThis.batchStartBlock, oThis.currentBatchEndBlock);
                    } catch (e) {
                        logger.error("error", e);

                        let error = responseHelper.error({
                            internal_error_identifier: 's_bss_rbbs_1',
                            api_error_identifier: 'validateAndMoveFromTempToMain failed',
                            debug_options: {error: e}
                        });

                        oThis.applicationMailer.perform({subject: 'validateAndMoveFromTempToMain failed', body: error});
                        return Promise.reject(error);
                    }
                }

                await oThis.updateLastProcessedBlock();

                return Promise.resolve(responseHelper.successWithData({lastProcessedBlock: oThis.currentBatchEndBlock}));

            }).catch((err) => {
            logger.log("exception =>", err);
            oThis._deleteLocalDirectory(localDirFullFilePath);
            return Promise.reject(responseHelper.error({
                internal_error_identifier: 's_bss_rbbs_2',
                api_error_identifier: 'runBatchBlockScanning error',
                debug_options: {error: err}
            }));

        });
    }

    /**
     * upload to S3
     *
     * @param {string} s3UploadPath
     * * @param {string} localDirFullFilePath
     * * @return {Promise}
     *
     */
    async loadIntoTempTable(batchNo, s3UploadPath, localDirFullFilePath) {
        const oThis = this;
        logger.log("BlockScanner::runBatchBlockScanning Batch-", batchNo, " all blocks parsed");

        let promiseArray = [],
            modelsWithData = {};

        for (let modelName in oThis.operationIterator) {
            let modelToPerform = oThis.operationIterator[modelName];

            logger.log("Starting s3 folder upload for Batch- ", batchNo, "for model- ", modelName);

                promiseArray.push( oThis.uploadToS3(`${s3UploadPath}${modelToPerform.localPath}/`,
                `${localDirFullFilePath}${modelToPerform.localPath}`)
                .then(async function (res) {
                    logger.log("files uploaded to s3 for Batch- ", batchNo, "for model- ", modelName);

                    if (!res.data.hasFiles) {
                        return Promise.resolve(res);
                    }

                    let operationModel = new modelToPerform.model({config: {chainId: oThis.chainId}});
                    modelsWithData[modelName] = true;
                    let resp =  await operationModel.copyFromS3(
                        `${s3UploadPath}${modelToPerform.localPath}/`);
                    return Promise.resolve(resp);
                })
                .catch(function (err) {
                    logger.error(err);
                    let error = responseHelper.error({
                        internal_error_identifier: 's_bss_litt_2',
                        api_error_identifier: 'block scanner failed',
                        debug_options: {error: err}
                    });
                    oThis.applicationMailer.perform({subject: 'block scanner failed', body: {error:error}});

                    return Promise.resolve(error);

                })
            )
        }


        return Promise.all(promiseArray).then(function (resArray) {

            for (let res of resArray) {
                if (!res.success) {
                    return res;
                }
            }
            return responseHelper.successWithData({modelsWithData: modelsWithData});
        });
    }

    /**
     * upload to S3
     *
     * @param {string} s3UploadPath
     * * @param {string} localDirFullFilePath
     * * @return {Promise}
     *
     */
    async uploadToS3(s3UploadPath, localDirFullFilePath) {

        const oThis = this;

        let s3Write = new S3Write({
                "region": Constants.S3_REGION,
                "accessKeyId": Constants.S3_ACCESS_KEY,
                "secretAccessKey": Constants.S3_ACCESS_SECRET
            },
            {
                s3_bucket_name: Constants.S3_BUCKET_NAME,
                bucket_path: s3UploadPath,
                dir_path: localDirFullFilePath
            });

        let res = await s3Write.uploadFiles();
        oThis._deleteLocalDirectory(localDirFullFilePath);
        return res;
    }

    /**
     * processes given block
     *
     * @param {number} blockNumber
     * @param {number} i
     * * @return {Promise}
     *
     */
    processBlock(blockNumber, i) {
        const oThis = this;
        return new Promise(function (resolve, reject) {
            if (oThis.currentBatchEndBlock < blockNumber) {
                return resolve({success: true});
            } else {
                return oThis.blockScanner.asyncPerform(blockNumber)
                    .then(function (res) {
                        if (res.success) {
                            logger.info("successfully parsed for blockNumber ", blockNumber, " thread=> ", i);
                            return resolve(oThis.processBlock(++oThis.nextBlockToProcess, i))
                        } else {
                            oThis.applicationMailer.perform({subject: 'block scanner failed', body: {error:res}});
                            return reject(res);
                        }
                    })
                    .catch(function (err) {
                        logger.error(err);
                        logger.error("block number, ", blockNumber);
                        let error = responseHelper.error({
                            internal_error_identifier: 's_bss_pb_2',
                            api_error_identifier: 'block scanner failed',
                            debug_options: {blockNumber: blockNumber}
                        });
                        oThis.applicationMailer.perform({subject: 'block scanner failed', body: {error: error}});
                        return reject(error);

                        //tomorrow we can exit from here i.e. reject({success: false})
                        // return resolve(oThis.processBlock(++oThis.nextBlockToProcess, i));
                    });
            }
        });
    }


    /**
     * return batch end block
     *
     * * @return {number}
     *
     */
    get batchEndBlock() {
        const oThis = this;
        let noOfBlocks = blockScannerGC.noOfBlocksToProcessTogether * blockScannerGC.S3WriteCount;

        return (oThis.batchStartBlock + noOfBlocks - 1) > oThis.endBlock ? oThis.endBlock :
            (oThis.batchStartBlock + noOfBlocks - 1);
    }

    /**
     * update last processed block
     *
     * * @return {promise}
     *
     */
    async updateLastProcessedBlock() {
        const oThis = this;
        if (oThis.isStartBlockGiven == false) {
            logger.step("Starting updateLastProcessedBlock");
            return oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId + " set value=$1 " +
                "where property=$2", [oThis.currentBatchEndBlock, dataProcessingInfoGC.lastProcessedBlockProperty]).then((res) => {
                logger.log("last processed block updated successfully");
            });
        }
    }

    /**
     * Delete local directory
     *
     */
    async _deleteLocalDirectory(localDirFullFilePath) {
        shell.rm("-rf", localDirFullFilePath);
        logger.log("The directory " + localDirFullFilePath + " is deleted successfully");
    }
}


module.exports = BlockScannerService;