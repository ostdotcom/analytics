const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    emailNotifier = require(rootPrefix + '/lib/notifier'),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    Transactions = require(rootPrefix + "/lib/blockScanner/transactions"),
    TransactionsModel = require(rootPrefix + "/models/redshift/transactions"),
    TransfersModel = require(rootPrefix + "/models/redshift/transfers"),
    Transfers = require(rootPrefix + "/lib/blockScanner/transfers"),
    S3Write = require(rootPrefix + "/lib/S3_write")
;

class BlockScannerService {

    constructor(chainId) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.blockScannerResponse = [];
    }

    async processTransactions(startBlock, endBlock) {
        const oThis = this;
        oThis.blockScannerOperation = Transactions;
        oThis.OperationModel = TransactionsModel;
        oThis.s3DirPathSuffix = "/transactions";
        let response = await oThis.process(startBlock, endBlock);
        return response;
    }

    async processTransfers(startBlock, endBlock) {
        const oThis = this;
        oThis.blockScannerOperation = Transfers;
        oThis.OperationModel = TransfersModel;
        oThis.s3DirPathSuffix = "/transfers";
        let response = await oThis.process(startBlock, endBlock);
        return response;
    }

    async process(startBlock, endBlock) {
        const oThis = this;
        oThis.startBlock = oThis.nextBatchBlockToProcess = oThis.nextBlockToProcess = startBlock;
        oThis.endBlock = endBlock;
        while (oThis.nextBatchBlockToProcess <= oThis.endBlock) {
            await oThis.runBatchBlockScanning(oThis.nextBatchBlockToProcess);
        }
    }

    async runBatchBlockScanning(startBlock) {
        const oThis = this;
        let promiseArray = [],
            s3UploadPath = `${Constants.SUB_ENV}/${oThis.chainId}/${Date.now()}`,
            localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${s3UploadPath}`;

        oThis.blockScanner = new oThis.blockScannerOperation(oThis.chainId, localDirFullFilePath);
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

                let r = await oThis.uploadToS3(`${s3UploadPath}${oThis.s3DirPathSuffix}/`,
                    `${localDirFullFilePath}${oThis.s3DirPathSuffix}`);

                if (r.hasFiles){
                    let operationModel = new oThis.OperationModel({config: {chainId: oThis.chainId}});

                    operationModel.initRedshift();
                    //`${s3UploadPath}${oThis.s3DirPathSuffix}/`
                    await operationModel.copyFromS3(`${s3UploadPath}${oThis.s3DirPathSuffix}/`);

                }
                // with awaits
                // write to s3
                // s3 to redshift
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
                s3_bucket_link: Constants.S3_BUCKET_LINK,
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
                        emailNotifier.perform('bss_processBlock_failed_1', 'Process Block exited unexpectedly.', err, {});
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