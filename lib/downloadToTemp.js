/**
 * This service is used to download the data from s3 to the temp tables in redshift
 *
 * @module lib/downloadToTemp
 */

const rootPrefix = '..',
    constants = require(rootPrefix + '/configs/constants'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    Util = require('util');

/**
 * Class for download the data from s3 to the temp tables in redshift.
 *
 * @class
 */
class downloadToTemp {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params) {
        const oThis = this ;
        oThis.tempTableName = params.tempTableName;
        oThis.columnList = params.columnList;

    }

    /**
     * Copy data from s3 and insert into temp table
     *
     */
    copyFromS3ToTemp(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_NAME + '/'
            , copyTable = Util.format('copy %s (%s) from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.tempTableName, oThis.columnList, s3BucketPath + fullFilePath, oThis.getIamRole())
            , commit = 'COMMIT;'
            ,truncateTempTable = Util.format('TRUNCATE TABLE %s;', oThis.getTempTableNameWithSchema())
        ;

        logger.log("Temp table delete if exists", truncateTempTable);
        return oThis.query(truncateTempTable)
            .then(function () {
                logger.log("Copying of table started", copyTable);
                return oThis.query(copyTable);
            }).then(function () {
                logger.log("Commit started", commit);
                return oThis.query(commit);
            }).then(function () {
                logger.log('Copy from S3 complete')
            }).catch(function (err) {
                logger.error("S3 copy hampered", err);
                throw new Error("S3 copy hampered" + err);
            });
    }

    /**
     * Get Iam role
     *
     * @returns {String}
     */
    getIamRole() {
        return constants.S3_IAM_ROLE
    };


}

module.exports = downloadToTemp;