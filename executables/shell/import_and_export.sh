#!/usr/bin/env bash

while [[ $# -ge 0 ]]
do
    key="$1";

    usage_str="Usage: sh `basename $0` [--export] [--restore]";
    # Read parameters
    case $key in
        --export)
            EXPORT=true
            shift # past argument
            ;;
        --restore)
            RESTORE=true
            shift # past argument
            ;;
                *) # unknown option
            echo $usage_str;
            exit 1
            ;;
    esac
done

AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$S3_ACCESS_SECRET
AWS_DEFAULT_REGION=$S3_REGION

if [[ ! -z $EXPORT ]]; then
    $BI_SERVER_HOME/import-export.sh --backup --url=http://localhost:8080/pentaho --username=$PENTAHO_ADMIN_USERNAME --password=$PENTAHO_ADMIN_PASSWORD --file-path=${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip --logfile=${CONSISTENCY_LOGS_PATH}/log/pentaho_backup.log
    if [[ $? != 0 ]]; then
        echo "Error importing Pentaho data!"
        exit 1
    fi

    aws s3 cp $CONSISTENCY_LOGS_PATH/pentaho_data_backup.zip s3://$S3_BUCKET_NAME/pentaho_backup/pentaho_data_backup.zip
    if [[ $? != 0 ]]; then
        echo "Error uploading Pentaho data!"
        exit 1
    fi

    rm -f $CONSISTENCY_LOGS_PATH/pentaho_data_backup.zip
elif [[ ! -z $RESTORE ]]; then
    aws s3 cp s3://$S3_BUCKET_NAME/pentaho_backup/pentaho_data_backup.zip ${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip
    if [[ $? != 0 ]]; then
        echo "Error downloading Pentaho data!"
        exit 1
    fi

    $BI_SERVER_HOME/import-export.sh --restore --url=http://localhost:8080/pentaho --username=$PENTAHO_ADMIN_USERNAME --password=$PENTAHO_ADMIN_PASSWORD --file-path=${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip --logfile=${CONSISTENCY_LOGS_PATH}/log/pentaho_backup.log --overwrite=true
    if [[ $? != 0 ]]; then
        echo "Error restoring Pentaho data!"
        exit 1
    fi

    rm -f ${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip
fi