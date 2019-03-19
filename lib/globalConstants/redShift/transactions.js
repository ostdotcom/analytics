const Base = require("./base");


class Transactions extends Base {


    constructor(params) {
        super(params)
    }


    static get mapping() {
        return new Map(
            [
                ['tx_uuid', {name: 'transactionUuid', isSerialized: false, required: false}],

                ['tx_hash', {name: 'transactionHash', isSerialized: false, required: true}],

                ['gas_used', {name: 'gasUsed', isSerialized: false, required: true}],
                ['gas_limit', {name: 'gasLimit', isSerialized: false, required: true}],
                ['gas_price', {name: 'gasPrice', isSerialized: false, required: true}],

                ['status', {name: 'transactionStatus', isSerialized: false, required: true}],

                ['status_internal', {
                    name: 'transactionInternalStatus', isSerialized: false, required: false,
                    copyIfNotPresent: 'transactionStatus'
                }],

                ['block_number', {name: 'blockNumber', isSerialized: false, required: true}],

                ['block_timestamp', {name: 'blockTimestamp', isSerialized: false, required: true}],

                ['from_address', {name: 'fromAddress', isSerialized: false, required: true}],

                ['to_address', {name: 'toAddress', isSerialized: false, required: false}],

                ['contract_address', {name: 'contractAddress', isSerialized: false, required: false}],

                ['total_token_transfers', {name: 'totalTokenTransfers', isSerialized: false, required: false}],

                ['value', {name: 'value', isSerialized: false, required: true}],

                ['meta_type', {name: 'metaProperty', isSerialized: true, required: false, property: "t"}],

                ['meta_name', {name: 'metaProperty', isSerialized: true, required: false, property: "n"}],

                ['token_id', {name: 'tokenId', isSerialized: false, required: false}],

                ['kind', {name: 'kind', isSerialized: false, required: false}],

                ['rule_id', {name: 'rid', isSerialized: false, required: false}],
            ]
        )
    }

    static get getTableName() {
        return "transactions";
    }
}


module.exports = Transactions;





