const rootPrefix = '..',
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    RestoreDBInstance = require(rootPrefix + '/lib/RestoreRDSInstance');

class CheckRDSInstance {

    constructor(params) {
        const oThis = this;
        oThis.params = params;
        oThis.redshiftClient = new RedshiftClient();
        oThis.applicationMailer = new ApplicationMailer();
        oThis.restoreDBInstance = new RestoreDBInstance();
        oThis.dbInstanceIdentifier = '';
    }

    /**
     * Processing rds instance if default is not used, and calls mysql services
     *
     * @return {Promise}
     */
    async process() {

        const oThis = this;
        let promiseArray = [];
        let r = {};

        r = await oThis.validateRDSLogs();

        console.log("rrrrrr",r);

        if (!r.success) {
            return Promise.reject(r);
        }

        r = await oThis.checkAvailabilityOfRDSInstance();
        if (!r.success) {
            oThis.applicationMailer.perform({subject: 'RDSInstanceLogs table error', body: r});
            return Promise.reject(r);
        }

        return Promise.resolve(responseHelper.successWithData({}));


    }


    /**
     * validate RDSInstanceLogs table
     *
     * @return {responseHelper}
     *
     */
    validateRDSLogs() {
        const oThis = this;
        let query = `SELECT * FROM ${RDSInstanceLogsGC.getTableNameWithSchema} where aws_status != '${RDSInstanceLogsGC.deletedStatus}'`;
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
                oThis.dbInstanceIdentifier = resultRow.instance_identifier;
                return responseHelper.successWithData({})
            }


        });
    }


    /**
     * check health of RDS instance
     *
     * @return {responseHelper}
     */
    async checkAvailabilityOfRDSInstance() {
        const oThis = this,
            maxTimeInMinsToWait = 60,
            warningTimeInMinsToWait = 30;
        let currentTime = 0;
        let timeStep = 5;
        let checkAvailability = {};
        let isAvailable = false;


        while (!(checkAvailability.success && isAvailable) && currentTime < maxTimeInMinsToWait) {
            (function (currentTime) {
                setTimeout(async function () {
                    checkAvailability = await oThis.checkStatusAndSendWarningMail(currentTime, warningTimeInMinsToWait);
                    isAvailable = checkAvailability.data.mappedAwsStatus === RDSInstanceLogsGC.availableStatus;
                }, currentTime * 1000 * 60); //timeout is in milliseconds

            })(currentTime += timeStep);
        }

        if (checkAvailability.success && isAvailable) {

            await oThis.restoreDBInstance.updateInstanceRowInDB(oThis.dbInstanceIdentifier, {
                'aws_status': checkAvailability.data.awsStatus,
                'host': checkAvailability.data.host
            });
            return responseHelper.successWithData({host: checkAvailability.data.host});
        } else {
            let r = responseHelper.error({
                internal_error_identifier: 'msw_chri',
                api_error_identifier: 'api_error_identifier'
            });
            oThis.applicationMailer.perform({subject: 'Error: RDSInstanceLogs not available for long time', body: r});
            return r;
        }
    }


    /**
     * check status of rds instance and send warning mail if not processed within time.
     *
     * @return {responseHelper}
     */
    async checkStatusAndSendWarningMail(currentTime, warningTimeInMinsToWait) {
        const oThis = this;
        let checkRDSStatus = await oThis.restoreDBInstance.checkStatus({dbInstanceIdentifier: oThis.dbInstanceIdentifier});
        if (currentTime >= warningTimeInMinsToWait) {
            oThis.applicationMailer.perform({
                subject: 'Warning: RDSInstanceLogs not able to delete since long time',
                body: {}
            });
        }
        return checkRDSStatus;
    }
}

module.exports = CheckRDSInstance;