(function() {
  'use strict';

  var REPO = 'SimpliField/sf-frontend';
  var BRANCH = 'wip%2FrefactoTables';
  var TOKEN = 'e5f6bbb30b13644dd83376526d5e2e71b73a152a';

  var app = require('electron').app;
  var rp = require('request-promise');
  var path = require('path');
  var menubar = require('menubar');
  var Menu = require('menu');

  var opts = {
    dir: __dirname,
    icon: path.join(__dirname, 'images/icon_neutral.png'),
  };
  var mb = menubar(opts);


  mb.on('ready', appReady);

  function appReady() {
    var contextMenu = Menu.buildFromTemplate([
      {
        label: 'branches',
        submenu: [
          {
            label: 'wip/refactoTables',
            type: 'radio',
            checked: true,
            click: function() { BRANCH = 'wip%2FrefactoTables'; getCircleStatus(); },
          },
          {
            label: 'wip/circleci-fix',
            type: 'radio',
            click: function() { BRANCH = 'wip%2Fcircleci-fix'; getCircleStatus(); },
          },
          {
            label: 'master',
            type: 'radio',
            click: function() { BRANCH = 'master',getCircleStatus(); },
          },
        ],
      },
      { label: 'Quit', click: function() { app.quit(); } },
    ]);

    mb.tray.setContextMenu(contextMenu);
    getCircleStatus();
    setInterval(getCircleStatus, 15000);
  }

  function getCircleStatus() {
    var endpoint = 'project/' + REPO + '/tree/' + BRANCH;

    printStatus(endpoint);
  }
  function printStatus(endpoint) {
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
    var icons = {
      cancelled: 'images/icon_cancelled.png',
      failed: 'images/icon_failed.png',
      running: 'images/icon_running.png',
      success: 'images/icon_success.png',
      default: 'images/icon_neutral.png',
    };

    rp.get(options)
      .then(function getLast(builds) {
        mb.tray.setTitle(builds[0].status);
        mb.tray.setToolTip('Branch: ' + builds[0].branch);
        mb.tray.setImage(path.join(__dirname, icons[builds[0].status || 'default']));
      })
      .catch(function error(err) {
        console.log('API call failed...', err);
      });
  }

}());
