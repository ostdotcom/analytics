const Base = require("./base");

/**
 * Class Workflows
 *
 * @class
 */
class Workflows extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the Workflows table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['kind', {name: 'kind', isSerialized: false, required: true, between: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                        12, 13, 14, 15, 16, 17, 18, 19, 20]}],

                ['client_id', {name: 'client_id', isSerialized: false, required: false}],

                ['unique_hash', {name: 'unique_hash', isSerialized: false, required: false}],

                ['status', {name: 'status', isSerialized: false, required: true, between:[1, 2, 3, 4]}],

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
        return "Workflows";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'kind',
            'client_id',
            'unique_hash',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = Workflows;





