(function() {
  'use strict';

  var menubar = require('menubar');

  var mb = menubar();

  mb.on('ready', function ready() {
    console.log('app is ready');
    mb.window.openDevTools();
  });

}());
