


/**
 * CronConstants constants
 *
 * @module lib/globalConstant/CronConstants
 */

/**
 * Class for CronConstants constants
 *
 * @class
 */
class CronConstants {

    static setSigIntSignal() {
        CronConstants.sigIntSignal = true;
    }

    static get getSigIntSignal() {
        return CronConstants.sigIntSignal;
    }

}

CronConstants.sigIntSignal = false;

module.exports =  CronConstants;
