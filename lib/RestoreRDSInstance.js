const rootPrefix = '..',
    ManageRDSWrapper = require(rootPrefix + "/lib/ManageRDSInstanceWrapper"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    rDSInstanceLogsGC = require(rootPrefix + '/lib/globalConstants/redshift/RDSInstanceLogsGC'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer');


class RestoreRDSInstance {

    constructor() {
        const oThis = this;
        oThis.manageRDSWrapper = new ManageRDSWrapper();
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
    }

    /**
     * create rds instace
     *
     * @param {params} params required for creation
     *
     * @return {Promise}
     */

    async create(params) {
        const oThis = this;
        let defaultParams = rDSInstanceLogsGC.restoreInstanceParams;

        let paramsToUse = {...defaultParams, ...params};
        return oThis.manageRDSWrapper.create(paramsToUse).then((res) => {
            return oThis.formatResponse(res);
        }).catch((err) => {
            console.log(err);
            return oThis.formatResponse(err);
        });
    }


    /**
     * check rds instace status
     *
     * @param {params} params required for checking status
     *
     * @return {Promise}
     */
    async checkStatus(params) {
        const oThis = this;
        let defaultParams = {
            DBInstanceIdentifier: params.dbInstanceIdentifier,
            Filters: [
                {
                    Name: 'db-instance-id', /* required */
                    Values: [ /* required */
                        params.dbInstanceIdentifier,
                        /* more items */
                    ]
                },
                /* more items */
            ]
        };
        return oThis.manageRDSWrapper.checkStatus(defaultParams).then((res) => {

            let dbInstance = res.data.DBInstances.filter((instance) => {
                return instance.DBInstanceIdentifier == params.dbInstanceIdentifier;
            })[0];
            return oThis.formatResponse({
                data: {
                    host: dbInstance.Endpoint.Address,
                    port: dbInstance.Endpoint.Port,
                    hostedZoneId: dbInstance.Endpoint.HostedZoneId,
                    awsStatus: dbInstance.DBInstanceStatus,
                    mappedAwsStatus: rDSInstanceLogsGC.mappingOfAwsStatus[dbInstance.DBInstanceStatus]
                }
            });
        }).catch((err) => {
            console.log(err);
            return oThis.formatResponse(err);
        });


    }


    /**
     * delete rds instance
     *
     * @param {params} params required deletion
     *
     * @return {Promise}
     */
    async delete(params) {
        const oThis = this;
        var defaultParams = {
            DBInstanceIdentifier: params.dbInstanceId, /* required */
            // DeleteAutomatedBackups: true,
            SkipFinalSnapshot: true
        };

        return oThis.manageRDSWrapper.delete(defaultParams).then((res) => {
            return oThis.formatResponse(res);
        }).catch((err) => {
            console.log(err);
            return oThis.formatResponse(err);
        });

    }


    /**
     * Update row in rds_instance_logs table
     *
     * @param {dbInstanceId} dbInstanceId
     * @param {params} params to be updated
     *
     * @return {Promise}
     */
    updateInstanceRowInDB(dbInstanceId, params) {
        const oThis = this;
        let arr = [];
        for (let param in params) {
            arr.push(`${param}='${params[param]}'`)
        }

        if (params['aws_status']){
            arr.push(`last_action_time = ${Date.now()/1000}`);
        }



        let query = `UPDATE ${RDSInstanceLogsGC.getTableNameWithSchema} SET ${arr.join(", ")}, updated_at = getdate() where
                    status != '${RDSInstanceLogsGC.deletedStatus}' and instance_identifier = ${dbInstanceId}`;
        return oThis.redshiftClient.query(query).then(async (res) => {
            return responseHelper.successWithData({});
        });
    }

    /**
     * validate RDSInstanceLogs table
     *
     * @return {responseHelper}
     *
     */
    validateRDSLogs() {
        const oThis = this;
        let query = `SELECT * FROM ${rDSInstanceLogsGC.getTableNameWithSchema} where aws_status != '${rDSInstanceLogsGC.deletedStatus}'`;
        return oThis.redshiftClient.query(query).then((res) => {
            let resultRow = res.rows[0];
            if (res.rows.length > 1) {
                let r = responseHelper.error({
                    internal_error_identifier: 'msw_v_rds_l',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({subject: 'More than one not deleted instances available', body: r});
                return r;
            } else {
                return responseHelper.successWithData({dbInstanceId: resultRow.instance_identifier})

            }


        });
    }




    /**
     * formats response
     *
     * @param {res}
     *
     * @return {responseHelper}
     */
    formatResponse(res) {
        if (res.err) {
            return responseHelper.error({
                    internal_error_identifier: 'r_rds_ifr',
                    api_error_identifier: 'api_error_identifier',
                    debug_options: {error: res.err}
                }
            )
        } else if (res.data) {
            return responseHelper.successWithData(res.data);
        }
    }

}

module.exports = RestoreRDSInstance;