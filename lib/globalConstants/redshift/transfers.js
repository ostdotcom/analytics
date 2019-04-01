const rootPrefix = ".",
    Base = require(rootPrefix + "/base");


class Transfers extends Base {


    constructor(params) {
        super(params)
    }


    static get mapping() {
        return new Map(
            [
                ['tx_hash', {name: 'transactionHash', isSerialized: false, required: true}],

                ['block_number', {name: 'blockNumber', isSerialized: false, required: true}],

                ['to_address', {name: 'toAddress', isSerialized: false, required: false}],

                ['event_index', {name: 'eventIndex', isSerialized: false, required: true}],

                ['amount', {name: 'amount', isSerialized: false, required: true}],

                ['from_address', {name: 'fromAddress', isSerialized: false, required: true}],

                ['contract_address', {name: 'contractAddress', isSerialized: false, required: false}],
            ]
        )
    }


    static get getTableName() {
        return "transfers";
    }


}


module.exports = Transfers;





