const Base = require("./base");

/**
 * Class ChainAddresses
 *
 * @class
 */
class ChainAddresses extends Base {
    /**
     * Constructor
     *
     * @sets {params}
     */
    constructor(params) {
        super(params)
    }

    /**
     * Get mapping for the ChainAddresses table
     *
     * @return {Map}
     */
    static get mapping() {
        return new Map(
            [
                ['id', {name: 'id', isSerialized: false, required: true}],

                ['associated_aux_chain_id', {name: 'associated_aux_chain_id', isSerialized: false, required: true, min: 0}],

                ['kind', {name: 'kind', isSerialized: false, required: true, between: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                        12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
                        38, 39, 40, 41, 42, 43]}],

                ['address', {name: 'address', isSerialized: false, required: true}],

                ['known_address_id', {name: 'known_address_id', isSerialized: false, required: false}],

                ['deployed_chain_id', {name: 'deployed_chain_id', isSerialized: false, required: false}],

                ['deployed_chain_kind', {name: 'deployed_chain_kind', isSerialized: false, required: false}],

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
        return "chain_addresses";
    }

    /**
     * Column names which we want to move to redshift table, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'id',
            'associated_aux_chain_id',
            'kind',
            'address',
            'known_address_id',
            'deployed_chain_id',
            'deployed_chain_kind',
            'status',
            'created_at',
            'updated_at'
        ]
    }


}


module.exports = ChainAddresses;





