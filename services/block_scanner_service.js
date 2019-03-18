const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers"),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    BlockScanner = require(rootPrefix + "/lib/blockScanner"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    responseHelper = require(rootPrefix + '/lib/formatter/response');
;

class BlockScannerService {

    constructor(chainId, startBlock, endBlock) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.blockScannerResponse = [];
        oThis.batchStartBlock = oThis.nextBlockToProcess = startBlock;
        oThis.endBlock = endBlock;
    }

    async process() {
        const oThis = this;
        let r;

        while (oThis.batchStartBlock <= oThis.endBlock) {
            r = await oThis.runBatchBlockScanning(oThis.batchStartBlock);
        }

    }

    async runBatchBlockScanning(currentBatchStartBlock) {
        const oThis = this;
        let promiseArray = [],
            s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`,
            copyToRedshiftPromise = [],
            localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${s3UploadPath}`;

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
                            let operationModel = new operationIterator[i].model({config: {chainId: oThis.chainId}});
                            operationModel.initRedshift();
                            copyToRedshiftPromise.push(await operationModel.copyFromS3(
                                `${s3UploadPath}${operationIterator[i].localPath}/`));
                        }
                    }
                    return Promise.all(copyToRedshiftPromise).then((res) => {
                        oThis.lastProccessedBlock = oThis.batchEndBlock;
                        oThis.batchStartBlock = oThis.lastProccessedBlock + 1;
                        return Promise.resolve(responseHelper.successWithData({lastProcessedBlock: oThis.lastProccessedBlock}));
                    }).catch((err) => {
                        return Promise.reject(responseHelper.error({
                            internal_error_identifier: 's_bss_rbbs_1',
                            api_error_identifier: 'redshift_download_breaking',
                            debug_options: {}
                        }));
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
                            //todo send email

                        }
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess))

                    })
                    .catch(function (err) {
                        // todo: send mail
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
}


module.exports = BlockScannerService;