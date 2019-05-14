const Base = require("./base");

/**
 * Class Tokens
 *
 * @class
 */
class Tokens extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the token table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['token_id', {name: 'id', isSerialized: false, required: true}],

                ['client_id', {name: 'client_id', isSerialized: false, required: false}],

                ['name', {name: 'name', isSerialized: false, required: true}],

                ['symbol', {name: 'symbol', isSerialized: false, required: true}],

                ['conversion_factor', {name: 'conversion_factor', isSerialized: false, required: true}],

                ['number_of_decimal', {name: 'decimal', isSerialized: false, required: true}],

                ['delayed_recovery_interval', {name: 'delayed_recovery_interval', isSerialized: false, required: true}],

                ['client_id_was', {name: 'client_id_was', isSerialized: false, required: false}],

                ['debug', {name: 'debug', isSerialized: false, required: false}],

                ['status', {name: 'status', isSerialized: false, required: true}],

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
        return "tokens";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'token_id',
            'client_id',
            'name',
            'symbol',
            'conversion_factor',
            'number_of_decimal',
            'delayed_recovery_interval',
            'client_id_was',
            'debug',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = Tokens;





