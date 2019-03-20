const fs = require('fs')
    , path = require('path')
    , AWS = require('aws-sdk')
    , mkdirPath = require('mkdirp')
    , exec = require('child_process').exec
    , rimraf = require('rimraf')

;

const rootPrefix = '..'
    , logger = require(rootPrefix + '/helpers/custom_console_logger.js')
    , responseHelper = require(rootPrefix + "/lib/formatter/response")

;

const S3Write = function (s3Config, params) {
    const oThis = this
    ;

    oThis.s3Client = new AWS.S3(s3Config);
    oThis.dirPath = params.dir_path;
    oThis.bucketPath = params.bucket_path || oThis.dirPath;
    oThis.s3BucketLink = params.s3_bucket_name;

    createPrivateMethods(oThis);
};

/**
 * Upload file to s3
 *
 * params {file_name}
 *
 */
S3Write.prototype.uploadFile = async function (file_name) {



    const oThis = this;
    fs.readFile(`${oThis.dirPath}/${file_name}`, function (err, data) {
        if (err) {
            return Promise.resolve(err);
        }

        logger.debug('uploading file..', oThis.bucketPath + file_name);
        let base64data = new Buffer(data, 'binary');
        oThis.s3Client.putObject({
            Bucket: oThis.s3BucketLink,
            Key: oThis.bucketPath + file_name,
            Body: base64data
        }, function (err, data) {
            if (err) {
                return Promise.resolve(err);
            } else {
                return Promise.resolve(data);
            }
        });

    });
};

/**
 * Initialize
 *
 */
S3Write.prototype.init = async function () {
    const oThis = this
    ;
    //Adding date directory
    oThis.tempPath = process.env.OS_UPLOAD_DIR_PATH + oThis.dirPath;
    oThis.dirPath = process.env.OS_UPLOAD_DIR_PATH + oThis.dirPath + new Date().toDateString().replace(/ /g, '_') + '/';
    oThis.bucketPath = oThis.bucketPath + new Date().toDateString().replace(/ /g, '_') + '/';

    if (oThis.tempPath === oThis.bucketPath) oThis.bucketPath = oThis.dirPath;

    return oThis._deleteOldFiles()
        .then(function () {
            //Delete all previous files
            return oThis._makeDirPath();
        })
        .then(function () {
            return oThis._deleteOldFileKeys();
        })
        .catch(function (err) {
            logger.error("S3Write init error", err);
            throw err;
        });
};

/**
 * Get bucket file path
 *
 */
S3Write.prototype.getBucketFilePath = function () {
    const oThis = this
    ;
    return oThis.bucketPath + oThis.filePrefix;
};

/**
 * Upload files
 *
 */
S3Write.prototype.uploadFiles = async function () {
    const oThis = this
        , promiseArray = []
    ;
    let files;
    try {
        files = await oThis._listDirFiles();

        if (files.length < 1) {
            logger.warn('No file found');
            return Promise.resolve(responseHelper.successWithData({hasFiles: false}));
        }
        for (let fileNumber = 0; fileNumber < files.length; fileNumber++) {
            promiseArray.push(oThis.uploadFile(files[fileNumber]));
            logger.log('File upload...', files[fileNumber]);
        }

        await Promise.all(promiseArray);


        while (true) {
            logger.info('uploading...', oThis.dirPath);
            let uploaded = await oThis._isFileUploaded(oThis.bucketPath + files[0]);
            if (uploaded === true) {
                break;
            }
        }
    } catch (err) {
        logger.error("Error in upload files", err);
        return Promise.resolve(responseHelper.error({internal_error_identifier: 'l_s3w_uf',
            api_error_identifier: 'upload_to_s3',
            debug_options: {}}));
    }
    return Promise.resolve(responseHelper.successWithData({hasFiles: true}));
};

/**
 * Flush s3 upload directory
 *
 * params {file_name}
 *
 */
S3Write.prototype.flushS3UploadDir = async function () {
    const oThis = this
    ;
    return oThis._deleteOldFileKeys();
};

/**
 * Verify fetched data
 *
 * params {file_name}
 *
 */
S3Write.prototype.verifyFetchedData = function (no_of_rows) {
    const oThis = this
    ;
    return new Promise(function (resovle, reject) {
        exec('cat ' + oThis.dirPath + '* | wc -l', function (error, results) {
            if (error) return reject(error);
            logger.log('Number of row in dir', oThis.dirPath, results);
            if (no_of_rows === Number(results)) {
                return resovle(results);
            } else {
                return reject('Number of rows are not consistent');
            }
        });
    });
};

function createPrivateMethods(oThis) {


    oThis._makeDirPath = async function () {
        return new Promise(function (resolve, reject) {
            mkdirPath(oThis.dirPath, function (err) {
                if (err) throw reject(err);
                return resolve();
            });
        });
    };

    oThis._deleteOldFiles = async function () {
        return new Promise(function (resolve, reject) {
            rimraf(oThis.tempPath, function (err) {
                if (err) reject(err);
                logger.log(oThis.tempPath, 'deleted');
                resolve();
            });
        });
    };

    oThis._deleteOldFileKeys = async function () {
        const oThis = this
        ;

        let params = {
            Bucket: oThis.s3BucketLink,
            Prefix: oThis.bucketPath
        };

        return new Promise(function (resolve, reject) {
            oThis.s3Client.listObjects(params, function (err, data) {
                if (err) return reject(err);

                if (Number(data.Contents.length) === 0) return resolve();

                params = {Bucket: oThis.s3BucketLink};
                params.Delete = {Objects: []};

                data.Contents.forEach(function (content) {
                    params.Delete.Objects.push({Key: content.Key});
                });

                oThis.s3Client.deleteObjects(params, function (err, data) {
                    if (err) {
                        logger.log("Error deleting bucket content " + err);
                        return reject(err);
                    } else {
                        logger.log("Content of bucket deleted " + data, oThis.dirPath);
                        return resolve();
                    }
                });
            });
        });
    };

    oThis._isFileUploaded = async function (path) {
        const oThis = this
            , params = {Bucket: oThis.s3BucketLink, Key: path}
        ;

        return new Promise(function (resolve) {
            oThis.s3Client.headObject(params, function (err, data) {
                return resolve(!err);
            });
        });
    };

    oThis._listDirFiles = function () {
        const oThis = this
        ;
        return new Promise(function (resolve, reject) {
            fs.readdir(oThis.dirPath, function (err, files) {
                if (err) {
                    logger.warn(oThis.dirPath, "does not exists");
                    return resolve([]);
                }
                return resolve(files);
            });
        });
    };
}

module.exports = S3Write;