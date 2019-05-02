const rootPrefix = "..",
    program = require("commander"),
    RDSInstanceLogsGC = require(rootPrefix + "/lib/globalConstants/redshift/RDSInstanceLogsGC"),
    RedshiftClient = require(rootPrefix + "/lib/redshift"),
    ExtractBase = require(rootPrefix + "/executables/extract_base"),
    MysqlServiceWrapper = require(rootPrefix + "/services/mysql_service_wrapper");


// commander
program
    .version('0.1.0')
    .option('--eg <eg>', 'example option')
    .parse(process.argv);

/**
 *
 * Class for initialing RDS instance restore
 * @class
 *
 *
 */
class RestoreRDSInstance{

    constructor() {

        const oThis = this;
        oThis.redshiftClient = new RedshiftClient();
    }

    perform(){
        const oThis = this;
        let query = `SELECT * FROM ${RDSInstanceLogsGC.getTableName} where aws_status != ${RDSInstanceLogsGC.deletedStatus}`;
        return oThis.redshiftClient.query(query).then(async (res) => {


        });
    }
}


const restoreRDSInstance = new RestoreRDSInstance();
restoreRDSInstance.perform();