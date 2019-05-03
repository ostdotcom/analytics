const rootPrefix = '..',
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogs = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RDSInstanceOperations = require(rootPrefix + '/lib/RDSInstanceOperations'),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    RDSInstanceLogsModel = require(rootPrefix + '/models/redshift/mysql/rdsInstanceLogs');
class CreateRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.rdsInstanceOperations = new RDSInstanceOperations();
        oThis.rdsInstanceLogsModel = new RDSInstanceLogsModel();
    }


    /**
     * create rds instance
     *
     * @return {responseHelper}
     */
    async perform() {
        const oThis = this;
        let restoreTime = Math.floor((Date.now() / 1000) - 10 * 60), // 10 minute before current time
            r = await oThis.validateRDSInstanceLogs();

        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'Error in create RDS instance service-validateRDSInstanceLogs ', body: r});
            return r;
        }

        return oThis.rdsInstanceOperations.create({RestoreTime: restoreTime}).then(async (res) => {
            let dbInstanceData = res.data.DBInstance;
            if (res.success) {
                let paramsToSaveToDB = new Map ([
                        ['aws_status', dbInstanceData.DBInstanceStatus],
                        ['restore_time', restoreTime],
                        ['instance_identifier', dbInstanceData.DBInstanceIdentifier],
                        ['cron_status', RDSInstanceLogs.cronStatusPending],
                        ['last_action_time',  Math.floor(Date.now() / 1000)]
                    ]);
                return await oThis.rdsInstanceLogsModel.createEntryInRDSInstanceLogs(paramsToSaveToDB);
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
}


module.exports = CreateRDSInstance;