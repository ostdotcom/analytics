const rootPrefix = ".",
    Base = require(rootPrefix + "/base");

/**
 * DataProcessingInfo constants
 *
 * @module lib/globalConstant/redShift/dataProcessingInfo
 */

/**
 * Class for DataProcessingInfo constants
 *
 * @class
 */
class DataProcessingInfo extends Base {
    /**
     * Constructor for token constants
     *
     * @constructor
     */
    constructor() {
        super()
    }

    // Token deployment status starts.

    static get getTableName(){
        return "data_processing_info";
    }

    static get lastProcessedBlockProperty() {
        return 'last_processed_block';
    }


}

module.exports =  new DataProcessingInfo();
