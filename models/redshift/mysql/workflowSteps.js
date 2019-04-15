'use strict';
/**
 * This is model for WorkflowSteps table.
 *
 * @module /models/redshift/mysql/workflowSteps
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    WorkflowStepsGC = require(rootPrefix + '/lib/globalConstants/redshift/workflowSteps'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo");

// Declare variables.
const dbName = 'kit_saas_' + Constants.SUB_ENVIRONMENT + '_' + Constants.SAAS_MYSQL_DATABASE_ENVIRONMENT;

/**
 * Class for WorkflowSteps model
 *
 * @class
 */
class WorkflowSteps extends ModelBase {
    /**
     * Constructor for WorkflowSteps model
     *
     * @constructor
     */
    constructor(params) {
        super({ dbName: dbName,
            object: params.object || {}
        });

        const oThis = this;

        oThis.tableName = 'workflow_steps';
    }

    /**
     * Get mapping for the WorkflowSteps table
     *
     * @return {Map}
     */
    static get mapping(){
        return WorkflowStepsGC.mapping;
    }

    /**
     * Get fields to be move to analytics
     *
     * @return {Object}
     */
    static get fieldsToBeMoveToAnalytics() {
        return WorkflowStepsGC.fieldsToBeMoveToAnalytics;
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.workflow_steps' + oThis.tableNameSuffix;
    };

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName(){
        const oThis = this;
        return dataProcessingInfoGC.workflowStepsLastUpdatedAtProperty + oThis.tableNameSuffix;
    }

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    get getTablePrimaryKey() {
        return 'id'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    get getTempTableNameWithSchema() {
        const oThis = this;
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_workflow_steps' + oThis.tableNameSuffix;
    };

}

module.exports = WorkflowSteps;
