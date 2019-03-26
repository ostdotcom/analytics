'use strict';
/**
 * This service gets the details from the tokens table and write that details into csv file
 *
 * @module services/token
 */

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants'),
    RedshiftClient = require("node-redshift"),
    shell = require("shelljs"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redShift/dataProcessingInfo"),
    localWrite = require(rootPrefix + "/lib/localWrite"),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    dateUtil = require(rootPrefix + "/lib/dateUtil"),
    tokenModel = require(rootPrefix + "/models/mysql/token");

/**
 * Class token to get the records from the tokens table and process that records.
 *
 * @class
 */
class Token {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient(Constants.PRESTAGING_REDSHIFT_CLIENT);
        oThis.chainId = params.chainId;
    }

    /**
     * Process all the token records from Tokens table
     *
     * @return {Promise}
     *
     */
    async processTokens() {
        const oThis = this;
        oThis.OperationModel = tokenModel;
        oThis.s3DirPathSuffix = "/tokens";
        let response = await oThis.process();
        return response;
    }

    /**
     * Process
     *
     * @return {Promise}
     *
     */
    async process() {
        const oThis = this;
        await oThis._fetchTokenDetailsAndWriteIntoLocalFile();
        await oThis._uploadLocalFilesToS3();
        await oThis._updateTokenLastUpdatedAtValue();
    }

    /**
     * Fetch token records and write those records into Local File
     *
     */
    async _fetchTokenDetailsAndWriteIntoLocalFile() {
        const oThis = this;
        let offset = 0;
        let tokensRecords;
        let totalRecordProcessed = 0;

        oThis.s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`;
        oThis.localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${oThis.s3UploadPath}`;
        oThis.fileName = oThis.localDirFullFilePath + oThis.getFilePath + "/" + Date.now() + '.csv';

        let lastUpdatedAtValue = await oThis._getTokenLastUpdatedAtValue();
        tokensRecords = await new tokenModel({}).select("*").where(['updated_at > ?', lastUpdatedAtValue]).order_by("id").limit(50).offset(offset).fire();

        let LocalWrite = new localWrite({separator: "|"});
        if(tokensRecords.length > 0){
            shell.mkdir("-p", oThis.localDirFullFilePath + oThis.getFilePath);
        }

        while (tokensRecords.length > 0) {
            totalRecordProcessed += tokensRecords.length;
            if(totalRecordProcessed > 500){
                totalRecordProcessed = 0;
                oThis.fileName = oThis.localDirFullFilePath + oThis.getFilePath + "/" + Date.now() + '.csv';
            }
            let arrayOfList = new tokenModel({}).formatData(tokensRecords);
            if (arrayOfList.length === 0) {
                return Promise.resolve(responseHelper.successWithData({hasTokens: false}));
            }

            await LocalWrite.writeArray(arrayOfList, oThis.fileName);
            offset += 50;
            tokensRecords = await new tokenModel({}).select("*").where(['updated_at > ?', lastUpdatedAtValue]).order_by("id").limit(50).offset(offset).fire();
        }

    }

    /**
     * Get token last updated at value from data_processing_info_{chain_id}
     *
     * @return {Promise}
     *
     */
    async _getTokenLastUpdatedAtValue() {
        const oThis = this;

        return await oThis.redshiftClient.parameterizedQuery("select * from " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId + " "+"where property= $1", [dataProcessingInfoGC.tokenLastUpdatedAtProperty]).then((res) => {
            console.log(res.rows);
            return (res.rows[0].value);
        });
    }

    /**
     * Upload local files to s3
     *
     * @return {Promise}
     *
     */
    async _uploadLocalFilesToS3() {
        const oThis = this;
        let hasFilesInTheDirectory = false;

        for (let modelToPerform of
            [{localPath: "/tokens", model: tokenModel}]) {

            let r = await oThis.uploadToS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`,
                `${oThis.localDirFullFilePath}${modelToPerform.localPath}`);

            if (r.data.hasFiles) {
                let operationModel = new modelToPerform.model({chainId: oThis.chainId});
                hasFilesInTheDirectory = true;

                operationModel.initRedshift();
                await operationModel.copyFromS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`);
            }
        }
        oThis._deleteLocalDirectory(oThis.localDirFullFilePath, hasFilesInTheDirectory);
    }

    /**
     * Upload file to s3
     *
     * @return {Promise}
     *
     */
    async uploadToS3(s3UploadPath, localDirFullFilePath) {

        let s3Write = new S3Write({
                "region": Constants.S3_REGION,
                "accessKeyId": Constants.S3_ACCESS_KEY,
                "secretAccessKey": Constants.S3_ACCESS_SECRET
            },
            {
                s3_bucket_name: Constants.S3_BUCKET_NAME,
                bucket_path: s3UploadPath,
                dir_path: localDirFullFilePath
            });

        return await s3Write.uploadFiles();

    }

    /**
     * Get max updated_at column value from the tokens_{chain_id} table of redshift
     *
     * @return {Promise}
     *
     */
    async _getLastUpdatedAtValueFromTokenTable(){
        const oThis = this;

        return await oThis.redshiftClient.query("select max(updated_at) from " + new tokenModel({chainId: oThis.chainId}).getTableNameWithSchema()).then((res) => {
            console.log(res.rows);
            let LastUpdatedAtValue = dateUtil.convertDateToString(res.rows[0].max);
            return (LastUpdatedAtValue);
        });

    }

    /**
     * Update token last updated at value of the data_processing_info_{chain_id} table
     *
     * @return {Promise}
     *
     */
    async _updateTokenLastUpdatedAtValue() {
        const oThis = this;
        let LastUpdatedAtValue = await oThis._getLastUpdatedAtValueFromTokenTable();

        return await oThis.redshiftClient.parameterizedQuery("update " + dataProcessingInfoGC.getTableNameWithSchema + "_" + oThis.chainId +  " set value=$1 " +
            "where property=$2", [LastUpdatedAtValue, dataProcessingInfoGC.tokenLastUpdatedAtProperty]).then((res) => {
            console.log("token_last_updated_at value of the data_processing_info table updated successfully");
        });
    }

    /**
     * Get file path for the token service
     *
     */
    get getFilePath() {
        return "/tokens";
    }

    async _deleteLocalDirectory(localDirFullFilePath, hasFilesInTheDirectory) {
        if(hasFilesInTheDirectory){
            shell.rm("-rf", localDirFullFilePath);
            console.log("The directory " + localDirFullFilePath + " is deleted successfully");
        }
    }

}

module.exports = Token;