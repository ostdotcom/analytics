/**
 * Email notifier class.
 *
 * @module lib/notifier
 */
const rootPrefix = '..',
    responseHelper = require(rootPrefix + '/lib/formatter/response');
// logger = require(rootPrefix + '/lib/console/customConsoleLogger'),
// rabbitmqProvider = require(rootPrefix + '/lib/providers/rabbitmq'),
// rabbitmqConstant = require(rootPrefix + '/lib/globalConstant/rabbitmq'),
// connectionTimeoutConst = require(rootPrefix + '/lib/globalConstant/connectionTimeout');

/**
 * Class for email notifier.
 *
 * @class NotifierKlass
 */
class NotifierKlass {
    perform(code, msg, errData, debugData) {
        const oThis = this;

        return oThis.asyncPerform(code, msg, errData, debugData).catch(function(error) {
            if (responseHelper.isCustomResult(error)) {
                return error;
            }
            console.error(`${__filename}::perform::catch`);
            console.error(error);

            return responseHelper.error({
                internal_error_identifier: 'l_n_1',
                api_error_identifier: 'unhandled_catch_response',
                debug_options: {}
            });
        });
    }

    async asyncPerform(code, msg, errData, debugData) {
        console.error('error_code:', code, 'error_msg:', msg, 'error:', errData, 'debug_data', debugData);
    }
}

module.exports = new NotifierKlass();
