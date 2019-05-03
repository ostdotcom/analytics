const rootPrefix = '..',
    ManageRDSWrapper = require(rootPrefix + "/lib/ManageRDSInstanceWrapper"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    RDSInstanceLogs = require(rootPrefix + '/lib/globalConstants/redshift/RDSInstanceLogs'),
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
        let defaultParams = RDSInstanceLogs.restoreInstanceParams;

        let paramsToUse = {...defaultParams, ...params};
        return oThis.manageRDSWrapper.create(paramsToUse).then((res) => {
            return res;
        });
    }


    /**
     * check rds instace status
     *
     * @param {params} params required for checking status
     *
     * @return {Promise}
     */
    async describeDBInstances(params) {
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
        return oThis.manageRDSWrapper.describeDBInstances(defaultParams).then((res) => {

            let data = {};

            if (res.success){

                let dbInstance = res.data.DBInstances.filter((instance) => {
                    return instance.DBInstanceIdentifier == params.dbInstanceIdentifier;
                })[0];
                if (dbInstance.Endpoint) {
                    data = {
                        host: dbInstance.Endpoint.Address,
                        port: dbInstance.Endpoint.Port,
                        hostedZoneId: dbInstance.Endpoint.HostedZoneId,
                        awsStatus: dbInstance.DBInstanceStatus,
                        mappedAwsStatus: RDSInstanceLogs.mappingOfAwsStatus[dbInstance.DBInstanceStatus]
                    }
                }
                return responseHelper.successWithData(data);
            } else {
                return res;
            }
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
            DBInstanceIdentifier: params.dbInstanceIdentifier, /* required */
            DeleteAutomatedBackups: true,
            SkipFinalSnapshot: true
        };

        return oThis.manageRDSWrapper.delete(defaultParams).then((res) => {
            return res;
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
            arr.push(`last_action_time = ${Math.floor(Date.now()/1000)}`);
        }


        let query = Util.format("UPDATE %s SET $1, updated_at = $2 where instance_identifier = $3);",
            RDSInstanceLogs.getTableNameWithSchema);

        return oThis.redshiftClient.parameterizedQuery(query, [arr.join(", "), getdate(), dbInstanceId]).then(async (res) => {
            return responseHelper.successWithData({});
        });
    }
}

module.exports = RestoreRDSInstance;