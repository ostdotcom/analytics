const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    sleep = require(rootPrefix + '/lib/sleep'),
    RDSInstanceLogs = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance');

class DeleteRDSInstance {

    constructor() {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {responseHelper}
     */
    async process(params) {

        const oThis = this;
        let r ;
        oThis.dbInstanceIdentifier = params.dbInstanceIdentifier;

        r = await oThis.deleteMysqlInstance({dbInstanceIdentifier: params.dbInstanceIdentifier});

        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'RDSInstance could not be deleted', body: r});
            return r;
        }

        return responseHelper.successWithData({
            dbInstanceIdentifier: oThis.dbInstanceIdentifier
        });
    }

    /**
     * Delete RDS instance
     *
     * @param {params} params required for deletion
     *
     * @return {responseHelper}
     */

    async deleteMysqlInstance(params) {
        const oThis = this;
        let isDeleted;
        let r = await oThis.restoreDBInstance.delete(params);
        //todo: or condition remove
        if (r.success) {

            let describeDBInstances = await oThis.restoreDBInstance.describeDBInstances(params);

            if (describeDBInstances.success) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(params.dbInstanceIdentifier, {'aws_status': describeDBInstances.data.awsStatus});
            }

            isDeleted = await oThis.checkIfDeleted({});

            if (isDeleted.success) {
                await oThis.restoreDBInstance.updateInstanceRowInDB(oThis.dbInstanceIdentifier, {'aws_status': RDSInstanceLogs.deletedStatus});
                return isDeleted;
            }
        } else {
            oThis.applicationMailer.perform({subject: 'Not able to delete instance', body: r});
            return responseHelper.error({
                internal_error_identifier: 'd_rds_i_d_m_i_1',
                api_error_identifier: 'api_error_identifier'
            });
        }
        return responseHelper.error({
            internal_error_identifier: 'd_rds_i_d_m_i_2',
            api_error_identifier: 'api_error_identifier'
        });
    }


    /**
     * check if RDS instance deleted
     *
     * @return {responseHelper}
     */
    async checkIfDeleted(params) {

        const oThis = this,
            maxTimeInMinsToWait = params.maxTimeInMinsToWait || 10; //default wait for 10 mins to delete instance
        let currentTime = 0;
        let timeStep = 1; // check status of instance on every timestep minute
        let describeDBInstances = {};
        let isDeleted = false;


        while (true) {
            describeDBInstances = await oThis.restoreDBInstance.describeDBInstances({dbInstanceIdentifier: oThis.dbInstanceIdentifier});

            isDeleted = describeDBInstances.debug_options.error &&
                describeDBInstances.debug_options.error.code === RDSInstanceLogs.errorCodeDBInstanceNotFound;


            if (describeDBInstances.success === false && isDeleted) {
                return responseHelper.successWithData({
                    host: describeDBInstances.data.host,
                    dbInstanceIdentifier: oThis.dbInstanceIdentifier
                });
            } else if (currentTime >= maxTimeInMinsToWait) {
                let r = responseHelper.error({
                    internal_error_identifier: 'd_rds_i_c_i_d',
                    api_error_identifier: 'api_error_identifier'
                });
                oThis.applicationMailer.perform({
                    subject: 'Error: RDSInstanceLogs not deleted for long time',
                    body: r
                });
                return r;
            }

            //timeout is in milliseconds
            currentTime += timeStep;
            sleep(currentTime * 1000 * 60); // in minutes

        }
    }


}

module.exports = DeleteRDSInstance;