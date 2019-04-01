const rootPrefix = ".",
    Base = require(rootPrefix + "/base");

/**
 * DataProcessingInfo constants
 *
 * @module lib/globalConstant/redshift/dataProcessingInfo
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

    get getTableName(){
        return "data_processing_info";
    }

    get lastProcessedBlockProperty() {
        return 'last_processed_block';
    }

    get tokenLastUpdatedAtProperty() {
        return 'token_last_updated_at';
    }

}

module.exports =  new DataProcessingInfo();
