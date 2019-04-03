const rootPrefix = ".",
    Base = require(rootPrefix + "/base");


class Transfers extends Base {


    constructor(params) {
        super(params)
    }

    /**
     * Mapping of column between block-scanner data and redshift data and validations
     *
     * * @return {Map}
     *
     */
    static get mapping() {
        return new Map(
            [
                ['tx_hash', {name: 'transactionHash', isSerialized: false, required: true}],

                ['block_number', {name: 'blockNumber', isSerialized: false, required: true, min:0}],

                ['to_address', {name: 'toAddress', isSerialized: false, required: true}],

                ['event_index', {name: 'eventIndex', isSerialized: false, required: true, min:1}],

                ['amount', {name: 'amount', isSerialized: false, required: true, min:0}],

                ['from_address', {name: 'fromAddress', isSerialized: false, required: true}],

                ['contract_address', {name: 'contractAddress', isSerialized: false, required: true}],
            ]
        )
    }


    /**
     * table name
     *
     * * @return {string}
     */
    static get getTableName() {
        return "transfers";
    }


    /**
     * Columns which we want to move to redshift table for analysis, sequence of column is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'tx_hash',
            'block_number',
            'to_address',
            'event_index',
            'amount',
            'from_address',
            'contract_address'
        ]
    }


}


module.exports = Transfers;





