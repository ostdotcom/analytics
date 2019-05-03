const rootPrefix = '..',
    logger = require(rootPrefix + "/helpers/custom_console_logger");

/**
 * Sleep for particular time.
 *
 * @param {number} ms: time in ms
 *
 * @returns {Promise<any>}
 */
module.exports = function sleep(ms) {
    // logger.log('Sleeping for ', ms, ' ms');

    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};