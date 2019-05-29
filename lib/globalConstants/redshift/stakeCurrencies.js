const Base = require("./base");

/**
 * Class Tokens
 *
 * @class
 */
class StakeCurrencies extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the stakeCurrencies table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['name', {name: 'name', isSerialized: false, required: true}],

                ['symbol', {name: 'symbol', isSerialized: false, required: true}],

                ['number_of_decimal', {name: 'decimal', isSerialized: false, required: false}],

                ['contract_address', {name: 'contract_address', isSerialized: false, required: true}],

                ['constants', {name: 'constants', isSerialized: false, required: true}],

                ['addresses', {name: 'addresses', isSerialized: false, required: false}],

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
        return "stake_currencies";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'name',
            'symbol',
            'number_of_decimal',
            'contract_address',
            'constants',
            'addresses',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = StakeCurrencies;





