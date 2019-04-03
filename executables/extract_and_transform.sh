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

SECONDS=0;
# Extract data
printf "\n\n Extraction started"
/bin/node executables/extract_data.js --blockScanner true --token true --chainId ${CHAIN_ID}
if [[ $? != 0 ]]; then
    echo "Error in Extraction!";
    exit 1;
fi
printf "Extraction ended \n\n"

# Transform data
printf "\n\n Transformation started"
/bin/bash executables/transform_data.sh --chain-id ${CHAIN_ID}
if [[ $? != 0 ]]; then
    echo "Error in Transformation!";
    exit 1;
fi
printf "Transformation ended \n\n"
duration=$SECONDS;
echo "^^^^^ Total time: $(($duration / 60)) minutes and $(($duration % 60)) seconds. ^^^^^"
