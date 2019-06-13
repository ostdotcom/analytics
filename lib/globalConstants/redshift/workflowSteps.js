const Base = require("./base");

/**
 * Class WorkflowSteps
 *
 * @class
 */
class WorkflowSteps extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the WorkflowSteps table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['workflow_id', {name: 'workflow_id', isSerialized: false, required: true}],

                ['kind', {name: 'kind', isSerialized: false, required: true, max: 362, min:1}],

                ['transaction_hash', {name: 'transaction_hash', isSerialized: false, required: false}],

                ['status', {name: 'status', isSerialized: false, required: false, between:[1, 2, 3, 4, 5]}],

                ['unique_hash', {name: 'unique_hash', isSerialized: false, required: false}],

                ['created_at', {name: 'created_at', isSerialized: false, required: true}],

                ['updated_at', {name: 'updated_at', isSerialized: false, required: true}]
            ]
        )
    }

    /**
     * Get table name
     *
     * @return {string}
     */
    static get getTableName() {
        return "workflow_steps";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'workflow_id',
            'kind',
            'transaction_hash',
            'status',
            'unique_hash',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = WorkflowSteps;





