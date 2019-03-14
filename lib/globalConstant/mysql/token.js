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

}

module.exports = new TokenConstants();
