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

                ['token_id', {name: 'token_id', isSerialized: false, required: true}],

                ['kind', {name: 'kind', isSerialized: false, required: true, between: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                        12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
                        38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64
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





