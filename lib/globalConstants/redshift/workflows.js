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

                ['kind', {name: 'kind', isSerialized: false, required: true, between: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                        12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
                        38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57]}],

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





