const rootPrefix = '..',
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance'),
    DeleteRDSInstance = require(rootPrefix + '/services/delete_rds_instance');

class CreateRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
        oThis.deleteRDSInstance = new DeleteRDSInstance();
    }


    /**
     * create rds instance
     *
     * @return {Promise}
     */
    async perform() {
        const oThis = this;
        let restoreTime = Math.floor(Date.now() / 1000 - 2 * 60 * 60), // 2 hours before current time
            r = await oThis.validateRDSInstanceLogs();

        if (!r.success) {
            return r;
        }

        return oThis.restoreDBInstance.create({RestoreTime: restoreTime}).then(async (res) => {
            let dbInstanceData = res.data.DBInstance;
            if (res.success) {
                let paramsToSaveToDB = new Map ([
                    ['aws_status', `'${dbInstanceData.DBInstanceStatus}'`],
                        ['restore_time', `${restoreTime}`],
                        ['instance_identifier', `'${dbInstanceData.DBInstanceIdentifier}'`],
                        ['cron_status', `'${RDSInstanceLogsGC.cronStatusPending}'`],
                        ['last_action_time', `${restoreTime}`]
                    ]);
                return await oThis.createEntryInRDSInstanceLogs(paramsToSaveToDB);
            } else {
                return res;
            }

        }).catch((err) => {

            return responseHelper.error({
                internal_error_identifier: 'c_rds_i',
                api_error_identifier: 'api_error_identifier',
                debug_options: {err: err}
            });
        });
    }

    /**
     * validate rds_instance_logs_table while creation
     *
     * @return {Promise}
     */
    validateRDSInstanceLogs() {
        const oThis = this;
        let isDeleted;
        let query = `SELECT * FROM ${RDSInstanceLogsGC.getTableNameWithSchema} where aws_status != '${RDSInstanceLogsGC.deletedStatus}'`;
        return oThis.redshiftClient.query(query).then(async (res) => {
            if (res.rows.length > 0) {

                let rows = res.rows.filter((row) => {
                    return row.aws_status == RDSInstanceLogsGC.deletingStatus
                });

                if (rows.length > 0 && (rows.length == res.rows.length)) {
                    isDeleted = await oThis.deleteRDSInstance.checkIfDeleted({maxTimeInMinsToWait: 10});
                    if (isDeleted.success) {
                        return responseHelper.successWithData({});
                    }
                }
                return responseHelper.error({
                    internal_error_identifier: 'msw_vril_1',
                    api_error_identifier: 'api_error_identifier'
                });
            } else {
                return responseHelper.successWithData({});
            }
        });
    }


    /**
     * create entry in rds instance logs table
     * @params {paramsToSaveToDB} Map
     * @return {Promise}
     */

    createEntryInRDSInstanceLogs(paramsToSaveToDB) {

        const oThis = this;
        let valuesToInsert = Array.from(paramsToSaveToDB.values()).join(", ");
        let keysToInsert = Array.from(paramsToSaveToDB.keys()).join(", ");
        let insertQuery = Util.format('INSERT into %s (%s, created_at, updated_at) values (%s, getdate(), getdate());',
            RDSInstanceLogsGC.getTableNameWithSchema, keysToInsert, valuesToInsert);

        console.log(insertQuery, "insertQueryinsertQueryinsertQueryinsertQuery");
        return oThis.redshiftClient.query(insertQuery).then(async (res) => {
            return responseHelper.successWithData({});
        })
    }
}


module.exports = CreateRDSInstance;