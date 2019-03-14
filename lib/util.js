'use strict';

const crypto = require('crypto');

class Util {
  constructor() {}

  formatDbDate(dateObj) {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    return (
      dateObj.getFullYear() +
      '-' +
      pad(dateObj.getMonth() + 1) +
      '-' +
      pad(dateObj.getDate()) +
      ' ' +
      pad(dateObj.getHours()) +
      ':' +
      pad(dateObj.getMinutes()) +
      ':' +
      pad(dateObj.getSeconds())
    );
  }

  invert(json) {
    var ret = {};
    for (var key in json) {
      ret[json[key]] = key;
    }
    return ret;
  }

}

module.exports = new Util();
