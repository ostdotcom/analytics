
'use strict';

const Redshift = require('node-redshift')
    , Util = require('util')
    , transactions = require()
;


const Base = function (hostConfig) {
    const oThis = this
    ;

    oThis.redshiftClient = new Redshift(hostConfig);
    oThis.tableModel = oThis.redshiftClient.import(oThis.getModelImportString());
};




Base.prototype.copyFromS3 = async function (fullFilePath) {
    const oThis = this
        //, s3BucketPath = 's3://' + process.env.OS_S3_BUCKET_LINK + '/'
        , s3BucketPath = 's3://temp-analytics.ost.com/'
        , createTempTable = Util.format('CREATE TABLE IF NOT EXISTS %s (LIKE %s);', oThis.getTempTableName(), oThis.getTableNameWithSchema())
        , copyTable = Util.format('copy %s from \'%s\' iam_role \'%s\' delimiter \'|\';', oThis.getTempTableName(), s3BucketPath + fullFilePath, oThis.getIamRole())
        , commit = 'COMMIT;'
        , deleteDuplicateIds = Util.format('DELETE from %s WHERE %s IN (SELECT %s from %s);', oThis.getTableNameWithSchema(), oThis.getTablePrimaryKey(), oThis.getTablePrimaryKey(), oThis.getTempTableName())
        , insertRemainingEntries = Util.format('INSERT into %s (select * from %s);', oThis.getTableNameWithSchema(), oThis.getTempTableName())
        , dropTempTable= Util.format('DROP TABLE IF EXISTS %s;', oThis.getTempTableName())
    ;
    logger.log(s3BucketPath + fullFilePath);

    logger.log("Temp table delete if exists", dropTempTable);
    return oThis.query(dropTempTable)
        .then(function(){
            logger.log("Temp table creation started", createTempTable);
            return oThis.query(createTempTable);
        }).then(function(){
            logger.log("Copying of table started", copyTable);
            return oThis.query(copyTable);
        }).then(function(){
            logger.log("Commit started", commit);
            return oThis.query(commit);
        }).then(function(){
            logger.log("Deletion of duplicate Ids started", deleteDuplicateIds);
            return oThis.query(deleteDuplicateIds);
        }).then(function(){
            logger.log("Insertion of remaining entries started", insertRemainingEntries);
            return oThis.query(insertRemainingEntries);
        }).then(function(){
            logger.log("Dropping temp table", dropTempTable);
            return oThis.query(dropTempTable);
        }).then(function(){
            logger.log('Copy from S3 complete')
        }).catch(function(err) {
            logger.error("S3 copy hampered", err);
            throw new Error("S3 copy hampered" + err);
        });

};



Base.prototype.getTempTableName = function(){
    return "transactions"
}


Base.prototype.getTableNameWithSchema = function(){
    return "ost_stag_staging.transactions"
}


Base.prototype.query = async function (commandString) {
    const oThis = this
    ;
    logger.debug('Redshift query String', commandString);
    return new Promise(function( resolve, reject) {
        try {
            oThis.redshiftClient.query(commandString, function(err, result) {
                if (err) {
                    reject("Error in query " + err);
                } else {
                    resolve(result);
                }
            })
        }catch (err) {
            reject(err);
        }
    });

};

Base.prototype.getIamRole = function(){
    return "arn:aws:iam::274208178423:role/ost_redshift_copy";
};

Base.prototype.getTablePrimaryKey = function(){
    return "id";
};

Base.prototype.getModelImportString = function () {
    return
};