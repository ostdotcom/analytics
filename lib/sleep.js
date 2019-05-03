/**
 * Sleep for particular time.
 *
 * @param {number} ms: time in ms
 *
 * @returns {Promise<any>}
 */
module.exports = function sleep(ms) {
    console.log('Sleeping for ', ms, ' ms');

    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};