const rootPrefix = "..",
    BlockScanner = require("@ostdotcom/ost-block-scanner"),
    BlockScannerWrapper = require(rootPrefix + "/lib/blockScannerWrapper")
blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner")


;

class BlockScannerService {

    constructor(chainId, startBlock, endBlock) {
        const oThis = this;
        oThis.startBlock = startBlock;
        oThis.endBlock = endBlock;
        oThis.nextBatchBlockToProcess = startBlock;
        oThis.nextBlockToProcess = startBlock;
        oThis.blockScannerWrapper = new BlockScannerWrapper(chainId);
        oThis.blockScannerResponse = [];


    }


    async perform() {
        const oThis = this;
        await oThis.runBatchBlockScanning(oThis.nextBatchBlockToProcess, oThis.getBatchLastBlockToProcess);

    }

    async runBatchBlockScanning(startBlock, endBlock) {
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
        Promise.all(promiseArray).then(
            function (res) {
                console.log("promisealllllll resolveddddddddd");
                console.log(res);
                // with awaits
                // write to s3
                // s3 to redshift

            }
        )

    }

    processBlock(blockNumber, i ) {
        console.log("iiiiiiiiiiiiiiiii--------------------");

        console.log(i);
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