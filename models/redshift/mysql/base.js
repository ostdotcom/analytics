'use strict';
/**
 * @file - Base file for all the MySQL Models
 */
const rootPrefix = '../../..',
    Constant = require(rootPrefix + "/configs/constants"),
    MysqlQueryBuilders = require(rootPrefix + '/lib/queryBuilders/mysql'),
    mysqlWrapper = require(rootPrefix + '/lib/mysqlWrapper'),
    Util = require('util'),
    logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    baseGC = require(rootPrefix + '/lib/globalConstants/redshift/base'),
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
        oThis.params = params;
        oThis.object = params.object || {};
        oThis.dynamicMysqlHost = params.dynamicMysqlHost;

        if(Constant.USE_POINT_IN_TIME_RDS_INSTANCE != 'true'){
            oThis.dynamicMysqlHost = Constant.KIT_SAAS_SUBENV_MYSQL_HOST;
        }
        oThis.chainId = params.chainId;
        oThis.chainType = params.chainType;
        oThis.tableNameSuffix = "";
        oThis.dbName = params.dbName;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.redshiftClient = new RedshiftClient();
        if (oThis.chainType == blockScannerGC.auxChainType) {
            oThis.tableNameSuffix = `_${oThis.chainId}`
        }
    }

    /**
     * Connection pool to use for read query
     *
     * @return {*}
     */
    onReadConnection() {
        const oThis = this;
        // At present, following is not being used. But when we implement replication,
        // following connection pool will be used for slave connections.
        if (oThis.dynamicMysqlHost) {
            return mysqlWrapper.getPoolForDynamicHost(oThis.dbName, 'master', undefined, {host: oThis.dynamicMysqlHost});
        } else {
            return mysqlWrapper.getPoolFor(oThis.dbName, 'master');
        }
    }

    /**
     * Connection pool to use for write query
     *
     * @return {*}
     */
    onWriteConnection() {
        const oThis = this;
        // At present, following is not being used. But when we implement replication,
        // following connection pool will be used for slave connections.
        if (oThis.dynamicMysqlHost) {
            return mysqlWrapper.getPoolForDynamicHost(oThis.dbName, 'master', undefined, {host: oThis.dynamicMysqlHost});
        } else {
            return mysqlWrapper.getPoolFor(oThis.dbName, 'master');
        }
    }

    /**
     * Fire the query
     *
     * @return {Promise<any>}
     */
    fire() {
        const oThis = this;

        return new Promise(function (onResolve, onReject) {
            const queryGenerator = oThis.generate();

            let preQuery = Date.now();
            let qry = oThis
                .onWriteConnection()
                .query(queryGenerator.data.query, queryGenerator.data.queryData, function (err, result, fields) {
                    logger.info('(' + (Date.now() - preQuery) + ' ms)', qry.sql);
                    if (err) {
                        onReject(err);
                    } else {
                        onResolve(result);
                    }
                });
        });
    }

    get getTableName() {
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
            ,
            insertRemainingEntries = Util.format('INSERT into %s (%s) (select %s from %s);', oThis.getTableNameWithSchema, oThis.getColumnList, oThis.getColumnList, oThis.getTempTableNameWithSchema)
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
    async fetchTotalRowCountAndMaxUpdated(params) {
        const oThis = this;

        let lastProcessTime = params.lastProcessTime;

        let fetchDataInstance = new oThis.constructor(oThis.params);
        fetchDataInstance = fetchDataInstance.select("count(1) as totalRowCount, max(updated_at) as maxUpdatedAt");

        let query = oThis.fetchQueryWhereClause(fetchDataInstance, lastProcessTime);

        return query.fire();
    }

    /**
     * fetches data from mysql table
     *
     * @return {Promise}
     *
     */
    async fetchData(params) {
        const oThis = this;
        let lastProcessTime = params.lastProcessTime;

        let fetchDataInstance = new oThis.constructor(oThis.params);
        fetchDataInstance = fetchDataInstance.select(oThis.columnsToFetchFromMysql());

        let query = oThis.fetchQueryWhereClause(fetchDataInstance, lastProcessTime);
        query = query.order_by("id asc").limit(params.limit).offset(params.offset);

        return query.fire();
    }

    /**
     * Filter for query to use for Mysql data fetch
     *
     * @return {@constructor}
     *
     */
    fetchQueryWhereClause(fetchDataInstance, lastProcessTime) {
        const oThis = this;
        let query = undefined;

        if (oThis.constructor.defaultFetchType == baseGC.createdTillYesterdayDataExtractionFetchType) {
            query = fetchDataInstance.where(['created_at < ?', dateUtil.getBeginnigOfDayInUTC()]).where(['updated_at > ? OR created_at >= ?', lastProcessTime, dateUtil.getBeginnigOfDayInUTC(lastProcessTime)]);

        } else if (oThis.constructor.defaultFetchType == baseGC.createdTillCurrentTimeDataExtractionFetchType) {
            query = fetchDataInstance.where(['updated_at > ?', lastProcessTime])
        } else {
            throw 'defaultFetchType not implemented'
        }

        return query;
    }

    /**
     * Default Data Extraction Type
     *
     * @return {string}
     *
     */
    static get defaultFetchType() {
        return baseGC.createdTillCurrentTimeDataExtractionFetchType;
    }

    /**
     * columns to be fetched from Mysql
     *
     * @return {string}
     *
     */
    columnsToFetchFromMysql() {
        const oThis = this;
        let columns = [];
        for (let column of oThis.constructor.mapping) {
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
    async updateDataProcessingInfoTable(lastProcessingTimeStr) {
        const oThis = this;
        return await oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema + " set value=$1 " +
            "where property=$2", [lastProcessingTimeStr, oThis.getDataProcessingPropertyName]).then((res) => {
            logger.log(oThis.getDataProcessingPropertyName + " value of the data_processing_info table updated successfully");
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
