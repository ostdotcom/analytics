#!/usr/bin/env bash

while [[ $# -gt 0 ]]
do
    key="$1";

    usage_str="Usage: ./extract_and_transform.sh --chain-id <Number> --start-block-no <Number> --end-block-no <Number>";
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
        --end-block-no)
            END_BLOCK_NO="$2"
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
printf "\n\n Extraction started"
/bin/node executables/extract_data.js --blockScanner true --token true --chainId ${CHAIN_ID} --startBlock ${START_BLOCK_NO} --endBlock ${END_BLOCK_NO}
printf "Extraction ended \n\n"

# Transform data
printf "\n\n Transformation started"
/bin/bash executables/transform_data.sh --chain-id ${CHAIN_ID}
printf "Transformation ended \n\n"
