const rootPrefix = "..",
    RedshiftClient = require("node-redshift"),
    Constants = require(rootPrefix + "/configs/constants"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redShift/dataProcessingInfo"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers"),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    responseHelper = require(rootPrefix + '/lib/formatter/response')

;

class BlockScannerService {

    constructor(chainId, startBlock, endBlock) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.blockScannerResponse = [];
        oThis.batchStartBlock = oThis.nextBlockToProcess = startBlock;
        oThis.endBlock = endBlock;
        oThis.redshiftClient = new RedshiftClient(Constants.PRESTAGING_REDSHIFT_CLIENT);
        oThis.applicationMailer = new ApplicationMailer();
    }

    async process() {
        const oThis = this;
        let r;

        while (oThis.batchStartBlock <= oThis.endBlock) {
            r = await oThis.runBatchBlockScanning(oThis.batchStartBlock);
        }
        return oThis.lastProccessedBlock;

    }

    async runBatchBlockScanning(currentBatchStartBlock) {
        const oThis = this;
        let promiseArray = [],
            s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`,
            copyToRedshiftPromise = [],
            localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${s3UploadPath}`;

        logger.log("batch processing started with batch start block => " + currentBatchStartBlock +
            ", last processed block => " + oThis.batchEndBlock);

        oThis.blockScanner = new BlockScanner(oThis.chainId, localDirFullFilePath);
        for (let i = 0; i < blockScannerGC.noOfBlocksToProcessTogether; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                oThis.nextBlockToProcess = currentBatchStartBlock + i;
                oThis.processBlock(oThis.nextBlockToProcess).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            }));
        }
        return Promise.all(promiseArray).then(
            async function (res) {

                logger.log("block data fetched for current batch => start block " + currentBatchStartBlock);

                const operationIterator = [{localPath: "/transactions", model: TransactionsModel},
                    {localPath: "/transfers", model: TransfersModel}];

                let uploadToS3Promise = [];

                for (let modelToPerform of operationIterator) {
                    uploadToS3Promise.push(
                        await oThis.uploadToS3(`${s3UploadPath}${modelToPerform.localPath}/`,
                            `${localDirFullFilePath}${modelToPerform.localPath}`)
                    );
                }
                return Promise.all(uploadToS3Promise).then(async (res) => {

                    for (let i in res) {
                        if (res[i].success && res[i].data.hasFiles) {

                            logger.log("files uploaded to s3 for current batch successfully ");


                            let operationModel = new operationIterator[i].model({config: {chainId: oThis.chainId}});
                            operationModel.initRedshift();
                            copyToRedshiftPromise.push(await operationModel.copyFromS3(
                                `${s3UploadPath}${operationIterator[i].localPath}/`));
                        } else {
                            logger.log("This batch did not have blocks with transactions");
                        }
                    }
                    return Promise.all(copyToRedshiftPromise).then((res) => {
                        oThis.lastProccessedBlock = oThis.batchEndBlock;
                        oThis.batchStartBlock = oThis.lastProccessedBlock + 1;
                        oThis.updateLastProcessedBlock();
                        logger.log("download to redshift has been completed. last processed block" + oThis.lastProccessedBlock);
                        return Promise.resolve(responseHelper.successWithData({lastProcessedBlock: oThis.lastProccessedBlock}));
                    }).catch((err) => {
                        let error = responseHelper.error({
                            internal_error_identifier: 's_bss_rbbs_1',
                            api_error_identifier: 'redshift_download_breaking',
                            debug_options: {err: err}
                        });
                        oThis.applicationMailer.perform(error);
                        return Promise.reject(error);
                    });
                }).catch((err) => {
                    return Promise.reject(responseHelper.error({
                        internal_error_identifier: 's_bss_rbbs_2',
                        api_error_identifier: 's3_upload_breaking',
                        debug_options: {}
                    }));

                });
            }
        )
    }


    async uploadToS3(s3UploadPath, localDirFullFilePath) {

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

        return await s3Write.uploadFiles();

    }

    processBlock(blockNumber) {
        const oThis = this;
        return new Promise(function (resolve, reject) {
            if (oThis.batchEndBlock < blockNumber) {
                return resolve({success: true});
            } else {
                return oThis.blockScanner.asyncPerform(blockNumber)
                    .then(function (res) {
                        if (res.success){
                            oThis.blockScannerResponse.push(res);
                            if(! res.data.hasTransactionsHashes){
                                logger.log("no transactions for block no. " + res.data.blockNumber);
                            } else{
                                logger.log("data fetched from blockscanner for block " + res.data.blockNumber + " successfully");
                            }


                        } else {
                            oThis.applicationMailer.perform(res);
                        }
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess))

                    })
                    .catch(function (err) {
                        oThis.applicationMailer.perform(err);
                        //tomorrow we can exit from here i.e. reject({success: false})
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess));
                    });
            }
        });
    }


    get batchEndBlock() {
        const oThis = this;
        let noOfBlocks = blockScannerGC.noOfBlocksToProcessTogether * blockScannerGC.S3WriteCount;

        return (oThis.batchStartBlock + noOfBlocks - 1) > oThis.endBlock ? oThis.endBlock :
            (oThis.batchStartBlock + noOfBlocks - 1);
    }


    async updateLastProcessedBlock() {
        const oThis = this;
        return oThis.redshiftClient.query("update " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId +  " set value=" + oThis.lastProccessedBlock + " " +
            "where property='" + dataProcessingInfoGC.lastProcessedBlockProperty + "'").then((res) => {
            logger.log("last processed block updated successfully");
        });
    }
}


module.exports = BlockScannerService;