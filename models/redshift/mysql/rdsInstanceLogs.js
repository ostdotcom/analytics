const rootPrefix = '../../..',
    Util = require('util'),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogs");

class RDSInstanceLogs {
    constructor(props) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
    }

	  /**
	   * Get temp table name
	   *
	   * @returns {String}
	   */
	  get getTableNameWithSchema() {
	  	const oThis = this;
	  	return RDSInstanceLogsGC.getTableNameWithSchema;
	  };

	/**
     * Update row in rds_instance_logs table
     *
     * @param {recordId} recordId
     * @param {params} params to be updated
     *
     * @return {Promise}
     */
    updateInstanceRowInDB(recordId, params) {
        const oThis = this;
        let arr = [];
        let valArray = [];
        let i = 1;
			  if (params['aws_status']) {
					params['last_action_time'] = Math.floor(Date.now() / 1000);
			  }

        for (let param in params) {
            arr.push(`${param} = $${i}`);
            valArray.push(params[param]);
            i++;
        }

        valArray.push(parseInt(recordId));


        let query = Util.format("UPDATE %s SET %s, updated_at = getdate() where id = %s;",
            oThis.getTableNameWithSchema, arr.join(", "), `$${i}`);

        return oThis.redshiftClient.parameterizedQuery(query, valArray).then(async (res) => {
            return responseHelper.successWithData({});
        });
    }


    /**
     * create entry in rds instance logs table
     * @params {paramsToSaveToDB} Map
     * @return {responseHelper}
     */

    createEntryInRDSInstanceLogs(paramsToSaveToDB) {
        const oThis = this;
        let valuesToInsert = Array.from(paramsToSaveToDB.values());
        let keysToInsert = Array.from(paramsToSaveToDB.keys()).join(", ");
        let insertQuery = Util.format('INSERT into %s (%s, created_at, updated_at) values ($1,$2,$3,$4,$5, getdate(), getdate());',
					oThis.getTableNameWithSchema, keysToInsert);
        return oThis.redshiftClient.parameterizedQuery(insertQuery, valuesToInsert).then(async (res) => {
            return responseHelper.successWithData({});
        })
    }

}
module.exports = RDSInstanceLogs;