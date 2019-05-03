const rootPrefix = '..',
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogs = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance'),
    logger = require(rootPrefix + "/helpers/custom_console_logger");
class CreateRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
    }


    /**
     * create rds instance
     *
     * @return {responseHelper}
     */
    async perform() {
        const oThis = this;
        let restoreTime = Math.floor((Date.now() / 1000) - 10 * 60), // 5 minute before current time
            r = await oThis.validateRDSInstanceLogs();

        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'Error in create RDS instance service-validateRDSInstanceLogs ', body: r});
            return r;
        }

        return oThis.restoreDBInstance.create({RestoreTime: restoreTime}).then(async (res) => {

            logger.log(res.data, "DBInstanceStatusDBInstanceStatusDBInstanceStatus");
            let dbInstanceData = res.data.DBInstance;
            if (res.success) {
                let paramsToSaveToDB = new Map ([
                    ['aws_status', dbInstanceData.DBInstanceStatus],
                        ['restore_time', restoreTime],
                        ['instance_identifier', dbInstanceData.DBInstanceIdentifier],
                        ['cron_status', RDSInstanceLogs.cronStatusPending],
                        ['last_action_time',  Math.floor(Date.now() / 1000)]
                    ]);
                return await oThis.createEntryInRDSInstanceLogs(paramsToSaveToDB);
            } else {
                oThis.applicationMailer.perform({subject: 'Error while creating RDS instance', body: res});
                return res;
            }

        }).catch((err) => {
            oThis.applicationMailer.perform({subject: 'Exception in creating RDS instance', body: err});
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
     * @return {responseHelper}
     */
    validateRDSInstanceLogs() {
        const oThis = this;
        let isDeleted;
        //todo: use parameterized
        let query = Util.format("SELECT * FROM %s where aws_status != $1", RDSInstanceLogs.getTableNameWithSchema);

        return oThis.redshiftClient.parameterizedQuery(query, [RDSInstanceLogs.deletedStatus]).then(async (res) => {
            if (res.rows.length > 0) {
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
     * @return {responseHelper}
     */

    createEntryInRDSInstanceLogs(paramsToSaveToDB) {

        const oThis = this;
        let valuesToInsert = Array.from(paramsToSaveToDB.values()).join(", ");
        let keysToInsert = Array.from(paramsToSaveToDB.keys()).join(", ");
        let insertQuery = Util.format('INSERT into %s (%s, created_at, updated_at) values ($1, getdate(), getdate());',
            RDSInstanceLogs.getTableNameWithSchema, keysToInsert);
        return oThis.redshiftClient.parameterizedQuery(insertQuery,[valuesToInsert]).then(async (res) => {
            return responseHelper.successWithData({});
        })
    }
}


module.exports = CreateRDSInstance;