/**
 * This service is used for executing the redshift query
 *
 * @module lib/redshift
 */

const rootPrefix = '..',
    constants = require(rootPrefix + '/configs/constants'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    Redshift = require('node-redshift');

/**
 * Class for executing the redshift query.
 *
 * @class
 */
class redshift {
    /**
     *
     * @constructor
     */
    constructor() {
        const oThis = this ;
        oThis.redshiftClient = new Redshift(constants.PRESTAGING_REDSHIFT_CLIENT);

    }

    /**
     * Perform the redshift query
     *
     */
    async query(commandString) {
        const oThis = this
        ;
        logger.info('Redshift query String', commandString);
        return new Promise(function (resolve, reject) {
            try {
                oThis.redshiftClient.query(commandString, function (err, result) {
                    if (err) {
                        reject("Error in query " + err);
                    } else {
                        resolve(result);
                    }
                })
            } catch (err) {
                reject(err);
            }
        });

    }

    /**
     * Perform the redshift parameterizedQuery
     *
     */
    async parameterizedQuery(commandString, parameterizedArray) {
        const oThis = this
        ;
        logger.info('Redshift parameterizedQuery String', commandString);
        return new Promise(function (resolve, reject) {
            try {
                oThis.redshiftClient.parameterizedQuery(commandString, parameterizedArray, function (err, result) {
                    if (err) {
                        reject("Error in parameterizedQuery " + err);
                    } else {
                        resolve(result);
                    }
                })
            } catch (err) {
                reject(err);
            }
        });

    }


}

module.exports = redshift;