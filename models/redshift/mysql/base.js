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
        oThis.dbName = params.dbName;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.validateAndSanitize = new ValidateAndSanitize({mapping: oThis.constructor.mapping,
            fieldsToBeMoveToAnalytics: oThis.constructor.fieldsToBeMoveToAnalytics });
        oThis.redshiftClient = new RedshiftClient();
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
    async copyFromS3(fullFilePath) {

        const oThis = this
        ;

        let downloadToTemp = await new DownloadToTemp({tempTableName: oThis.getTempTableNameWithSchema(), columnList: oThis.getColumnList}).copyFromS3ToTemp(fullFilePath);

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
                logger.info('Copy from S3 complete')
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
    async _getLastUpdatedAtValue() {
        const oThis = this;
        return await oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId + " "+"where property= $1", [oThis.getDataProcessingPropertyName]).then((res) => {
            logger.log(res.rows);
            return (res.rows[0].value);
        });
    }

    /**
     * Update last updated at value of the data_processing_info_{chain_id} table
     *
     * @return {Promise}
     *
     */
    async updateDataProcessingInfoTable() {
        const oThis = this;
        let LastUpdatedAtValue = await oThis.getLastUpdatedAtValueFromTable();

        return await oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId +  " set value=$1 " +
            "where property=$2", [LastUpdatedAtValue, oThis.getDataProcessingPropertyName]).then((res) => {
            logger.log("token_last_updated_at value of the data_processing_info table updated successfully");
        });
    }

    /**
     * Get max updated_at column value from the table of redshift
     *
     * @return {Promise}
     *
     */
    async getLastUpdatedAtValueFromTable(){
        const oThis = this;
        return await oThis.redshiftClient.query("select max(updated_at) from " + new oThis.constructor({}).getTableNameWithSchema()).then((res) => {
            logger.log(res.rows);
            let LastUpdatedAtValue = dateUtil.convertDateToString(res.rows[0].max);
            return (LastUpdatedAtValue);
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
    getTempTableNameWithSchema() {
        throw 'getTempTableName not implemented'
    };

    /**
     * Get s3 file path
     *
     * @returns {String}
     */
    getS3FilePath() {
        return `s3://${ Constants.S3_BUCKET_NAME}/`
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
        throw 'getDataProcessingPropertyName not implemented'
    }

}

module.exports = ModelBase;
