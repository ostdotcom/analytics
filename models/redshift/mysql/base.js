'use strict';
/**
 * @file - Base file for all the MySQL Models
 */
const rootPrefix = '../../..',
    Redshift = require('node-redshift'),
    MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/mysql'),
    mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
    constants = require(rootPrefix + '/configs/constants'),
    Util = require('util'),
    shell = require("shelljs"),
    logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    ValidateAndSanitize = require(rootPrefix + '/lib/validateAndSanatize'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    localWrite = require(rootPrefix + "/lib/localWrite"),
    dateUtil = require(rootPrefix + "/lib/dateUtil"),
    DownloadToTemp = require(rootPrefix + "/lib/downloadToTemp"),
    RedshiftClient = require(rootPrefix + "/lib/redshift");

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
        oThis.tableNameSuffix = "";
        oThis.dbName = params.dbName;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.validateAndSanitize = new ValidateAndSanitize({mapping: oThis.constructor.mapping,
            fieldsToBeMoveToAnalytics: oThis.constructor.fieldsToBeMoveToAnalytics });
        oThis.redshiftClient = new RedshiftClient();
        if(oThis.chainId){
            oThis.tableNameSuffix = `_${oThis.chainId}`
        }
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

    getTableName(){
        const oThis = this;
        return oThis.tableName;
    }

    /**
     * Copy data from s3 and insert into temp table and modify updated records
     *
     */
    async insertToMainFromTemp() {

        const oThis = this
        ;

        const deleteDuplicateIds = Util.format('DELETE from %s WHERE %s IN (SELECT %s from %s);', oThis.getTableNameWithSchema(), oThis.getTablePrimaryKey(), oThis.getTablePrimaryKey(), oThis.getTempTableNameWithSchema())
            , insertRemainingEntries = Util.format('INSERT into %s (%s) (select %s from %s);', oThis.getTableNameWithSchema(), oThis.getColumnList,oThis.getColumnList, oThis.getTempTableNameWithSchema())
            , commit = 'COMMIT;'
        ;

        logger.info("Deletion of duplicate Ids started", deleteDuplicateIds);
        return oThis.redshiftClient.query(deleteDuplicateIds)
            .then(function () {
                logger.info("Insertion of remaining entries started", insertRemainingEntries);
                return oThis.redshiftClient.query(insertRemainingEntries);
            }).then(function () {
                logger.info("Commit started", commit);
                return oThis.redshiftClient.query(commit);
            }).then(function () {
                logger.info('Copy from temp table to main table complete.');
                return responseHelper.successWithData({});
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
     * Get last updated at value from data_processing_info_{chain_id}
     *
     * @return {Promise}
     *
     */
    async getLastUpdatedAtValue() {
        const oThis = this;
        return await oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + " "+"where property= $1", [oThis.getDataProcessingPropertyName]).then((res) => {
            return (res.rows[0].value);
        });
    }


    /**
     * fetches data from mysql table
     *
     * @return {Promise}
     *
     */
    async fetchData(params){
        const oThis = this;
        let lastUpdatedAt = await oThis.getLastUpdatedAtValue();
        return new oThis.constructor({}).select(oThis.columnsToFetchFromMysql()).where(['updated_at > ?', lastUpdatedAt]).
        where(['id > ?', params.lastProcessedId]).order_by("id").
        limit(params.recordsToFetchOnce).fire();
    }

    /**
     * columns to be fetched from Mysql
     *
     * @return {string}
     *
     */
    columnsToFetchFromMysql(){
        const oThis = this;
        let columns = [];
        for (let column of oThis.constructor.mapping){
            columns.push(column[0]);
        }
        return columns.join(", ");
    }


    /**
     * Update last updated at value of the data_processing_info_{chain_id} table
     *
     * @return {Promise}
     *
     */
    async updateDataProcessingInfoTable(currentDate) {
        const oThis = this;
        let LastUpdatedAtValue = dateUtil.convertDateToString(currentDate);
        return await oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema +  " set value=$1 " +
            "where property=$2", [LastUpdatedAtValue, oThis.getDataProcessingPropertyName]).then((res) => {
            logger.log( oThis.getDataProcessingPropertyName + " value of the data_processing_info table updated successfully");
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
     * Get s3 file path
     *
     * @returns {String}
     */
    getS3FilePath() {
        return `s3://${ Constants.S3_BUCKET_NAME}/`
    };



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
    getTempTableNameWithSchema() {
        throw 'getTempTableName not implemented'
    };



    /**
     * Get file path
     *
     * @returns {String}
     */
    get getFilePath() {
        throw 'getFilePath not implemented'
    }

    /**
     * Get data processing property name
     *
     * @returns {String}
     */
    get getDataProcessingPropertyName() {
        throw 'getDataProcessingPropertyName not implemented';
    }


}

module.exports = ModelBase;
