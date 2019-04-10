'use strict';
/**
 * This service gets the details from the tokens table and write that details into csv file
 *
 * @module services/token
 */

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants'),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    tokenModel = require(rootPrefix + "/models/redshift/mysql/token");

/**
 * Class token to get the records from the tokens table and process that records.
 *
 * @class
 */
class test {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params) {
        const oThis = this;
        oThis.chainId = params.chainId;
        oThis.applicationMailer = new ApplicationMailer();
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
        await oThis.process();
    }

    /**
     * Process
     *
     * @return {Promise}
     *
     */
    async process() {
        const oThis = this;
        try {
            oThis.s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`;
            oThis.localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${oThis.s3UploadPath}`;

            let token1 = new tokenModel({chainId: oThis.chainId});
            await token1.fetchDetailsAndWriteIntoLocalFile(oThis.localDirFullFilePath);
            await oThis.uploadLocalFilesToS3();
            // await token1.updateDataProcessingInfoTable();
        } catch(e){
            logger.error("token service terminated due to exception-" , e);
            let rH = responseHelper.error({

                internal_error_identifier: 's_t_p_1',
                api_error_identifier: 'api_error_identifier',
                debug_options: {error: e}
            });
            oThis.applicationMailer.perform({subject: "token service terminated due to exception" ,body: {error: rH}});
            return Promise.reject(rH);
        }
    }

    /**
     * Upload local files to s3
     *
     * @return {Promise}
     *
     */
    async uploadLocalFilesToS3() {
        const oThis = this;
        let hasFilesInTheDirectory = false;

        for (let modelToPerform of
            [{localPath: "/tokens", model: tokenModel}]) {

            let r = await S3Write.uploadToS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`,
                `${oThis.localDirFullFilePath}${modelToPerform.localPath}`);

            if (r.data.hasFiles) {
                let operationModel = new modelToPerform.model({chainId: oThis.chainId});
                hasFilesInTheDirectory = true;

                operationModel.initRedshift();
                await operationModel.copyFromS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`);
            }
        }
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
     * Get file path for the token service
     *
     */
    get getFilePath() {
        return "/tokens";
    }

}

module.exports = test;