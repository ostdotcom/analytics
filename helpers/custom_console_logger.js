"use strict";

/**
 * Custom console logger
 *
 * @module helpers/custom_console_logger
 */

// const
// Get common local storage namespace to read
// request identifiers for debugging and logging
//   openSTNotification = require('@openstfoundation/openst-notification')
//   ;

const rootPrefix = ".."
    , packageFile = require(rootPrefix + '/package.json')
;

const packageName = packageFile.name
    , packageVersion = packageFile.version
;


const CONSOLE_RESET = "\x1b[0m"
    , ERR_PRE = "\x1b[31m" //Error. (RED)
    , NOTE_PRE = "\x1b[91m" //Notify Error. (Purple)
    , INFO_PRE = "\x1b[33m  " //Info (YELLOW)
    , WIN_PRE = "\x1b[32m" //Success (GREEN)
    , WARN_PRE = "\x1b[43m"
    , STEP_PRE = "\n\x1b[34m"
;

const DEBUG = false;

// Get common local storage namespace to read
// request identifiers for debugging and logging

/**
 * Method to append Request in each log line.
 *
 * @param {string} message
 */
const appendRequest = function(message) {
    var newMessage = "";
    newMessage += message;
    return newMessage;
};

/**
 * Method to convert Process hrTime to Milliseconds
 *
 * @param {number} hrTime - this is the time in hours
 *
 * @return {number} - returns time in milli seconds
 */
const timeInMilli = function(hrTime) {
    return (hrTime[0] * 1000 + hrTime[1] / 1000000);
};

/**
 * Custom COnsole Logger
 *
 * @constructor
 */
const CustomConsoleLoggerKlass = function() {};

CustomConsoleLoggerKlass.prototype = {
    /**
     * @ignore
     *
     * @constant {string}
     */
    STEP_PRE: STEP_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    WARN_PRE: WARN_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    WIN_PRE: WIN_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    INFO_PRE: INFO_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    ERR_PRE: ERR_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    NOTE_PRE: NOTE_PRE,

    /**
     * @ignore
     *
     * @constant {string}
     */
    CONSOLE_RESET: CONSOLE_RESET,

    /**
     * Log info
     */
    info: function () {
        var args = [appendRequest(this.INFO_PRE)];
        args = args.concat(Array.prototype.slice.call(arguments));
        args.push(this.CONSOLE_RESET);
        console.log.apply(console, args);
    },

    /**
     * Log error
     */
    error: function () {
        var args = [appendRequest(this.ERR_PRE)];
        args = args.concat(Array.prototype.slice.call(arguments));
        args.push(this.CONSOLE_RESET);
        console.log.apply(console, args);
    },

    /**
     * Log warn
     */
    warn: function () {
        var args = [appendRequest(this.WARN_PRE)];
        args = args.concat(Array.prototype.slice.call(arguments));
        args.push(this.CONSOLE_RESET);
        console.log.apply(console, args);
    },

    /**
     * Log normal level
     */
    log: function () {
        console.log.apply(console, arguments);
    },

    /**
     *
     * Log debug level
     */
    debug: function () {
        if (DEBUG) {
            console.log.apply(console, arguments);
        }
    },

};

module.exports = new CustomConsoleLoggerKlass();