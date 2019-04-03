#!/usr/bin/env bash

# Following environment variables are required
# SUB_ENVIRONMENT
# KETTLE_CLIENT_PATH
# ENV_SUFFIX

email_addrs="${OS_EMAIL_SUBSCRIBERS:-aman@ost.com,bala@ost.com}";

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

email_subject_tag="Analytics:${ENV}:${SUB_ENV}";

echo ""
echo "ENVIRONMENT: ${ENVIRONMENT}"
echo "SUB_ENV: ${SUB_ENV}"
echo "CHAIN_ID: ${CHAIN_ID}"
echo "ENV_SUFFIX: ${ENV_SUFFIX}"
echo ""

echo "Data transformation started...";
echo "";

SECONDS=0;

export KETTLE_HOME=pdi/configs/${ENVIRONMENT}
export KETTLE_JNDI_ROOT=pdi/configs/${ENVIRONMENT}/simple-jndi

# Start transformation
task=load_all_cubes
echo "Started data transformation for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
job_dir="pdi/content-pdi/jobs"
/bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:CHAIN_ID=${CHAIN_ID} -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX} >> log/${task}.log 2>&1;
status=$?
if [[ $status != 0 ]]; then
    # Send error email to devs
    subject="Error while data transformation for job: ${task}";
    mail -s "${email_subject_tag} ${subject}" "${email_addrs}" < /dev/null > /dev/null 2>&1;

    echo "${subject} [$(date '+%Y-%m-%d %H:%M:%S')]";
    exit 1;
else
    echo "Ended data transformation for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
fi

# Verify transformation
task=incremental_consistency
/bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:CHAIN_ID=${CHAIN_ID} -param:SUB_ENV=${SUB_ENV} -param:ENV_SUFFIX=${ENV_SUFFIX} >> log/${task}.log 2>&1;
status=$?
if [[ $status != 0 ]]; then
    # Send error email to devs
    subject2="Error while data verification for job: ${task}";
    mail -s "${email_subject_tag} ${subject2}" "${email_addrs}" < /dev/null > /dev/null 2>&1;

    echo "${subject2} [$(date '+%Y-%m-%d %H:%M:%S')]";
    exit 1;
else
    echo "Ended data verification for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
fi
duration=$SECONDS;

echo "";
echo "Data transformation ended";
subject="${email_subject_tag} Data transformation completed in $(($duration / 60)) minutes and $(($duration % 60)) seconds."
mail -s "$subject" "$email_addrs" < /dev/null > /dev/null 2>&1;
