const rootPrefix = "..",
    Constants = require(rootPrefix + "/configs/constants"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
    Transactions = require(rootPrefix + "/lib/blockScanner/transactions"),
    Transfers = require(rootPrefix + "/lib/blockScanner/transfers");


;

class BlockScannerService {

    constructor(chainId) {
        const oThis = this;
        oThis.chainId = chainId;
        oThis.blockScannerResponse = [];
    }

    async processTransactions(startBlock, endBlock) {
        const oThis = this;


        oThis.blockScannerOperation = Transactions; // new Transactions(oThis.chainId, oThis.localDirFullFilePath);
        let response = await oThis.process(startBlock, endBlock);
        return response;
    }

    async processTransfers(startBlock, endBlock) {
        const oThis = this;
        oThis.blockScannerOperation = Transfers;
        let response = await oThis.process(startBlock, endBlock);
        return response;
    }


    async process(startBlock, endBlock) {
        console.log("I m freaked", startBlock, endBlock);
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
            localDirFullFilePath = Constants.LOCAL_DIR_FILE_PATH + "/" + Constants.SUB_ENV + "/" + oThis.chainId
                + "/" + Date.now();

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
            function (res) {
                // with awaits
                // write to s3
                // s3 to redshift
                oThis.nextBatchBlockToProcess = oThis.getBatchLastBlockToProcess + 1;
            }
        )
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