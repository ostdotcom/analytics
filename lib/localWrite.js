const fs = require('fs');
/**
 * This service gets the details of the tokens table and write that details into csv file
 *
 * @module services/token
 */

const rootPrefix = '..',
    tokenConstants = require(rootPrefix + '/lib/globalConstants/mysql/token');

/**
 * Class for token details.
 *
 * @class
 */
class localWrite {
    /**
     *
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params) {
        const oThis = this ;
        oThis.separator = params.separator;


    }

    async _write (dataArray, fileName) {
        const oThis = this
        ;

        let data
            , lineArray = []
        ;

        dataArray.forEach(function (rowHash) {
            var values = [];
            for(var val of tokenConstants.getTokenColumn){
                values.push(rowHash[val]);
            }
            let line = values.join("|");
            lineArray.push(line + '\n');
        });
        data = lineArray.join("");

        fs.appendFile(fileName, data, function (err) {
            if (err) throw err;
            return Promise.resolve();
        });
    }

    async writeArray (dataArray, fileName){
        const oThis = this
        ;
        let data
            , lineArray = []
        ;
        dataArray.forEach(function (rowArray) {
            let line = rowArray.join(oThis.separator);
            lineArray.push(line + '\n');
        });
        data = lineArray.join("");

        fs.appendFile(fileName, data, function (err) {
            if (err) throw err;
            return Promise.resolve();
        });

    }


}

module.exports = localWrite;