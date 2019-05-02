const rootPrefix = ".",
    Base = require(rootPrefix + "/base");

/**
 * RDSInstanceLogsGC constants
 *
 * @module lib/globalConstant/redshift/RDSInstanceLogsGC
 */

/**
 * Class for RDSInstanceLogsGC constants
 *
 * @class
 */
class RDSInstanceLogsGC extends Base {
    /**
     * Constructor for RDSInstanceLogsGC constants
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

    get availableStatus(){
        return 'available';
    }

    get notAvailableStatus(){
        return 'not_available';
    }

    get deletingStatus(){
        return 'deleting';
    }

    get mappingOfAwsStatus(){
        return {
            'available': 'available',
            'creating': 'not_available',
            'deleting': 'not_available'

        }
    }




    get restoreInstanceParams(){
        return {
            TargetDBInstanceIdentifier: 't-r-a-16-analytics', /* required */
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

module.exports =  new RDSInstanceLogsGC();
