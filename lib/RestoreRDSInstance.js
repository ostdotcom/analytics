const rootPrefix = '..',
    ManageRDSWrapper = require(rootPrefix + "/lib/ManageRDSInstanceWrapper"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    rDSInstanceLogsGC = require(rootPrefix + '/lib/globalConstants/redshift/RDSInstanceLogsGC');


class RestoreRDSInstance {

    constructor() {
        const oThis = this;
        oThis.manageRDSWrapper = new ManageRDSWrapper();
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
            DBInstanceIdentifier: params.dbInstanceId,
            Filters: [
                {
                    Name: 'db-instance-id', /* required */
                    Values: [ /* required */
                        params.dbInstanceId,
                        /* more items */
                    ]
                },
                /* more items */
            ]
        };
        return oThis.manageRDSWrapper.checkStatus(defaultParams).then((res) => {

            let dbInstance = res.data.DBInstances.filter((instance) => {
                return instance.DBInstanceIdentifier == params.dbInstanceId;
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