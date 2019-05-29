const Base = require("./base");

/**
 * Class Tokens
 *
 * @class
 */
class CurrencyConversionRates extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the currencyConversionRates table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['chain_id', {name: 'chain_id', isSerialized: false, required: true}],

                ['stake_currency_id', {name: 'stake_currency_id', isSerialized: false, required: true, min: 1}],

                ['quote_currency', {name: 'quote_currency', isSerialized: false, required: true, between: [1]}],

                ['conversion_rate', {name: 'conversion_rate', isSerialized: false, required: true}],

                ['timestamp', {name: 'timestamp', isSerialized: false, required: true}],

                ['transaction_hash', {name: 'transaction_hash', isSerialized: false, required: false}],

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
        return "currency_conversion_rates";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'chain_id',
            'stake_currency_id',
            'quote_currency',
            'conversion_rate',
            'timestamp',
            'transaction_hash',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = CurrencyConversionRates;





