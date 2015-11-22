(function() {
  'use strict';

  var app = require('app');
  var fs = require('fs');
  var path = require('path');
  var data = null;
  var dataFilePath = path.join(app.getPath('userData'), 'data.json');

  module.exports = storage();

  function storage() {
    var module = {
      set: set,
      get: get,
      unset: unset,
    };

    return module;

    // private
    function load() {
      if (null !== data) {
        return;
      }
      if (!fs.existsSync(dataFilePath)) {
        data = {};
        return;
      }
      data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    }
    function save() {
      fs.writeFileSync(dataFilePath, JSON.stringify(data));
    }
    // public
    function set(key, value) {
      load();
      data[key] = value;
      save();
    }
    function get(key) {
      var value = null;

      load();
      if (key in data) {
        value = data[key];
      }
      return value;
    }
    function unset(key) {
      load();
      if (key in data) {
        delete data[key];
        save();
      }
    }
  }

}());
