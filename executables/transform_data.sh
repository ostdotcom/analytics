#!/usr/bin/env bash

# Following environment variables are required
# ENVIRONMENT
# SUB_ENVIRONMENT
# KETTLE_CLIENT_PATH
# ENV_SUFFIX
# CONSISTENCY_LOGS_PATH

function endLines(){
    echo ""
    echo ""
    echo "*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*"
    echo "*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*"
    echo "*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*"
    echo ""
    echo ""
}

email_addrs="${EMAIL_SUBSCRIBERS:-backend@ost.com}";
email_subject_tag="Analytics:${ENV}:${SUB_ENV}";
if [[ ! -z ${ENV_SUFFIX} ]]; then
    email_subject_tag="${email_subject_tag}:${ENV_SUFFIX}";
fi

usage_str="Usage: ./transform_data.sh --chain-id [Number]";
# Read parameters
while [[ $# -gt 0 ]]
do
    key="$1";

    case $key in
        --chain-id)
            CHAIN_ID="$2"
            shift # past argument
            shift # past value
            ;;
        *)    # unknown option
            echo $usage_str;
            exit 1
            ;;
    esac
done

# Check command line args
if [[ $SUB_ENVIRONMENT != 'sandbox' && $SUB_ENVIRONMENT != 'main' ]]; then
    echo "Invalid sub-environment!";
    exit 1;
fi

if [[ -z $CHAIN_ID ]]; then
    echo "Invalid chain id!";
    exit 1;
fi

if [[ -z $KETTLE_CLIENT_PATH ]]; then
    echo "KETTLE_CLIENT_PATH not defined!";
    exit 1;
fi

echo ""
echo "ENVIRONMENT: ${ENVIRONMENT}"
echo "SUB_ENVIRONMENT: ${SUB_ENVIRONMENT}"
echo "CHAIN_ID: ${CHAIN_ID}"
echo "ENV_SUFFIX: ${ENV_SUFFIX}"
echo ""

SECONDS=0;
# Start transformation
task=load_all_cubes
echo "Started data transformation for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
job_dir="pdi/content-pdi/jobs"
/bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:CHAIN_ID=${CHAIN_ID} -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX};
status=$?
if [[ $status != 0 ]]; then
    # Send error email to devs
    subject="Error while data transformation for job: ${task}";
    echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
    mail -s "${email_subject_tag} ${subject}" "${email_addrs}" < /dev/null
    endLines
    exit 1;
else
    echo "Ended data transformation for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
fi
duration=$SECONDS;

echo ""
subject="Data transformation completed in $(($duration / 60)) minutes and $(($duration % 60)) seconds."
echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
if [[ $duration > 60 ]]; then
	mail -s "${email_subject_tag} ${subject}" "${email_addrs}" < /dev/null
fi

echo ""
echo "*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*"
echo ""

SECONDS=0;
# Verify transformation
echo "Started data verification for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
task=incremental_consistency
/bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:CHAIN_ID=${CHAIN_ID} -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX} -param:CONSISTENCY_LOGS_PATH=${CONSISTENCY_LOGS_PATH};
status=$?
if [[ $status != 0 ]]; then
    # Send error email to devs
    subject="Error while data verification for job: ${task}";
    mail -s "${email_subject_tag} ${subject}" "${email_addrs}"
    echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
    endLines
    exit 1;
else
    echo "Ended data verification for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
fi
duration=$SECONDS;

# Check verification status
if [[ ! -z ${CONSISTENCY_LOGS_PATH} ]]; then
    file=${CONSISTENCY_LOGS_PATH}/incremental_data_difference.log
    inconsistent_records=`cat ${file} | wc -l`
    if [[ ${inconsistent_records} > 0 ]]; then
        # Send email
        subject="Data inconsistency after transformation [$(date '+%Y-%m-%d %H:%M:%S')]"
        echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
        mail -s "${email_subject_tag} ${subject}" "${email_addrs}" < ${file}
    fi
fi

echo ""
subject="Data verification completed in $(($duration / 60)) minutes and $(($duration % 60)) seconds."
echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
if [[ $duration > 60 ]]; then
	mail -s "${email_subject_tag} ${subject}" "${email_addrs}" < /dev/null
fi

endLines
