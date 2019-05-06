const rootPrefix = '..',
    Util = require('util'),
    ManageRDSWrapper = require(rootPrefix + "/lib/ManageRDSInstanceWrapper"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    RDSInstanceLogs = require(rootPrefix + '/lib/globalConstants/redshift/RDSInstanceLogs'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
	  Constants = require(rootPrefix + "/configs/constants"),
	  logger = require(rootPrefix + "/helpers/custom_console_logger"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer');


class RDSInstanceOperations {

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

			if (Constants.ENVIRONMENT == 'development') {
       return	responseHelper.successWithData(
					{
						DBInstance: {
							DBInstanceStatus: 'creating',
							DBInstanceIdentifier: 'DEV-DUMMY-DB-IDENTIFIER'
						}
					}
				);
				}

			logger.log("Starting to create RDS Instance");
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
        let dBInstanceIdentifier;

			  if (Constants.ENVIRONMENT == 'development') {
			  	dBInstanceIdentifier = Constants.RDS_RESTORE_INSTANCE_PARAMS.SourceDBInstanceIdentifier;
			  }else{
			  	dBInstanceIdentifier = params.dbInstanceIdentifier;
        }

        let defaultParams = {
            DBInstanceIdentifier: dBInstanceIdentifier,
            Filters: [
                {
                    Name: 'db-instance-id', /* required */
                    Values: [ /* required */
											  dBInstanceIdentifier,
                        /* more items */
                    ]
                },
                /* more items */
            ]
        };

			  logger.log("Start Describe RDS DB Instances");
        return oThis.manageRDSWrapper.describeDBInstances(defaultParams).then((res) => {

            let data = {};

            if (res.success){

                let dbInstance = res.data.DBInstances.filter((instance) => {
                    return instance.DBInstanceIdentifier == dBInstanceIdentifier;
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

			  logger.log("Starting to DELETE RDS Instance");
        return oThis.manageRDSWrapper.delete(defaultParams).then((res) => {
            return res;
        });

    }
}

module.exports = RDSInstanceOperations;