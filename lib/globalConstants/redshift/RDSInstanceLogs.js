const rootPrefix = "../../..",
    Base = require(rootPrefix + "/lib/globalConstants/redshift/base"),
    constants = require(rootPrefix + "/configs/constants");

/**
 * RDSInstanceLogs constants
 *
 * @module lib/globalConstant/redshift/RDSInstanceLogs
 */

/**
 * Class for RDSInstanceLogs constants
 *
 * @class
 */
class RDSInstanceLogs extends Base {
    /**
     * Constructor for RDSInstanceLogs constants
     *
     * @constructor
     */
    constructor() {
        super()
    }

    get getTableName(){
        return 'rds_instance_logs';
    }

    get awsDeletedStatus() {
        return 'deleted';
    }

    get awsDeletingStatus(){
        return 'deleting';
    }

    get awsAvailableStatus(){
        return 'available';
    }

    get mappedNotAvailableStatus(){
        return 'not_available';
    }

    get mappingOfAwsStatus(){
        return {
            'available': 'available',
            'creating': 'not_available',
            'backing-up': 'not_available',
            'modifying': 'not_available',
            'storage-optimization': 'not_available',
            'deleting': 'deleting'
        }
    }


    get restoreInstanceParams(){
			return constants.RDS_RESTORE_INSTANCE_PARAMS

    }

    get errorCodeDBInstanceNotFound(){
        return 'DBInstanceNotFound';
    }

    get cronStatusPending(){
        return 'pending'
    }


    get cronStatusProcessed(){
        return 'processed'
    }



}

module.exports =  new RDSInstanceLogs();
