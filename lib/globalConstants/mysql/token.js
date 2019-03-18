'use strict';
/**
 * Token constants
 *
 * @module lib/globalConstant/mysql/token
 */

const rootPrefix = '../..';

/**
 * Class for token constants
 *
 * @class
 */
class TokenConstants {
  /**
   * Constructor for token constants
   *
   * @constructor
   */
  constructor() {}

  // Token deployment status starts.

  get notDeployed() {
    return 'notDeployed';
  }

  get deploymentStarted() {
    return 'deploymentStarted';
  }

  get deploymentCompleted() {
    return 'deploymentCompleted';
  }

  get deploymentFailed() {
    return 'deploymentFailed';
  }

  get getTokenColumn() {
    return ['id', 'client_id', 'name', 'symbol', 'conversion_factor', 'decimal', 'delayed_recovery_interval', 'status', 'created_at', 'updated_at']
  }

}

module.exports = new TokenConstants();
