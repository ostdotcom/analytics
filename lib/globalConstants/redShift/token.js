const Base = require("./base");


class Tokens extends Base {


    constructor(params) {
        super(params)
    }


    static get mapping() {
        return new Map(
            [
                ['token_id', {name: 'id', isSerialized: false, required: true}],

                ['client_id', {name: 'client_id', isSerialized: false, required: true}],

                ['name', {name: 'name', isSerialized: false, required: true}],

                ['symbol', {name: 'symbol', isSerialized: false, required: true}],

                ['conversion_factor', {name: 'conversion_factor', isSerialized: false, required: true}],

                ['decimal', {name: 'decimal', isSerialized: false, required: true}],

                ['delayed_recovery_interval', {name: 'delayed_recovery_interval', isSerialized: false, required: true}],

                ['status', {name: 'status', isSerialized: false, required: true}],

                ['created_at', {name: 'created_at', isSerialized: false, required: true}],

                ['updated_at', {name: 'updated_at', isSerialized: false, required: true}]
            ]
        )
    }


    static get getTableName() {
        return "tokens";
    }


}


module.exports = Tokens;





