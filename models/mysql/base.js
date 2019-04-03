'use strict';
/**
 * @file - Base file for all the MySQL Models
 */
const rootPrefix = '../..',
    Redshift = require('node-redshift'),
    MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/mysql'),
    mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
    constants = require(rootPrefix + '/configs/constants'),
    Util = require('util'),
    logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    ValidateAndSanitize = require(rootPrefix + '/lib/validateAndSanatize');

/**
 * Class ModelBase
 *
 * @class
 */
class ModelBase extends MysqlQueryBuilders {
    /**
     * Model Base Constructor
     *
     * @constructor
     * @param params
     */
    constructor(params) {
        super(params);

        const oThis = this;
        oThis.object = params.object || {};
        oThis.chainId = params.chainId;
        oThis.dbName = params.dbName;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.validateAndSanitize = new ValidateAndSanitize({mapping: oThis.constructor.mapping,
            fieldsToBeMoveToAnalytics: oThis.constructor.fieldsToBeMoveToAnalytics });
    }

    /**
     * Connection pool to use for read query
     *
     * @return {*}
     */
    onReadConnection() {
        // At present, following is not being used. But when we implement replication,
        // following connection pool will be used for slave connections.
        return mysqlWrapper.getPoolFor(this.dbName, 'master');
    }

    /**
     * Connection pool to use for write query
     *
     * @return {*}
     */
    onWriteConnection() {
        return mysqlWrapper.getPoolFor(this.dbName, 'master');
    }

    /**
     * Fire the query
     *
     * @return {Promise<any>}
     */
    fire() {
        const oThis = this;

        return new Promise(function(onResolve, onReject) {
            const queryGenerator = oThis.generate();

            let preQuery = Date.now();
            let qry = oThis
                .onWriteConnection()
                .query(queryGenerator.data.query, queryGenerator.data.queryData, function(err, result, fields) {
                    logger.info('(' + (Date.now() - preQuery) + ' ms)', qry.sql);
                    if (err) {
                        onReject(err);
                    } else {
                        onResolve(result);
                    }
                });
        });
    }

    /**
     * Format data
     *
     * @returns {Array[objects]}
     */
    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let object of arrayToFormat) {
            // let model = new tokensModel({object: object, chainId: oThis.chainId});
            let r =  oThis.validateAndSanitize.perform({ object: object });
            if (!r.success) {
                continue;
            }
            arrayOfObjects.push(Array.from(r.data.data.values()) );
        }
        return arrayOfObjects;
    }

    /**
     * Validate and Format Mysql Data
     *
     * @return {object}
     */
    validateAndFormatMysqlData(object) {
        const oThis = this;
        let formattedMap = new Map();
        for (let column of oThis.constructor.mapping) {
            //eg. column[0] => token_id, column[1] => {name: 'id', isSerialized: false, required: true}
            if (column[1]['required'] && !(column[1]['name'] in object)) {
                let rh = responseHelper.error(
                    {
                        internal_error_identifier: 'm_m_b_vafmd',
                        api_error_identifier: '',
                        debug_options: oThis.object
                    }
                );
                oThis.applicationMailer.perform({subject: 'validate mysql data failed', body: {error: rh}});
                return rh;
            }
            let value = object[column[1]['name']];
            // value = value.split("|").join("I");
            if (column[1]['isSerialized'] == true && value) {
                let fieldData = JSON.parse(value);
                value = fieldData[column[1]['property']];
            }
            value = typeof value == 'undefined' ? object[column[1]['copyIfNotPresent']] : value;
            formattedMap.set(column[0], value);
        }
        return responseHelper.successWithData({
            data: formattedMap
        });

    }

    /**
     * Format mysql data to array
     *
     * @return {object}
     */
    formatMysqlDataToArray(object) {
        const oThis = this;
        let r = oThis.validateAndFormatMysqlData(object);
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }

    /**
     * Initialize redshift
     *
     */
    initRedshift(){
        const oThis = this;
        oThis.redshiftClient = new Redshift(constants.PRESTAGING_REDSHIFT_CLIENT);
    }

    /**
     * Copy data from s3 and insert into temp table and modify updated records
     *
     */
    copyFromS3(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_NAME + '/'


            , copyTable = Util.format('copy %s (%s) from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.getTempTableName(), oThis.getColumnList, s3BucketPath + fullFilePath, oThis.getIamRole())
            , commit = 'COMMIT;'
        ;

        const deleteDuplicateIds = Util.format('DELETE from %s WHERE %s IN (SELECT %s from %s);', oThis.getTableNameWithSchema(), oThis.getTablePrimaryKey(), oThis.getTablePrimaryKey(), oThis.getTempTableName());


        const insertRemainingEntries = Util.format('INSERT into %s (%s) (select %s from %s);', oThis.getTableNameWithSchema(), oThis.getColumnList,oThis.getColumnList, oThis.getTempTableName())
            , truncateTempTable = Util.format('TRUNCATE TABLE %s;', oThis.getTempTableName())
        ;
        logger.log(s3BucketPath + fullFilePath);

        logger.log("Temp table delete if exists", truncateTempTable);
        return oThis.query(truncateTempTable)
            .then(function () {
                logger.log("Copying of table started", copyTable);
                return oThis.query(copyTable);
            }).then(function () {
                logger.log("Commit started", commit);
                return oThis.query(commit);
            }).then(function () {
                logger.log("Deletion of duplicate Ids started", deleteDuplicateIds);
                return oThis.query(deleteDuplicateIds);
            }).then(function () {
                logger.log("Insertion of remaining entries started", insertRemainingEntries);
                return oThis.query(insertRemainingEntries);
            }).then(function () {
                logger.log("Dropping temp table", truncateTempTable);
                return oThis.query(truncateTempTable);
            }).then(function () {
                logger.log('Copy from S3 complete')
            }).catch(function (err) {
                logger.error("S3 copy hampered", err);
                throw new Error("S3 copy hampered" + err);
            });

    };

    /**
     * Perform the redshift query
     *
     */
    async query(commandString) {
        const oThis = this
        ;
        logger.debug('Redshift query String', commandString);
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
     * Get column list
     *
     * @return {string}
     */
    get getColumnList() {
        const oThis = this;
        return oThis.constructor.fieldsToBeMoveToAnalytics.join(", ");
    }

    /**
     * Get table name with schema
     *
     * @returns {String}
     */
    getTableNameWithSchema() {
        throw 'getTableNameWithSchema not implemented'
    };

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    getTablePrimaryKey() {
        throw 'getTablePrimaryKey not implemented'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    getTempTableName() {
        throw 'getTempTableName not implemented'
    };

    /**
     * Get s3 file path
     *
     * @returns {String}
     */
    getS3FilePath() {
        throw 'getS3FilePath not implemented'
    };

    /**
     * Get Iam role
     *
     * @returns {String}
     */
    getIamRole() {
        return constants.S3_IAM_ROLE
    };

}

module.exports = ModelBase;
