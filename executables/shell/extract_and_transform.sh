#!/usr/bin/env bash

# constants
SIGNAL_RECEIVED=false
TIMEOUT_SIGNAL="SIGINT"
TIMEOUT_DURATION=300

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

function _handler(){
	# echo "handler triggered: pid:$1 => signal:$2"
    kill "-$2" "$1"
    SIGNAL_RECEIVED=true
}

function trap_handler(){
	pid="$1"
	signals=(INT TERM)
	for sig in "${signals[@]}" ; do
        trap "_handler $pid $sig" "$sig"
    done
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

function transform_data(){

    echo "******************************** DATA Transformation Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    SECONDS=0;
    CHAIN_ID=$1
    # Start transformation
    task=load_aux_token_transfer_cube
    echo "Started data transformation for task: ${task} [$(date '+%Y-%m-%d %H:%M:%S')]";
    job_dir="pdi/content-pdi/jobs"
    log_file=log/load_aux_token_transfer_cube.log

    timeout --signal=${TIMEOUT_SIGNAL} ${TIMEOUT_DURATION} /bin/bash ${KETTLE_CLIENT_PATH}/kitchen.sh -file ${job_dir}/${task}.kjb -level=Debug -param:CHAIN_ID=${CHAIN_ID} -param:SUB_ENV=${SUB_ENVIRONMENT} -param:ENV_SUFFIX=${ENV_SUFFIX} >> $log_file 2>&1 &

    PID=$!
    check_process_status $PID "load_aux_token_transfer_cube" $log_file

    duration=$SECONDS;
    echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

    echo "******************************** DATA Transformation Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    echo ""

}


function verify_env_vars(){
    local CHAIN_ID=$1

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



}


# Extract data

function extract_data(){
    CHAIN_ID=$1


    verify_env_vars $CHAIN_ID

    echo "******************************** DATA Extraction Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    SECONDS=0;
    timeout --signal=${TIMEOUT_SIGNAL} ${TIMEOUT_DURATION} /bin/node executables/extract_data.js --blockScanner true --mysql true --chainId ${CHAIN_ID} >> log/extract_data_${CHAIN_ID}.log 2>&1
    status=$?
    error_handler ${status} "extraction" log/extract_data_${CHAIN_ID}.log

    duration=$SECONDS;
    echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

    echo "******************************** DATA Extraction Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    echo ""


}




function pre_extract_operation(){
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
    EMAIL_SUBSCRIBERS="${EMAIL_SUBSCRIBERS:-backend@ost.com}";
    EMAIL_SUBJECT_TAG="Analytics:${ENVIRONMENT}:${SUB_ENVIRONMENT}";
    if [[ ! -z ${ENV_SUFFIX} ]]; then
        EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}:${ENV_SUFFIX}: ";
    else
        EMAIL_SUBJECT_TAG="${EMAIL_SUBJECT_TAG}: ";
    fi
    SCRIPT_TIMEOUT=300
    NO_LOGFILE_LINES=100


}



function process_chains(){
    pre_extract_operation
    for chain_id in $1; do
      echo "$chain_id"

      extract_data $chain_id

      transform_data $chain_id

    done
}

while [[ $# -gt 0 ]]
do
    key="$1";

    usage_str="Usage: ./extract_and_transform.sh --chain-ids <Space Separated Numbers> --start-block-no <Number>";
    # Read parameters
    case $key in
        --chain-ids)
            # export IFS=" "
            echo "$2"
            process_chains $2
            shift # past argument
            shift # past value
            exit 1
            ;;
    esac
done

