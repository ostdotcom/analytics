/**
 * This service is used to download the data from s3 to the temp tables in redshift
 *
 * @module lib/downloadToTemp
 */

const rootPrefix = '..',
    constants = require(rootPrefix + '/configs/constants'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift");

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
    async copyFromS3ToTemp(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_NAME + '/'
            , copyTable = Util.format('copy %s (%s) from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.tempTableName, oThis.columnList, s3BucketPath + fullFilePath, oThis.getIamRole())
            , commit = 'COMMIT;'
            ,truncateTempTable = Util.format('TRUNCATE TABLE %s;', oThis.tempTableName),
            redshiftClient = new RedshiftClient();
        ;

        logger.info("Temp table delete if exists", truncateTempTable);
        return redshiftClient.query(truncateTempTable).then(function () {
                logger.info("Copying of temp table started", copyTable);
                return redshiftClient.query(copyTable);
            }).then(function () {
                logger.info("Commit started", commit);
                return redshiftClient.query(commit);
            }).then(function () {
                logger.info('Copy from Temp Table complete')
            }).catch(function (err) {
                logger.error("Copy from Temp Table hampered", err);
                throw new Error("Copy from Temp Table hampered" + err);
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