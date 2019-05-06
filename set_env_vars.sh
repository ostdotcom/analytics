export ENVIRONMENT='development'
export SUB_ENVIRONMENT='main'
export ENV_SUFFIX='_d6'
export SAAS_MYSQL_DATABASE_ENVIRONMENT='staging'

export KIT_MYSQL_CONNECTION_POOL_SIZE='3'
export KIT_SAAS_SUBENV_MYSQL_HOST='127.0.0.1'
export KIT_SAAS_SUBENV_MYSQL_USER='saas_read'
export KIT_SAAS_SUBENV_MYSQL_PASSWORD='sdfh732gFdHK7936aIghLjortab34793'
export KIT_SAAS_SUBENV_MYSQL_PORT=3307

export PRESTAGING_REDSHIFT_USER='analytics_user'
export PRESTAGING_REDSHIFT_DATABASE='analytics'
export PRESTAGING_REDSHIFT_PASSWORD='gdhsD56Sw248jljt68dfTRaxMn'
export PRESTAGING_REDSHIFT_PORT='5439'
export PRESTAGING_REDSHIFT_HOST='redshift-instance.cl2x2qyuekxx.us-east-1.redshift.amazonaws.com'
export PRESTAGING_SCHEMA_PREFIX='ost_warehouse_'



export TRANSFERS_BATCH_SIZE=80
export TRANSACTION_BATCH_SIZE=60
export MAX_SPLIT_COUNT=5
export NO_OF_BLOCKS_TO_PROCESS_TOGETHER=5
export S3_WRITE_COUNT=100

export S3_IAM_ROLE='arn:aws:iam::704700004548:role/redshift_s3_copy'
export S3_REGION='us-east-1'
export S3_ACCESS_KEY='AKIA2IE3EXDCONIPVQEL'
export S3_ACCESS_SECRET='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'
export S3_BUCKET_NAME='analytics.stagingost.com'

export RESTORE_RDS_API_VERSION='2014-10-31'
export RESTORE_RDS_REGION_ACCESS_SECRET='GaramSppI5tRzMYprD//HAr+YKvGYkMTQtb3wLI+'
export RESTORE_RDS_REGION_ACCESS_KEY='AKIA2IE3EXDCONIPVQEL'
export RESTORE_RDS_REGION='us-east-1'

export RDS_RESTORE_INSTANCE_PARAMS_JSON='{
            TargetDBInstanceIdentifier: "t-r-a-25-analytics",
            AutoMinorVersionUpgrade: false,
            CopyTagsToSnapshot: true,
            DBInstanceClass: "db.t2.small",
            DBParameterGroupName: "ost-staging",
            DBSubnetGroupName: "ost-kit-saas-all",
            DeletionProtection: false,
            Engine: "mysql",
            LicenseModel: "general-public-license",
            MultiAZ: false,
            Port: 3306,
            PubliclyAccessible: false,
            UseLatestRestorableTime: true,
            SourceDBInstanceIdentifier: "s6-kit-all",
            StorageType: "gp2",
            VpcSecurityGroupIds: [
                "sg-0e828f41c1c0a1b11",
                "sg-0b76ede7472254bb0"
            ]
        }'

export LOCAL_DIR_FILE_PATH='/tmp/analytics_prestaging_data'
export AUX_BLOCK_SCANNER_CONFIG_FILE_PATH=''
export ORIGIN_BLOCK_SCANNER_CONFIG_FILE_PATH=''