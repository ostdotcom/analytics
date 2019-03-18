const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers"),
    S3Write = require(rootPrefix + "/lib/S3_write")
;

class BlockScannerService {

    constructor(chainId, startBlock, endBlock) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.blockScannerResponse = [];
        oThis.startBlock = oThis.nextBatchBlockToProcess = oThis.nextBlockToProcess = startBlock;
        oThis.endBlock = endBlock;
    }

    async process() {
        const oThis = this;

        while (oThis.nextBatchBlockToProcess <= oThis.endBlock) {
            await oThis.runBatchBlockScanning(oThis.nextBatchBlockToProcess);
        }
    }

    async runBatchBlockScanning(startBlock) {
        const oThis = this;
        let promiseArray = [],
            s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`,
            localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${s3UploadPath}`;

        oThis.blockScanner = new BlockScanner(oThis.chainId, localDirFullFilePath);
        for (let i = 0; i < blockScannerGC.noOfBlocksToProcessTogether; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                oThis.nextBlockToProcess = startBlock + i;
                oThis.processBlock(oThis.nextBlockToProcess).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            }));
        }
        return Promise.all(promiseArray).then(
            async function (res) {

                for (let modelToPerform of
                    [{localPath: "/transactions", model: TransactionsModel},
                        {localPath: "/transfers", model: TransfersModel}]) {

                    let r = await oThis.uploadToS3(`${s3UploadPath}${modelToPerform.localPath}/`,
                        `${localDirFullFilePath}${modelToPerform.localPath}`);

                    if (r.hasFiles) {
                        let operationModel = new modelToPerform.model({config: {chainId: oThis.chainId}});

                        operationModel.initRedshift();
                        await operationModel.copyFromS3(`${s3UploadPath}${modelToPerform.localPath}/`);
                    }
                }
                oThis.nextBatchBlockToProcess = oThis.getBatchLastBlockToProcess + 1;
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
            if (oThis.getBatchLastBlockToProcess < blockNumber) {
                return resolve({success: true});
            } else {
                return oThis.blockScanner.asyncPerform(blockNumber)
                    .then(function (res) {
                        oThis.blockScannerResponse.push(res);
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess));
                    })
                    .catch(function (err) {
                        // todo: send mail
                        //tomorrow we can exit from here i.e. reject({success: false})
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess));
                    });
            }
        });
    }


    get getBatchLastBlockToProcess() {
        const oThis = this;
        let noOfBlocks = blockScannerGC.noOfBlocksToProcessTogether * blockScannerGC.S3WriteCount;

        return (oThis.nextBatchBlockToProcess + noOfBlocks - 1) > oThis.endBlock ? oThis.endBlock :
            (oThis.nextBatchBlockToProcess + noOfBlocks - 1);
    }
}


module.exports = BlockScannerService;