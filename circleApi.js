(function() {
  'use strict';

  var rp = require('request-promise');

  module.exports = circleApiModule;

  function circleApiModule(TOKEN) {
    var module = {
      get: get,
    };

    return module;

    function get(endpoint, callback) {
      var api = 'https://circleci.com/api/v1/';
      var options = {
        uri: api + endpoint,
        qs: {
          'circle-token': TOKEN,
        },
        headers: {
          'User-Agent': 'Request-Promise',
        },
        json: true,
      };

      rp.get(options)
        .then(callback)
        .catch(function error(err) {
          console.log('API call failed...');
        });
    }
  }

}());
