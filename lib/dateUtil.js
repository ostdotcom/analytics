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
     * Date from redshift or mysql is converted so that UTC offset is subtracted from given date.
     * This method converts UTC TIME zone to machine time zone, Hence Nullyifying the effect
     *
     * @return {string}
     */
    handleMachineToUTCTimeZoneDiff(date) {
        return dateFormat(date, "yyyy-mm-dd H:MM:ss");
    }

    convertDateToString(date, inUtc){
        return dateFormat(date, "yyyy-mm-dd H:MM:ss", inUtc);
    }

    getBeginnigOfDayInUTC(date){
        let dObj = date? new Date(date): new Date();
        return dateFormat(dObj, "yyyy-mm-dd 00:00:00", true);
    }

}

module.exports = new DateUtil();
