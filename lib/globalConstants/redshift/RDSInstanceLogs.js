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

    get deletedStatus() {
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
        return {
            TargetDBInstanceIdentifier: constants.RESTORE_RDS_DB_IDENTIFIER, /* required */
                AutoMinorVersionUpgrade: false,
            CopyTagsToSnapshot: true,
            DBInstanceClass: 'db.t2.small',
           DBParameterGroupName: 'ost-staging',
            DBSubnetGroupName: 'ost-kit-saas-all',
           DeletionProtection: false,
            Engine: 'mysql',
            LicenseModel: 'general-public-license',
            MultiAZ: false,
            Port: 3306,
            PubliclyAccessible: false,
            //RestoreTime: Date.now()/1000 - 2*60*60, // 2 hours before current time
            SourceDBInstanceIdentifier: 's6-kit-all',
            StorageType: 'gp2',
            VpcSecurityGroupIds: [
            'sg-0e828f41c1c0a1b11', 'sg-0b76ede7472254bb0'
        ]
        }

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
