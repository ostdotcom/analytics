const Base = require("./base");

/**
 * Class TokenAddresses
 *
 * @class
 */
class TokenAddresses extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the TokenAddresses table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['token_id', {name: 'token_id', isSerialized: false, required: true, min: 1}],

                ['kind', {name: 'kind', isSerialized: false, required: true, between: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64
                    ]}],

                ['address', {name: 'address', isSerialized: false, required: true}],

                ['deployed_chain_id', {name: 'deployed_chain_id', isSerialized: false, required: false}],

                ['deployed_chain_kind', {name: 'deployed_chain_kind', isSerialized: false, required: false}],

                ['status', {name: 'status', isSerialized: false, required: true, between:[1, 2]}],

                ['known_address_id', {name: 'known_address_id', isSerialized: false, required: false}],

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
        return "token_addresses";
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
            'kind',
            'address',
            'deployed_chain_id',
            'deployed_chain_kind',
            'status',
            'known_address_id',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = TokenAddresses;





