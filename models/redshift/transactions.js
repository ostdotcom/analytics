'use strict';
const rootPrefix = '../../..'
    , constants = require(rootPrefix + '/config/constants')
;
var transactions = {
    'tableName': 'ost_stag_staging.transactions',
    'tableProperties': {
        'id': {
            'type': 'key'
        },
        'transaction_uuid': {
            'type': 'string',
            'required': true
        },
        'transaction_hash': {
            'type': 'string',
            'required': true
        },
        'gas_used': {
            'type': 'bigint',
            'required': true
        },
        'status': {
            'type': 'smallint',
            'required': true
        },
        'status_internal': {
            'type': 'integer',
            'required': true
        },
        'block_number': {
            'type': 'integer',
            'required': true

        },
        'value': {
            'type': 'integer',
            'required': true

        },
        'client_id': {
            'type': 'integer',
            'required': false

        },
        'token_id': {
            'type': 'integer',
            'required': false

        },
        kind: {
            'type': 'integer',
            'required': false

        }
    }
};
module.exports = transactions;