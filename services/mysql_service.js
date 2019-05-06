'use strict';
/**
 * This service gets the details from the tokens table and write that details into csv file
 *
 * @module services/mysql
 */

const rootPrefix = '..',
    Constants = require(rootPrefix + '/configs/constants'),
    shell = require("shelljs"),
    localWrite = require(rootPrefix + "/lib/localWrite"),
    ApplicationMailer = require(rootPrefix + '/lib/applicationMailer'),
    responseHelper = require(rootPrefix + '/lib/formatter/response'),
    S3Write = require(rootPrefix + "/lib/S3_write"),
    logger = require(rootPrefix + "/helpers/custom_console_logger"),
    ValidateAndSanitize = require(rootPrefix + '/lib/validateAndSanatize'),
    DownloadToTemp = require(rootPrefix + '/lib/downloadToTemp'),
    allModels= {};

    allModels.Token = require(rootPrefix + "/models/redshift/mysql/token");
    allModels.TokenAddresses = require(rootPrefix + "/models/redshift/mysql/tokenAddresses");
    allModels.Workflows = require(rootPrefix + "/models/redshift/mysql/workflows");
    allModels.WorkflowSteps = require(rootPrefix + "/models/redshift/mysql/workflowSteps");
    allModels.StakerWhitelistedAddresses = require(rootPrefix + "/models/redshift/mysql/stakerWhitelistedAddresses");
    allModels.ChainAddresses = require(rootPrefix + "/models/redshift/mysql/chainAddresses");


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
        oThis.parallelProcessCount = 5;
				oThis.dynamicMysqlHost = params.dynamicMysqlHost;
        oThis.Model = allModels[params.model];
        oThis.chainId = params.chainId || 0;
        oThis.chainType = params.chainType;
        oThis.applicationMailer = new ApplicationMailer();

        // create new models always for direct query
        oThis.model = new oThis.Model({chainId: oThis.chainId, chainType: oThis.chainType, dynamicMysqlHost: oThis.dynamicMysqlHost});
        oThis.s3UploadPath = `${Constants.SUB_ENVIRONMENT}${Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}/${oThis.model.getTableName}`;
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
        let maxUpdatedAtStr = undefined;

        try {
            let r = await oThis.fetchAllRowsAndWriteIntoLocalFile();

						if (!r.data.hasRows) {
							logger.log("No data found for model-", oThis.model.tableName);
							return Promise.resolve(r);
						}else{
							maxUpdatedAtStr = r.data.maxUpdatedAtStr;
						}

						r = await oThis.uploadLocalFilesToS3();

            await oThis.downloadFromS3ToTemp();
            await oThis.model.insertToMainFromTemp();
            await oThis.model.updateDataProcessingInfoTable(maxUpdatedAtStr);
        } catch (e) {
            logger.error(oThis.model.tableName , 'mysql service terminated due to exception-', e);
            let rH = responseHelper.error({

                internal_error_identifier: 's_t_p_1',
                api_error_identifier: 'api_error_identifier',
                debug_options: {error: e}
            });
            oThis.applicationMailer.perform({
                subject: `${oThis.model.tableName} mysql service service terminated due to exception`,
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
	  async fetchAllRowsAndWriteIntoLocalFile() {
			const oThis = this;

			let lastProcessTime = await oThis.fetchLastProcessTime();

			console.info(oThis.model.tableName, "- lastProcessTime-", lastProcessTime);

			let r = await oThis.fetchTotalRowCountAndMaxUpdated({lastProcessTime: lastProcessTime});


			let totalRowCount = r[0].totalRowCount || 0;
			let maxUpdatedAtStr = r[0].maxUpdatedAt || lastProcessTime;

			console.info(oThis.model.tableName, "- totalRowCount-", totalRowCount);
			console.info(oThis.model.tableName, "- maxUpdatedAtStr-", maxUpdatedAtStr);

			if (totalRowCount == 0){
				return responseHelper.successWithData({hasRows: false});
			}

			shell.mkdir("-p", oThis.localDirFullFilePath);

			let perBatchSize = Math.ceil(totalRowCount/oThis.parallelProcessCount);

			let startOffset = 0;
			let endOffset = 0;

			let promiseArray = [];
			for(let batchNumber=1; batchNumber <= oThis.parallelProcessCount; batchNumber++){
				endOffset = startOffset + perBatchSize;
				let params = {
					startOffset: startOffset, endOffset: endOffset,
					lastProcessTime: lastProcessTime, batchNumber: batchNumber
				};
				let r = oThis.fetchDetailsAndWriteIntoLocalFile(params);
				promiseArray.push(r);
				if(endOffset >=  totalRowCount){
					break;
				}
				startOffset = endOffset;
      }

      await Promise.all(promiseArray).catch((err)=>{
      	return Promise.reject(err);
			});
			return responseHelper.successWithData({hasRows: true, maxUpdatedAtStr: maxUpdatedAtStr});
	  }

    /**
     * Fetch records and write those records into Local File
     *
     */
    async fetchDetailsAndWriteIntoLocalFile(params) {
        const oThis = this;

        let startOffset = params.startOffset;
				let endOffset = params.endOffset;
				let batchNumber = params.batchNumber;
				let lastProcessTime = params.lastProcessTime;
				let fileName = oThis.localDirFullFilePath + "/" + batchNumber + "_" + Date.now() + '.csv';
				let offset = startOffset;

				console.info(oThis.model.tableName, "- started fetchDetailsAndWriteIntoLocalFile for batch", batchNumber);

        let records;
        let totalRecordProcessed = 0;

        let localWriteObj = new localWrite({separator: "|"});
        let arrayOfList = [];
        const recordsToWriteOnce = 1000;

        while (offset < endOffset) {

					let limit = 100 > (endOffset - offset) ? (endOffset - offset) : 100;

            records = await oThis.model.fetchData({
								lastProcessTime: lastProcessTime,
								limit: limit,
                offset: offset
            });

						totalRecordProcessed += records.length;

            if (totalRecordProcessed >= recordsToWriteOnce) {
                totalRecordProcessed = 0;
                fileName = oThis.localDirFullFilePath + "/" + batchNumber + "_" + Date.now() + '.csv';
            }

            let r = oThis.formatData(records);

            if (!r.success) {
                return r;
            }

            arrayOfList = r.data.arrayOfList;
            if (arrayOfList.length > 0) {
							await localWriteObj.writeArray(arrayOfList, fileName);
            }

            if (arrayOfList.length < limit) {
                return Promise.resolve(responseHelper.successWithData({hasRows: true}));
            }
					offset += limit;
        }

    }

	  /**
	   * Fetch Last cron run time
	   *
	   */
	  async fetchLastProcessTime() {
	  	const oThis = this;
	  	return Promise.resolve(oThis.model.getLastCronRunTime());
	  }

	  /**
	   * Fetch total no of records
	   *
	   */
	  async fetchTotalRowCountAndMaxUpdated(params) {
	  	const oThis = this;
	  	return Promise.resolve(oThis.model.fetchTotalRowCountAndMaxUpdated({lastProcessTime: params.lastProcessTime}));
	  }

    /**
     * Upload local files to s3
     *
     * @return {Promise}
     *
     */
    async uploadLocalFilesToS3() {
        const oThis = this;
        let r = await S3Write.uploadToS3(`${oThis.s3UploadPath}`, `${oThis.localDirFullFilePath}`);
        if (!r.success) {
            return Promise.reject(r);
        }

			return Promise.resolve(r);
    }

		/**
		 * Upload local files to s3
		 *
		 * @return {Promise}
		 *
		 */
		async downloadFromS3ToTemp() {
			const oThis = this;

				let downloadToTempObj = new DownloadToTemp({
					tempTableName: oThis.model.getTempTableNameWithSchema,
					columnList: oThis.model.getColumnList
				});
				let resp = await downloadToTempObj.copyFromS3ToTemp(`${oThis.s3UploadPath}`);
				return Promise.resolve(resp);
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
           let validateAndSanitizeObj = new ValidateAndSanitize({mapping: oThis.model.constructor.mapping,
                fieldsToBeMoveToAnalytics: oThis.model.constructor.fieldsToBeMoveToAnalytics });

            let r =  validateAndSanitizeObj.perform({object: object});
            if (!r.success) {
                return Promise.reject(r);
            }
            arrayOfObjects.push(Array.from(r.data.data.values()));
        }
        return responseHelper.successWithData({arrayOfList: arrayOfObjects});
    }


}

module.exports = MysqlService;