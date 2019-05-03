const Base = require("./base");


class Transactions extends Base {


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
        //required - allow 0 val, so not allow blank, null, undefined
        //min - covert to integer and >=  if val is present.
        return new Map(
            [
                ['tx_uuid', {name: 'transactionUuid', isSerialized: false, required: false}],

                ['tx_hash', {name: 'transactionHash', isSerialized: false, required: true}],

                ['gas_used', {name: 'gasUsed', isSerialized: false, required: true, min:0 }],
                ['gas_limit', {name: 'gasLimit', isSerialized: false, required: true, min:0 }],

                ['gas_price', {name: 'gasPrice', isSerialized: false, required: true, min: 1000000000 }],

                ['status', {name: 'transactionStatus', isSerialized: false, required: true, between:[0, 1]}],

                ['status_internal', {
                    name: 'transactionInternalStatus', isSerialized: false, required: false,
                    copyIfNotPresent: 'transactionStatus', between:[0, 1]
                }],
                ['events_parsing_status', {
                    name: 'eventsParsingStatus', isSerialized: false, required: false, between:[0]
                }],

                ['block_number', {name: 'blockNumber', isSerialized: false, required: true, min: 0}],

                ['block_timestamp', {name: 'blockTimestamp', isSerialized: false, required: true, min: 1}],

                ['from_address', {name: 'fromAddress', isSerialized: false, required: true}],

                ['to_address', {name: 'toAddress', isSerialized: false, required: false}],

                ['contract_address', {name: 'contractAddress', isSerialized: false, required: false}],

                ['total_token_transfers', {name: 'totalTokenTransfers', isSerialized: false, required: true, min: 0}],

                ['value', {name: 'value', isSerialized: false, required: true, min: 0}],

                ['meta_type', {name: 'metaProperty', isSerialized: true, required: false, property: "t"}],

                ['meta_name', {name: 'metaProperty', isSerialized: true, required: false, property: "n"}],

                ['token_id', {name: 'tokenId', isSerialized: false, required: true, min: 0}],

                ['kind', {name: 'kind', isSerialized: false, required: true, min: 0, max: 66}],

                ['rule_id', {name: 'ruleId', isSerialized: false, required: false, min: 0}]
            ]
        )
    }

    /**
     * table name
     *
     * * @return {string}
     */
    static get getTableName() {
        return "transactions";
    }


    /**
     * Column names which we want to move to redshift table, sequence of columns is important.
     *
     * * @return {Array}
     */
    static get fieldsToBeMoveToAnalytics(){
        return [
            'tx_uuid',
            'tx_hash',
            'gas_used',
            'gas_limit',
            'gas_price',
            'status',
            'status_internal',
            'block_number',
            'block_timestamp',
            'from_address',
            'to_address',
            'contract_address',
            'total_token_transfers',
            'value',
            'meta_type',
            'meta_name',
            'token_id',
            'kind',
            'rule_id'
        ]
    }

}


module.exports = Transactions;





