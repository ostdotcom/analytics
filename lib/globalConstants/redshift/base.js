'use strict';
const rootPrefix = "../../..",
    Constants = require(rootPrefix + "/configs/constants")
;


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
class  Base {
    /**
     * Constructor for token constants
     *
     * @constructor
     */
    constructor() {}

    // Token deployment status starts.

    static get getTableName(){
        throw "child need to define this";
    }

    get getSchemaName(){
        return Constants.PRESTAGING_SCHEMA_NAME;
    }
    get getTableNameWithSchema(){
        return this.getSchemaName + "." + this.getTableName;
    }



}

module.exports = Base;
