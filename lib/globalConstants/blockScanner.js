'use strict';
const rootPrefix = "../..",
    Constants = require(rootPrefix + "/configs/constants")
;


/**
 * blockScanner constants
 *
 * @module lib/globalConstant/blockScanner
 */

/**
 * Class for blockScanner constants
 *
 * @class
 */
class  BlockScanner {
    /**
     * Constructor for BlockScanner constants
     *
     * @constructor
     */
    constructor() {}


    static get transferTokenCount(){
        return Constants.TRANSFER_TOKEN_COUNT;
    }

    static get transactionCount(){
        return Constants.TRANSACTION_COUNT;
    }
    static get maxSplitsCount(){
        return Constants.MAX_SPLIT_COUNT;
    }

    static get noOfBlocksToProcessTogether(){
        return Constants.NO_OF_BLOCKS_TO_PROCESS_TOGETHER;
    }

    static get S3WriteCount(){
        return Constants.S3_WRITE_COUNT;
    }



}

module.exports = BlockScanner;
