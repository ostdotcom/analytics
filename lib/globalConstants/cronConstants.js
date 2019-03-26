


/**
 * DataProcessingInfo constants
 *
 * @module lib/globalConstant/redShift/dataProcessingInfo
 */

/**
 * Class for DataProcessingInfo constants
 *
 * @class
 */
class CronConstants {


    static setSigIntSignal (isTrue) {
        CronConstants.sigIntSignal = isTrue;
    }

    static get getSigIntSignal() {
        return CronConstants.sigIntSignal;
    }

}

module.exports =  CronConstants;
