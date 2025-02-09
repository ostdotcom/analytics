const rootPrefix = ".",
    program = require("commander"),
    nunjucks = require('nunjucks'),
    fs = require('fs'),
    Constant = require(rootPrefix + "/configs/constants"),
    logger = require(rootPrefix + "/helpers/custom_console_logger");


// commander
//executable: node renameMdxFiles.js --auxChainId 202 --dBSchemaPrefix main_d6
program
    .version('0.1.0')
    .option('--auxChainId <auxChainId>', 'aux Chain Id, mandatory param')
    .option('--dBSchemaPrefix <dBSchemaPrefix>', 'DB SCHEMA PREFIX')
    .parse(process.argv);

class RenameMdxFiles {

    constructor() {
    }

    perform() {
        const oThis = this;
        oThis.renameMysqlSchemaXml();
        oThis.renameRedshiftSchemaXml();
    }

    renameMysqlSchemaXml(){
        var auxChainIds = program.auxChainId;
        var auxChainIdsArray = auxChainIds.split(",");
        nunjucks.configure('pdi/mdx', { autoescape: true });
        for(var i=0; i<auxChainIdsArray.length; i++){
            var fileText = nunjucks.render('mysql_schema.xml', { DB_SCHEMA_PREFIX: program.dBSchemaPrefix, AUX_CHAIN_1: auxChainIdsArray[i] });
            var fileName = "mysql_schema_" +  program.dBSchemaPrefix + "_" + auxChainIdsArray[i];
            var filePath = Constant.TEMPORARY_MDX_DIRECTORY_FILE_PATH + fileName;
            fs.writeFile(filePath, fileText, function(err) {
                if(err) {
                    return console.log(err);
                }

                logger.log("The file was saved!");
            });
        }
    }

    renameRedshiftSchemaXml(){
        nunjucks.configure('pdi/mdx', { autoescape: true });
        var fileText = nunjucks.render('redshift_schema.xml', { DB_SCHEMA_PREFIX: program.dBSchemaPrefix });
        var fileName = "redshift_schema_" +  program.dBSchemaPrefix;
        var filePath = Constant.TEMPORARY_MDX_DIRECTORY_FILE_PATH + fileName;

        fs.writeFile(filePath, fileText, function(err) {
            if(err) {
                return console.log(err);
            }

            logger.log("The file was saved!");
        });
    }

}

const renameMdxFiles = new RenameMdxFiles();
renameMdxFiles.perform();