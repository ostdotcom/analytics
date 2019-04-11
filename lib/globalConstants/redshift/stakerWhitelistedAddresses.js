const Base = require("./base");

/**
 * Class StakerWhitelistedAddresses
 *
 * @class
 */
class StakerWhitelistedAddresses extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the StakerWhitelistedAddresses table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['token_id', {name: 'token_id', isSerialized: false, required: true}],

                ['staker_address', {name: 'staker_address', isSerialized: false, required: true}],

                ['gateway_composer_address', {name: 'gateway_composer_address', isSerialized: false, required: true}],

                ['status', {name: 'status', isSerialized: false, required: true, between:[1, 2]}],

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
        return "staker_whitelisted_addresses";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'token_id',
            'staker_address',
            'gateway_composer_address',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = StakerWhitelistedAddresses;





