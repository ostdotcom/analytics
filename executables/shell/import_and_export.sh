$BI_SERVER_HOME/import-export.sh --backup --url=http://localhost:8080/pentaho --username=$PENTAHO_ADMIN_USERNAME --password=$PENTAHO_ADMIN_PASSWORD --file-path=${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip --logfile=${CONSISTENCY_LOGS_PATH}/log/pentaho_backup.log

AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$S3_ACCESS_SECRET
AWS_DEFAULT_REGION=$S3_REGION

aws s3 cp $CONSISTENCY_LOGS_PATH/pentaho_data_backup.zip s3://$S3_BUCKET_NAME/pentaho_backup/pentaho_data_backup.zip
rm -f $CONSISTENCY_LOGS_PATH/pentaho_data_backup.zip


aws s3 cp s3://$S3_BUCKET_NAME/pentaho_backup/pentaho_data_backup.zip ${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip
$BI_SERVER_HOME/import-export.sh --restore --url=http://localhost:8080/pentaho --username=$PENTAHO_ADMIN_USERNAME --password=$PENTAHO_ADMIN_PASSWORD --file-path=${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip --logfile=${CONSISTENCY_LOGS_PATH}/log/pentaho_backup.log --overwrite=true
rm -f ${CONSISTENCY_LOGS_PATH}/pentaho_data_backup.zip