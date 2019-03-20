'use strict';

const dateFormat = require('dateformat');

/**
 * Class for Date Util
 *
 * @class
 */
class DateUtil {
    constructor() {}

    /**
     * Converts date to string
     *
     * @return {string}
     */
    convertDateToString(date) {
        return dateFormat(date, "yyyy-mm-dd H:MM:ss");
    }

}

module.exports = new DateUtil();
