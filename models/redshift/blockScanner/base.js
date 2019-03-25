const rootPrefix = "../../.."
    , Redshift = require('node-redshift')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
    , constants = require(rootPrefix + '/configs/constants')
    , Util = require('util')
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , ApplicationMailer = require(rootPrefix + '/lib/applicationMailer');

/**
 * @file - Base class for all the BlockScanner Models
 */
class Base {

    constructor(params) {
        const oThis = this;
        oThis.chainId = params.config.chainId;
        oThis.object = params.object || {};
        oThis.applicationMailer = new ApplicationMailer();
    }

    validateAndFormatBlockScannerData() {
        const oThis = this;
        let formattedMap = new Map();
        for (let column of oThis.constructor.mapping) {
            //eg. column[0] => tx_uuid, column[1] => {name: 'transactionUuid', isSerialized: false, required: true,
            // copyIfNotPresent: 'transactionStatus'}
            if (column[1]['required'] && !(column[1]['name'] in oThis.object)) {
                console.log(column[1]['name']);
                let rh = responseHelper.error(
                    {
                        internal_error_identifier: 'm_r_b_b_vafbsd',
                        api_error_identifier: '',
                        debug_options: oThis.object
                    }
                );
                oThis.applicationMailer.perform(rh);
                return rh;
            }
            let value = oThis.object[column[1]['name']];
            if (column[1]['isSerialized'] == true && value) {
                let fieldData = JSON.parse(value);
                value = fieldData[column[1]['property']];
            }
            value = typeof value == 'undefined' ? oThis.object[column[1]['copyIfNotPresent']] : value;
            formattedMap.set(column[0], value);
        }
        return responseHelper.successWithData({
            data: formattedMap
        });

    }

    formatBlockScannerDataToArray() {
        const oThis = this;
        let r = oThis.validateAndFormatBlockScannerData();
        if (!r.success) return r;
        let formattedMap = r.data;
        return responseHelper.successWithData({
            data: Array.from(formattedMap.data.values())
        });
    }


    async create(insertParams) {
        const oThis = this
        ;
        return new Promise(function (resolve, reject) {
            try {
                oThis.tableModel.create(insertParams, function (err, response) {
                    if (err) {
                        reject(err);
                    } else {
                        logger.log("batch data inserted successfully");
                        resolve(response);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }


    initRedshift(){
        const oThis = this;
        oThis.redshiftClient = new Redshift(constants.PRESTAGING_REDSHIFT_CLIENT);
    }


    copyFromS3(fullFilePath) {

        const oThis = this
            , s3BucketPath = 's3://' + constants.S3_BUCKET_NAME + '/'


            , copyTable = Util.format('copy %s (%s) from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.getTempTableNameWithSchema(), oThis.getColumnList, s3BucketPath + fullFilePath, oThis.getIamRole())
            , commit = 'COMMIT;'
            ;

            const deleteDuplicateIds = Util.format('DELETE from %s WHERE %s IN (SELECT %s from %s);', oThis.getTableNameWithSchema(), oThis.getTablePrimaryKey(), oThis.getTablePrimaryKey(), oThis.getTempTableNameWithSchema());


            const insertRemainingEntries = Util.format('INSERT into %s (%s) (select %s from %s);', oThis.getTableNameWithSchema(), oThis.getColumnList,oThis.getColumnList, oThis.getTempTableNameWithSchema())
            , truncateTempTable = Util.format('TRUNCATE TABLE %s;', oThis.getTempTableNameWithSchema())
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

    getTempTableNameWithSchema() {
        throw 'getTempTableNameWithSchema not implemented'
    };

    getIamRole() {
        return constants.S3_IAM_ROLE
    };


}

module.exports = Base;