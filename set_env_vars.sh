
export SUB_ENVIRONMENT='main'
export ENVIRONMENT='development'
export ENV_SUFFIX='_d6'
export SAAS_MYSQL_DATABASE_ENVIRONMENT=staging

export KIT_MYSQL_CONNECTION_POOL_SIZE='3'
export KIT_SAAS_SUBENV_MYSQL_HOST='127.0.0.1'
export KIT_SAAS_SUBENV_MYSQL_USER='analytics_read'
export KIT_SAAS_SUBENV_MYSQL_PASSWORD='f234jhfruir12s*sdfyuqws'

export PRESTAGING_REDSHIFT_USER='ost_pentaho_stag_user'
export PRESTAGING_REDSHIFT_DATABASE='analytics_staging'
export PRESTAGING_REDSHIFT_PASSWORD='oSt2018Stag!Pentaho'
export PRESTAGING_REDSHIFT_PORT='5439'
export PRESTAGING_REDSHIFT_HOST='pepo.cfwzkfyo2mfi.eu-west-1.redshift.amazonaws.com'
export PRESTAGING_SCHEMA_PREFIX='ost_warehouse_'

export TRANSFERS_BATCH_SIZE=80
export TRANSACTION_BATCH_SIZE=60
export MAX_SPLIT_COUNT=1
export NO_OF_BLOCKS_TO_PROCESS_TOGETHER=1
export S3_WRITE_COUNT=10

export S3_IAM_ROLE='arn:aws:iam::274208178423:role/ost_redshift_copy'
export S3_REGION='us-east-1'
export S3_ACCESS_KEY='AKIAJ4KB25BTIAYS6YRA'
export S3_ACCESS_SECRET='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'
export S3_BUCKET_NAME='temp-analytics.ost.com'

export LOCAL_DIR_FILE_PATH='/tmp/analytics_prestaging_data'