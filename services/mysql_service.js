'use strict';
/**
 * This service gets the details from the tokens table and write that details into csv file
 *
 * @module services/mysql
 */

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants'),
    RedshiftClient = require(rootPrefix + '/lib/redshift'),
    shell = require("shelljs"),
    dataProcessingInfoGC = require(rootPrefix + "/lib/globalConstants/redshift/dataProcessingInfo"),
    localWrite = require(rootPrefix + "/lib/localWrite"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    Token = require(rootPrefix + "/models/redshift/mysql/token"),
    TokenAddresses = require(rootPrefix + "/models/redshift/mysql/tokenAddresses"),
    Workflows = require(rootPrefix + "/models/redshift/mysql/workflows"),
    WorkflowSteps = require(rootPrefix + "/models/redshift/mysql/workflowSteps"),
    StakerWhitelistedAddresses = require(rootPrefix + "/models/redshift/mysql/stakerWhitelistedAddresses"),
    ChainAddresses = require(rootPrefix + "/models/redshift/mysql/chainAddresses"),
    DownloadToTemp = require(rootPrefix + '/lib/downloadToTemp');

/**
 * Class token to get the records from the tokens table and process that records.
 *
 * @class
 */
class MysqlService {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params) {
        const oThis = this;

        oThis.Model = eval(params.model);
        oThis.chainId = params.chainId || 0;
        oThis.applicationMailer = new ApplicationMailer();
        oThis.redshiftClient = new RedshiftClient();
        oThis.model = new oThis.Model({chainId: oThis.chainId});
        oThis.s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}/${oThis.model.getTableName()}`;
        oThis.localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${oThis.s3UploadPath}`;
    }


    /**
     * Process
     *
     * @return {Promise}
     *
     */
    async process() {
        const oThis = this;
        let currentDate = new Date();

        try {
            await oThis.fetchDetailsAndWriteIntoLocalFile();
            await oThis.uploadLocalFilesToS3();
            await oThis.model.insertToMainFromTemp();
            await oThis.model.updateDataProcessingInfoTable(currentDate);
        } catch (e) {
            logger.error("token service terminated due to exception-", e);
            let rH = responseHelper.error({

                internal_error_identifier: 's_t_p_1',
                api_error_identifier: 'api_error_identifier',
                debug_options: {error: e}
            });
            oThis.applicationMailer.perform({
                subject: "token service terminated due to exception",
                body: {error: rH}
            });
            return Promise.reject(rH);
        }
        return Promise.resolve(responseHelper.successWithData({}));
    }


    /**
     * Fetch records and write those records into Local File
     *
     */
    async fetchDetailsAndWriteIntoLocalFile() {
        const oThis = this;
        let lastProcessedId = -1;
        let records;
        let totalRecordProcessed = 0;
        let localWriteObj = new localWrite({separator: "|"});
        let arrayOfList = [];
        let fileName = '';
        const recordsToFetchOnce = 100,
            recordsToWriteOnce = 1000;

        while (true) {
            records = await oThis.model.fetchData({
                recordsToFetchOnce: recordsToFetchOnce,
                lastProcessedId: lastProcessedId
            });
            if (records.length > 0 && lastProcessedId == -1) {
                shell.mkdir("-p", oThis.localDirFullFilePath);
            }

            totalRecordProcessed += records.length;
            if (totalRecordProcessed >= recordsToWriteOnce || lastProcessedId == -1) {
                totalRecordProcessed = 0;
                fileName = oThis.localDirFullFilePath + "/" + Date.now() + '.csv';
            }
            let r = oThis.formatData(records);
            if (!r.success) {
                return Promise.reject(r);
            }
            let arrayOfList = r.data.arrayOfList;
            if (arrayOfList.length === 0) {
                return Promise.resolve(responseHelper.successWithData({hasTokens: (lastProcessedId != -1)}));
            }

            await localWriteObj.writeArray(arrayOfList, fileName);

            if (arrayOfList.length < recordsToFetchOnce) {
                return Promise.resolve(responseHelper.successWithData({hasTokens: true}));
            }
            lastProcessedId = parseInt(records[records.length - 1].id);

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


        let r = await S3Write.uploadToS3(`${oThis.s3UploadPath}`, `${oThis.localDirFullFilePath}`);
        if (!r.success) {
            return r;
        }

        if (r.data.hasFiles) {
            let downloadToTemp = new DownloadToTemp({
                tempTableName: oThis.model.getTempTableNameWithSchema(),
                columnList: oThis.model.getColumnList
            });
            let resp = await downloadToTemp.copyFromS3ToTemp(`${oThis.s3UploadPath}`);
            return Promise.resolve(resp);
        }
        return Promise.resolve(responseHelper.successWithData({}));
    }






    /**
     * Format data
     *
     * @returns {Array[objects]}
     */
    formatData(arrayToFormat) {
        const oThis = this;
        let arrayOfObjects = [];
        for (let object of arrayToFormat) {
            // let model = new tokensModel({object: object, chainId: oThis.chainId});
            let r = oThis.model.validateAndSanitize.perform({object: object});
            if (!r.success) {
                return r;
            }
            arrayOfObjects.push(Array.from(r.data.data.values()));
        }
        return responseHelper.successWithData({arrayOfList: arrayOfObjects});
    }


}

module.exports = MysqlService;