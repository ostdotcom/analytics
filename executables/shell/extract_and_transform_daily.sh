#!/usr/bin/env bash

while [[ $# -gt 0 ]]
do
    key="$1";

    usage_str="Usage: ./extract_and_transform_daily.sh --extract-only [Optional] --transform-only [Optional] --verify-only [Optional] --restart-only [Optional]";
    # Read parameters
    case $key in
        --extract-only)
            EXTRACT_ONLY=true
            shift # past argument
            ;;
        --transform-only)
            TRANSFORM_ONLY=true
            shift # past argument
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift # past argument
            ;;
        --restart-only)
            RESTART_ONLY=true
            shift # past argument
            ;;
        *)    # unknown option
            echo $usage_str;
            exit 1
            ;;
    esac
done

# Set variable default values
if [[ -z $EXTRACT_ONLY && -z $TRANSFORM_ONLY && -z $VERIFY_ONLY && -z $RESTART_ONLY ]]; then
    EXTRACT_ONLY=true
    TRANSFORM_ONLY=true
    VERIFY_ONLY=true
    RESTART_ONLY=true
fi

# Command line variables
echo "EXTRACT_ONLY: ${EXTRACT_ONLY}"
echo "TRANSFORM_ONLY: ${TRANSFORM_ONLY}"
echo "VERIFY_ONLY: ${VERIFY_ONLY}"
echo "RESTART_ONLY: ${RESTART_ONLY}"

# ENV variables
echo "ENVIRONMENT: ${ENVIRONMENT}"
echo "SUB_ENVIRONMENT: ${SUB_ENVIRONMENT}"
echo "ENV_SUFFIX: ${ENV_SUFFIX}"

LOCKFILE="/tmp/`basename $0`"
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
SIGNAL_RECEIVED=false
TIMEOUT_SIGNAL="SIGINT"
EMAIL_SUBSCRIBERS="${EMAIL_SUBSCRIBERS:-backend@ost.com}";
EMAIL_SUBJECT_TAG="Analytics:${ENVIRONMENT}:${SUB_ENVIRONMENT}";
if [[ ! -z ${ENV_SUFFIX} ]]; then
    EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}:${ENV_SUFFIX}: ";
else
    EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}: ";
fi
TIMEOUT_DURATION=1800
NO_LOGFILE_LINES=100

function trap_handler(){
	pid="$1"
	signals=(INT TERM)
	for sig in "${signals[@]}" ; do
        trap "_handler $pid $sig" "$sig"
    done
}

function _handler(){
	# echo "handler triggered: pid:$1 => signal:$2"
    kill "-$2" "$1"
    SIGNAL_RECEIVED=true
}

function error_handler() {
    local exit_status=$1
    local job_type=$2
    local log_file_path=$3
    if [[ $exit_status == 124 ]]; then
        subject="Timeout in ${job_type}"
    elif [[ $exit_status != 0 ]]; then
        subject="Error in ${job_type}"
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
    echo "" >> ${mail_body_file}
    echo "Last ${NO_LOGFILE_LINES} lines: " >> ${mail_body_file}
    tail -${NO_LOGFILE_LINES} ${log_file_path} >> ${mail_body_file}
    cat ${mail_body_file} | mail -s "${EMAIL_SUBJECT_TAG} ${subject}" "${EMAIL_SUBSCRIBERS}"
    rm -f ${mail_body_file}
}

function check_process_status(){
    local pid="$1"
    local job_type="$2"
    local log_file_path="$3"

    trap_handler $pid
    wait $pid
    status=$?

	while true; do
		ps cux | grep ${pid} >> /dev/null
		prc_running=$?
		if [[ $prc_running == 0 ]]; then
			echo "Waiting for task to complete for pid: ${pid}"
			sleep 1
		else
			echo "Wait complete for pid: ${pid}"
			break
		fi
	done

	error_handler $status $job_type $log_file_path

	if [[ $SIGNAL_RECEIVED == true ]]; then
        exit 0;
	fi
}

# Extract data
if [[ ! -z $EXTRACT_ONLY ]]; then
    echo "******************************** DATA Extraction Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    SECONDS=0;
    log_file=log/extract_data_daily.log
    timeout --signal=${TIMEOUT_SIGNAL} ${TIMEOUT_DURATION} /bin/node executables/extract_data_daily.js --mysql true --blockScanner true >> $log_file 2>&1 &
    PID=$!
    check_process_status $PID "extract_data_daily" $log_file

    duration=$SECONDS;
    echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

    echo "******************************** DATA Extraction Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    echo ""
fi

# Transform data
if [[ ! -z $TRANSFORM_ONLY ]]; then
    echo "******************************** DATA Transformation Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    SECONDS=0;
    task=load_all_cubes
    job_dir="pdi/content-pdi/jobs"
    log_file=log/load_all_cubes.log
    timeout --signal=${TIMEOUT_SIGNAL} ${TIMEOUT_DURATION} /bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX} >> $log_file 2>&1 &
    PID=$!
    check_process_status $PID "load_all_cubes" $log_file

    duration=$SECONDS;
    echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

    echo "******************************** DATA Transformation Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    echo ""
fi

# Verify Transformation
if [[ ! -z $VERIFY_ONLY ]]; then
    echo "******************************** Verify Transformation Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    SECONDS=0;
    task=incremental_consistency
    job_dir="pdi/content-pdi/jobs/consistency"
    log_file=log/incremental_consistency.log
    timeout --signal=${TIMEOUT_SIGNAL} ${TIMEOUT_DURATION} /bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:START_FROM_BEGIN_DATE=0 -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX} -param:CONSISTENCY_LOGS_PATH=${CONSISTENCY_LOGS_PATH} >> $log_file 2>&1 &
    PID=$!
    check_process_status $PID "incremental_consistency" $log_file

    duration=$SECONDS;
    echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

    # Check verification status
    verification_data_file=${CONSISTENCY_LOGS_PATH}/incremental_data_difference.log
    ls $verification_data_file
    if [[ $? == 0 ]]; then
        inconsistent_records=`cat ${verification_data_file} | wc -l`
        if [[ ${inconsistent_records} > 0 ]]; then
            # Send email
            subject="Data inconsistency after transformation"
            send_email "${subject}" "${verification_data_file}"
        fi
    else
        echo "verification_data_file not found --- ${verification_data_file}"
    fi

    echo "******************************** Verify Transformation Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    echo ""
fi

# Restart Pentaho BI Server
if [[ ! -z $RESTART_ONLY ]]; then
    ls $BI_SERVER_HOME
    if [[ $? -eq 0 ]]; then
      cd $BI_SERVER_HOME;
        echo "Stoping Pentaho BI Server..."
        sh stop-pentaho.sh
        sudo systemctl stop ostAnalytics
        if [[ $? != 0 ]]; then
            echo "Error while stoping Pentaho BI Server"
        fi
        echo "Stopped Pentaho BI Server"

        sleep_time=10
        echo "Sleeping for ${sleep_time} sec..."
        sleep $sleep_time

        echo "Starting Pentaho BI Server..."
        sudo systemctl start ostAnalytics
        if [[ $? != 0 ]]; then
            echo "Error while starting Pentaho BI Server"
        fi
        echo "Started Pentaho BI Server"
    else
        echo "No BI server found!"
    fi
fi

echo ""
