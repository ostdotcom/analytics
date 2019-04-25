#!/usr/bin/env bash

while [[ $# -gt 0 ]]
do
    key="$1";

    usage_str="Usage: ./extract_and_transform.sh --chain-id <Number> --start-block-no <Number>";
    # Read parameters
    case $key in
        --chain-id)
            CHAIN_ID="$2"
            shift # past argument
            shift # past value
            ;;
        --start-block-no)
            START_BLOCK_NO="$2"
            shift # past argument
            shift # past value
            ;;
        *)    # unknown option
            echo $usage_str;
            exit 1
            ;;
    esac
done

LOCKFILE="/tmp/${CHAIN_ID}_`basename $0`"
LOCKFD=200

# PRIVATE
_lock()             { flock -$1 $LOCKFD; }
_no_more_locking()  { _lock u; _lock xn && rm -f $LOCKFILE; }
_prepare_locking()  { eval "exec $LOCKFD>\"$LOCKFILE\""; trap _no_more_locking EXIT; }

# ON START
_prepare_locking

# PUBLIC
exlock_now()        { _lock xn; }  # obtain an exclusive lock immediately or fail
exlock()            { _lock x; }   # obtain an exclusive lock
shlock()            { _lock s; }   # obtain a shared lock
unlock()            { _lock u; }   # drop a lock

### BEGIN OF SCRIPT ###

# Simplest example is avoiding running multiple instances of script.
exlock_now || exit 1;


# Constants
EMAIL_SUBSCRIBERS="${EMAIL_SUBSCRIBERS:-backend@ost.com}";
EMAIL_SUBJECT_TAG="Analytics:${ENVIRONMENT}:${SUB_ENVIRONMENT}";
if [[ ! -z ${ENV_SUFFIX} ]]; then
    EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}:${ENV_SUFFIX}: ";
else
    EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}: ";
fi
SCRIPT_TIMEOUT=300
NO_LOGFILE_LINES=100

function error_handler() {
    local exit_status=$1
    local job_type=$2
    local log_file_path=$3
    if [[ $exit_status == 124 ]]; then
        subject="Timeout in data $job_type for chain $CHAIN_ID"
    elif [[ $exit_status != 0 ]]; then
        subject="Error in data ${job_type} for chain ${CHAIN_ID}"
    fi
    echo ${subject}

    if [[ ! -z ${subject} ]]; then
        send_email "${subject}" "${log_file_path}"
        echo "******************************** DATA ${job_type} Error [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
        exit 1
    fi
}

function send_email(){
    local subject=$1
    local log_file_path=$2
    mail_body_file=${log_file_path}.mail
    touch ${mail_body_file}
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')" > ${mail_body_file}
    echo "CHAIN_ID: ${CHAIN_ID}" >> ${mail_body_file}
    echo "" >> ${mail_body_file}
    echo "Last ${NO_LOGFILE_LINES} lines: " >> ${mail_body_file}
    tail -${NO_LOGFILE_LINES} ${log_file_path} >> ${mail_body_file}
    cat ${mail_body_file} | mail -s "${EMAIL_SUBJECT_TAG} ${subject}" "${EMAIL_SUBSCRIBERS}"
    rm -f ${mail_body_file}
}

# Extract data
echo "******************************** DATA Extraction Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
SECONDS=0;
timeout ${SCRIPT_TIMEOUT} /bin/node executables/extract_data.js --blockScanner true --token true --chainId ${CHAIN_ID} >> log/extract_data_${CHAIN_ID}.log 2>&1
status=$?
error_handler ${status} "extraction" log/extract_data_${CHAIN_ID}.log

duration=$SECONDS;
echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

echo "******************************** DATA Extraction Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
echo ""

# Transform data
echo "******************************** DATA Transformation Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
SECONDS=0;
timeout ${SCRIPT_TIMEOUT} /bin/bash executables/transform_data.sh --chain-id ${CHAIN_ID} >> log/transform_data_${CHAIN_ID}.log 2>&1
status=$?
error_handler ${status} "transformation" log/transform_data_${CHAIN_ID}.log

duration=$SECONDS;
echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

echo "******************************** DATA Transformation Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
echo ""
echo ""
