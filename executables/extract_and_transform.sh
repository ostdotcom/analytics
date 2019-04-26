#!/usr/bin/env bash

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

# Extract data
echo "******************************** DATA Extraction Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
SECONDS=0;
/bin/node executables/extract_data.js --mysql true --blockScanner true --chainId ${CHAIN_ID} >> log/extract_data.log 2>&1
if [[ $? != 0 ]]; then
    echo ""
    echo ""
    echo "******************************** DATA Extraction Error [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    exit 1;
fi

duration=$SECONDS;
echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

echo "******************************** DATA Extraction Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
echo ""

# Transform data
echo "******************************** DATA Transformation Started [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
SECONDS=0;
/bin/bash executables/transform_data.sh --chain-id ${CHAIN_ID} >> log/transform_data.log 2>&1
if [[ $? != 0 ]]; then
    echo ""
    echo ""
    echo "******************************** DATA Transformation Error [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
    exit 1;
fi

duration=$SECONDS;
echo "Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds."

echo "******************************** DATA Transformation Ended [$(date '+%Y-%m-%d %H:%M:%S')] ********************************"
echo ""
echo ""
