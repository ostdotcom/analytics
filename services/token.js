'use strict';
/**
 * This service gets the details of the tokens table and write that details into csv file
 *
 * @module services/token
 */

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants'),
    tokenObj = require(rootPrefix + '/models/mysql/Token'),
    RedshiftClient = require("node-redshift"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redShift/dataProcessingInfo"),
    localWrite = require(rootPrefix + "/lib/localWrite");

/**
 * Class for token details.
 *
 * @class
 */
class token {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor() {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient(Constants.REDSHIFT_CLIENT)
    }

    async _fetchTokenDetails() {
        const oThis = this;
        let offset = 0;
        let tokensRecords;
        let fileName = "/Users/tejassangani/OST/pentaho/analytics/services" + /tokens/ + new Date().getTime()+ '.txt';
        let lastUpdatedAtValue = await oThis._getTokenLastUpdatedAtValue();
        console.log("The lastUpdatedAtValue is : "+ lastUpdatedAtValue);
        tokensRecords = await new tokenObj().select("*").where("updated_at > '"+lastUpdatedAtValue+"'").order_by("id").limit(50).offset(offset).fire();
        while(tokensRecords.length > 0){

            await new localWrite()._write(tokensRecords, fileName);
            offset += 50;
            tokensRecords = await new tokenObj().select("*").where("updated_at > '"+lastUpdatedAtValue+"'").order_by("id").limit(50).offset(offset).fire();
        }

    }

    async _getTokenLastUpdatedAtValue () {
        const oThis = this;

        return await oThis.redshiftClient.query("select * from " + dataProcessingInfoGC.getTableNameWithSchema).then((res) => {
            console.log(res.rows);
            let tokenLastUpdatedAt = res.rows.filter((row) => (row.property == dataProcessingInfoGC.tokenLastUpdatedAtProperty));
            return (tokenLastUpdatedAt[0].value);
        });
    }

}

module.exports = token;