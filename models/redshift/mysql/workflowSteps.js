'use strict';
/**
 * This is model for WorkflowSteps table.
 *
 * @module /models/redshift/mysql/workflowSteps
 */
const rootPrefix = '../../..',
    ModelBase = require(rootPrefix + '/models/redshift/mysql/base'),
    Constants = require(rootPrefix + '/configs/constants'),
    WorkflowStepsGC = require(rootPrefix + '/lib/globalConstants/redshift/workflowSteps');

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
    getTableNameWithSchema() {
        return Constants.PRESTAGING_SCHEMA_NAME + '.workflow_steps';
    };

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
        return Constants.PRESTAGING_SCHEMA_NAME + '.temp_workflow_steps';
    };

    /**
     * Get file path for the workflowSteps service
     *
     * @returns {String}
     */
    get getFilePath() {
        return "/workflow_steps";
    }

}

module.exports = WorkflowSteps;
