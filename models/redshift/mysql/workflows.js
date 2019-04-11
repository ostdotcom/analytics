'use strict';
/**
 * This is model for Workflows table.
 *
 * @module /models/redshift/mysql/workflows
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    workflowsGC = require(rootPrefix + '/lib/globalConstants/redshift/workflows'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for Workflows model
 *
 * @class
 */
class Workflows extends ModelBase {
    /**
     * Constructor for Workflows model
     *
     * @constructor
     */
    constructor(params) {
        super({ dbName: dbName,
            object: params.object || {}
        });

        const oThis = this;

        oThis.tableName = 'workflows';
    }

    /**
     * Get mapping for the Workflows table
     *
     * @return {Map}
     */
    static get mapping(){
        return workflowsGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return workflowsGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    getTableNameWithSchema() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.workflows';
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        return dataProcessingInfoGC.workflowLastUpdatedAtProperty;
    }

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    getTablePrimaryKey() {
        return 'id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    getTempTableNameWithSchema() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_workflows';
    };

}

module.exports = Workflows;
