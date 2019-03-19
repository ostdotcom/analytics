'use strict';
/**
 * This service gets the details of the tokens table and write that details into csv file
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
    tokenModel = require(rootPrefix + "/models/mysql/token");

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
    constructor(localFilePathToWrite, chainId) {
        const oThis = this;
        oThis.redshiftClient = new RedshiftClient(Constants.PRESTAGING_REDSHIFT_CLIENT);
        oThis.pathToWrite = localFilePathToWrite;
        oThis.chainId = chainId;
    }

    async processTokens() {
        const oThis = this;
        oThis.OperationModel = tokenModel;
        oThis.s3DirPathSuffix = "/tokens";
        let response = await oThis.process();
        // return response;
    }

    async process() {
        const oThis = this;
        await oThis._fetchTokenDetailsAndWriteIntoLocalFile();
        await oThis._upload1();
    }



    async _fetchTokenDetailsAndWriteIntoLocalFile() {
        const oThis = this;
        let offset = 0;
        let tokensRecords;

         oThis.s3UploadPath = `${Constants.SUB_ENVIRONMENT + Constants.ENV_SUFFIX}/${oThis.chainId}/${Date.now()}`;

        oThis.localDirFullFilePath = `${Constants.LOCAL_DIR_FILE_PATH}/${oThis.s3UploadPath}`;

        oThis.fileName = oThis.localDirFullFilePath + oThis.getFilePath + "/" + Date.now()+ '.txt';
        console.log("\n\n\nThe fileName is : "+ oThis.fileName + "\n\n\n");
        let lastUpdatedAtValue = await oThis._getTokenLastUpdatedAtValue();
        console.log("The lastUpdatedAtValue is : "+ lastUpdatedAtValue);
        tokensRecords = await new tokenModel({}).select("*").where("updated_at > '"+lastUpdatedAtValue+"'").order_by("id").limit(50).offset(offset).fire();

        let LocalWrite = new localWrite({separator: "|"});
        shell.mkdir("-p", oThis.localDirFullFilePath + oThis.getFilePath);
        while(tokensRecords.length > 0){

            let arrayOfList = new tokenModel({}).formatData(tokensRecords);
            console.log("\n\n\nThe arrayOfList is : "+ arrayOfList + "\n\n\n");
            if (arrayOfList.length === 0) {
                return Promise.resolve(responseHelper.successWithData({hasTokens: false}));
            }

            await LocalWrite.writeArray(arrayOfList, oThis.fileName);
            offset += 50;
            tokensRecords = await new tokenModel({}).select("*").where("updated_at > '"+lastUpdatedAtValue+"'").order_by("id").limit(50).offset(offset).fire();
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

    async _upload1() {

        const oThis = this;
        console.log("Hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

        console.log("The localDirFullFilePath is : "+oThis.localDirFullFilePath);

        for (let modelToPerform of
            [{localPath: "/tokens", model: tokenModel}]) {

            //todo: parallel process transactions & transfers
            let r = await oThis.uploadToS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`,
                `${oThis.localDirFullFilePath}${modelToPerform.localPath}`);

            if (r.hasFiles) {
                let operationModel = new modelToPerform.model({chainId: oThis.chainId});

                operationModel.initRedshift();
                //todo: delete duplicate rows based on tx_hash
                await operationModel.copyFromS3(`${oThis.s3UploadPath}${modelToPerform.localPath}/`);
            }
        }
    }

    async uploadToS3(s3UploadPath, localDirFullFilePath) {

        let s3Write = new S3Write({
                "region": Constants.S3_REGION,
                "accessKeyId": Constants.S3_ACCESS_KEY,
                "secretAccessKey": Constants.S3_ACCESS_SECRET
            },
            {
                s3_bucket_link: Constants.S3_BUCKET_LINK,
                bucket_path: s3UploadPath,
                dir_path: localDirFullFilePath
            });

        return await s3Write.uploadFiles();


    }

    get getFilePath() {
        return "/tokens";
    }

}

module.exports = token;