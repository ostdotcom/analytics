const rootPrefix = ".",
    Base = require(rootPrefix + "/base");

/**
 * DataProcessingInfo constants
 *
 * @module lib/globalConstant/redshift/dataProcessingInfo
 */

/**
 * Class for DataProcessingInfo constants
 *
 * @class
 */
class DataProcessingInfo extends Base {
    /**
     * Constructor for token constants
     *
     * @constructor
     */
    constructor() {
        super()
    }

    // Token deployment status starts.

    get getTableName(){
        return "data_processing_info";
    }

    get lastProcessedBlockProperty() {
        return 'last_processed_block';
    }

    get tokenLastUpdatedAtProperty() {
        return 'token_last_updated_at';
    }

	  get stakeCurrenciesLastUpdatedAtProperty() {
		    return 'stake_currencies_last_updated_at';
	  }

	  get currencyConversionRatesLastUpdatedAtProperty() {
		    return 'currency_conversion_rates_last_updated_at';
	  }

    get workflowLastUpdatedAtProperty() {
        return 'workflow_last_updated_at';
    }

    get workflowStepsLastUpdatedAtProperty() {
        return 'workflow_steps_last_updated_at';
    }

    get tokenAddressesLastUpdatedAtProperty() {
        return 'token_addresses_last_updated_at';
    }

    get chainAddressesLastUpdatedAtProperty() {
        return 'chain_addresses_last_updated_at';
    }

    get stakerWhitelistedAddressesLastUpdatedAtProperty() {
        return 'staker_whitelisted_addresses_last_updated_at';
    }

}

module.exports =  new DataProcessingInfo();
