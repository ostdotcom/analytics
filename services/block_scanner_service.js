const rootPrefix = "..",
    shell = require("shelljs"),
    BlockScanner = require("@ostdotcom/ost-block-scanner"),
    BlockScannerWrapper = require(rootPrefix + "/lib/blockScannerWrapper"),
    Constants = require(rootPrefix + "configs/constants"),
blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner")


;

class BlockScannerService {

    constructor(chainId, startBlock, endBlock) {
        const oThis = this;
        oThis.startBlock = startBlock;
        oThis.endBlock = endBlock;
        oThis.nextBatchBlockToProcess = startBlock;
        oThis.nextBlockToProcess = startBlock;
        oThis.localDirFullFilePath = Constants.LOCAL_DIR_FILE_PATH  + "/" + Constants.SUB_ENV + "/" + chainId
            + "/" + Date.now();


        oThis.blockScannerWrapper = new BlockScannerWrapper(chainId, oThis.localDirFullFilePath);
        oThis.blockScannerResponse = [];

        shell.mkdir("-p", oThis.localDirFullFilePath );

    }


    async perform() {
        const oThis = this;
        while (oThis.nextBatchBlockToProcess <= oThis.endBlock) {
            await oThis.runBatchBlockScanning(oThis.nextBatchBlockToProcess);
        }
    }

    async runBatchBlockScanning(startBlock) {
        const oThis = this;
        let promiseArray = [];
        for (let i = 0; i < blockScannerGC.noOfBlocksToProcessTogether; i++) {
            promiseArray.push(new Promise(function (resolve, reject) {
                oThis.nextBlockToProcess = startBlock + i;
                oThis.processBlock(oThis.nextBlockToProcess, i).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            }));

        }
        return Promise.all(promiseArray).then(
            function (res) {
                console.log("promise all resolved", res);
                // with awaits
                // write to s3
                // s3 to redshift
                oThis.nextBatchBlockToProcess = oThis.getBatchLastBlockToProcess + 1;
            }
        )

    }

    processBlock(blockNumber, i) {
        console.log("main promise identifier", i);
        const oThis = this;
        return new Promise(function (resolve, reject) {
            if (oThis.getBatchLastBlockToProcess < blockNumber) {
                return resolve({success: true});
            } else {
                return oThis.blockScannerWrapper.getTransactionHashes(blockNumber)
                    .then(function (res) {

                        oThis.blockScannerResponse.push(res);
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess, i));
                    })
                    .catch(function (err) {
                        // todo: send mail
                        //tomorrow we can exit from here i.e. reject({success: false})
                        return resolve(oThis.processBlock(++oThis.nextBlockToProcess, i));
                    });
            }
        });


    }


    get getBatchLastBlockToProcess() {
        const oThis = this;
        let noOfBlocks = blockScannerGC.noOfBlocksToProcessTogether * blockScannerGC.S3WriteCount;

        return (oThis.nextBatchBlockToProcess + noOfBlocks - 1) > oThis.endBlock ? oThis.endBlock :
            (oThis.nextBatchBlockToProcess + noOfBlocks - 1)

    }


}


module.exports = BlockScannerService;