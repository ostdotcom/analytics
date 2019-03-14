'use strict';

/**
 * Class for core constants
 *
 * @class
 */
class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  get subEnvironment() {
    return process.env.SA_SUB_ENVIRONMENT;
  }

  get environment() {
      return process.env.SA_ENVIRONMENT;
  }

  get MYSQL_CONNECTION_POOL_SIZE() {
    return process.env.SA_MYSQL_CONNECTION_POOL_SIZE;
  }

  get KIT_SAAS_SUBENV_MYSQL_HOST() {
    return process.env.SA_KIT_SAAS_SUBENV_MYSQL_HOST;
  }

  get KIT_SAAS_SUBENV_MYSQL_USER() {
    return process.env.SA_KIT_SAAS_SUBENV_MYSQL_USER;
  }

  get KIT_SAAS_SUBENV_MYSQL_PASSWORD() {
    return process.env.SA_KIT_SAAS_SUBENV_MYSQL_PASSWORD;
  }

  get DEBUG_ENABLED() {
    return process.env.OST_DEBUG_ENABLED;
  }

}

module.exports = new CoreConstants();
