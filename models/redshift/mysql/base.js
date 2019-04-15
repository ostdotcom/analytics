'use strict';
/**
 * @file - Base file for all the MySQL Models
 */
const rootPrefix = '../../..',
    MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/mysql'),
    mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
    Util = require('util'),
    logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    dateUtil = require(rootPrefix + "/lib/dateUtil"),
    blockScannerGC = require(rootPrefix + "/lib/globalConstants/blockScanner"),
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
        oThis.chainType = params.chainType;
        oThis.tableNameSuffix = "";
        oThis.dbName = params.dbName;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.redshiftClient = new RedshiftClient();
        if(oThis.chainType == blockScannerGC.auxChainType){
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

    get getTableName(){
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

        const deleteDuplicateIds = Util.format('DELETE from %s WHERE %s IN (SELECT %s from %s);', oThis.getTableNameWithSchema, oThis.getTablePrimaryKey, oThis.getTablePrimaryKey, oThis.getTempTableNameWithSchema)
            , insertRemainingEntries = Util.format('INSERT into %s (%s) (select %s from %s);', oThis.getTableNameWithSchema, oThis.getColumnList,oThis.getColumnList, oThis.getTempTableNameWithSchema)
        ;

        logger.info("Deletion of duplicate rows started", deleteDuplicateIds);
        return oThis.redshiftClient.query(deleteDuplicateIds)
            .then(function () {
                logger.info("Insertion to main table started", insertRemainingEntries);
                return oThis.redshiftClient.query(insertRemainingEntries);
            }).then(function () {
                logger.info('Copy from temp table to main table complete.');
                return Promise.resolve(responseHelper.successWithData({}));
            }).catch(function (err) {
                logger.error("Exception in insertToMainFromTemp", err);
                return Promise.reject(responseHelper.error({err: err}));
            });

    };

    /**
     * Get last updated at value from data_processing_info_{chain_id}
     *
     * @return {Promise}
     *
     */
    async getLastCronRunTime() {
        const oThis = this;
        return await oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + " where property= $1", [oThis.getDataProcessingPropertyName]).then((res) => {
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
        let lastCronRunTime = await oThis.getLastCronRunTime();
        let fetchDataQuery = oThis.constructor({}).select(oThis.columnsToFetchFromMysql()).
        where(['updated_at >= ? OR created_at >= ?', lastCronRunTime, dateUtil.getBeginnigOfDayInUTC(lastCronRunTime) ]).
        where(['created_at < ?', dateUtil.getBeginnigOfDayInUTC()]).
        order_by("id").
        limit(params.recordsToFetchOnce);

        if (params.lastProcessedId !== undefined){
            fetchDataQuery = fetchDataQuery.where(['id > ?', params.lastProcessedId])
        }

        return new fetchDataQuery.fire();
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
            columns.push(column[1].name);
        }
        return columns;
    }


    /**
     * Update last updated at value of the data_processing_info_{chain_id} table
     *
     * @return {Promise}
     *
     */
    async updateDataProcessingInfoTable(cronStartTime) {
        const oThis = this;
        let cronStartTimeStr = dateUtil.convertDateToString(cronStartTime, true);
        return await oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema +  " set value=$1 " +
            "where property=$2", [cronStartTimeStr, oThis.getDataProcessingPropertyName]).then((res) => {
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
     * Get table name with schema
     *
     * @returns {String}
     */
    get getTableNameWithSchema() {
        throw 'getTableNameWithSchema not implemented'
    };

    /**
     * Get table primary key
     *
     * @returns {String}
     */
    get getTablePrimaryKey() {
        throw 'getTablePrimaryKey not implemented'
    };

    /**
     * Get temp table name
     *
     * @returns {String}
     */
    get getTempTableNameWithSchema() {
        throw 'getTempTableName not implemented'
    };

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
