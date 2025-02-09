'use strict';

/**
 *
 * Send email from application.<br><br>
 *
 * @module lib/applicationMailer
 *
 */

// Load external modules
const applicationMailer = require('nodemailer');

//All Module Requires.
const rootPrefix = '..',
    constants = require(rootPrefix+ "/configs/constants"),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const environment = constants.ENVIRONMENT,
  subEnvironment = constants.SUB_ENVIRONMENT;

/**
 * constructor
 *
 * @constructor
 */
const applicationMailerKlass = function() {
  const oThis = this;
};

applicationMailerKlass.prototype = {
  /**
   * Send Email Using Sendmail
   *
   * @param {Object} params -
   * @param {String} params.to - send email to
   * @param {String} params.from - send email from
   * @param {String} params.subject - email subject
   * @param {String} params.body - email text body
   *
   * @return {Promise<Result>} - On success, data.value has value. On failure, error details returned.
   */
  perform: function(params) {
    const oThis = this;

    oThis.transporter = applicationMailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    });

    var fromEmail = null,
      toEmail = 'backend@ost.com';

    if (environment == 'production') {
      if (subEnvironment == 'main') {
        fromEmail = 'notifier@ost.com';
      } else {
        fromEmail = 'sandbox.notifier@ost.com';
      }
    } else if(environment == 'staging' ) {
      fromEmail = 'staging.notifier@ost.com';
    } else if (environment == 'development') {
      fromEmail = 'development.notifier@local.com';
    }

        let d = {
            from: params.from || fromEmail,
            to: params.to || toEmail,
            subject: `Analytics:: ${environment}::${constants.SUB_ENVIRONMENT}::${constants.ENV_SUFFIX} ${params.subject|| "Subject has not given"}`,
            text: JSON.stringify(params.body)
        };

      oThis.transporter.sendMail(
        d,
        function(err, info) {
            console.log(info);
            console.log(err);
          logger.info('envelope:', info && info.envelope, 'messageId:',info && info.messageId);

          if (err) {
            logger.error('Error:', err);
          }
        }
      );


    return Promise.resolve(responseHelper.successWithData({}));
  }
};

module.exports = applicationMailerKlass;
