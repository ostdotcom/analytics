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
    emailNotifier = require(rootPrefix + '/lib/notifier');

class ModelBase extends MysqlQueryBuilders {
    /**
     * Base Model Constructor
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

    validateAndFormatBlockScannerData(object) {
        const oThis = this;
        let formattedMap = new Map();
        for (let column of oThis.constructor.mapping) {
            //eg. column[0] => token_id, column[1] => {name: 'id', isSerialized: false, required: true}
            if (column[1]['required'] && !(column[1]['name'] in object)) {
                //todo: send email on fail
                emailNotifier.perform('m_m_b_vafbsd_1', 'Unknown column present in the record', {}, {});
                console.log(column[1]['name']);
                return responseHelper.error(
                    {
                        internal_error_identifier: 'm_m_b_vafbsd_1',
                        api_error_identifier: '',
                        debug_options: {}
                    }
                )
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

    formatBlockScannerDataToArray(object) {
        const oThis = this;
        let r = oThis.validateAndFormatBlockScannerData(object);
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }

    initRedshift(){
        const oThis = this;
        oThis.redshiftClient = new Redshift(constants.PRESTAGING_REDSHIFT_CLIENT);
    }

    copyFromS3(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_LINK + '/'


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

    get getColumnList(){
        const oThis = this;
        const mapping = oThis.constructor.mapping,
            columns = [];
        for (let col of mapping){
            columns.push(col[0]);
        }
        return columns.join(", ");
    }

    getModelImportString() {
        throw 'getModelImportString not implemented'
    };

    getTableNameWithSchema() {
        throw 'getModelImportString not implemented'
    };

    getTablePrimaryKey() {
        throw 'getTablePrimaryKey not implemented'
    };

    getTempTableName() {
        throw 'getTempTableName not implemented'
    };

    getS3FilePath() {
        throw 'getS3FilePath not implemented'
    };

    getIamRole() {
        return constants.OS_S3_IAM_ROLE
    };



}

module.exports = ModelBase;
