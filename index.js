(function() {
  'use strict';

  var REPO = '';
  var BRANCH = '';
  var TOKEN = 'e5f6bbb30b13644dd83376526d5e2e71b73a152a';

  var app = require('electron').app;
  var shell = require('electron').shell;
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
    makeMenu();
    getCircleStatus();
    setInterval(getCircleStatus, 60000);
  }

  function makeMenu() {
    var endpoint = 'projects/';
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
    var menu = [];

    rp.get(options)
      .then(function(values) {
        var contextMenu;

        menu.push({
          label: BRANCH ? REPO + ':' + BRANCH : 'Pick a branch',
          enabled: !!REPO,
          click: function(menuItem) {
            if (menuItem.enabled) {
              shell.openExternal('https://circleci.com/gh/' + REPO + '/tree/' + BRANCH);
            }
          },
        });
        values.forEach(function(repo) {
          var branches = Object.keys(repo.branches);
          var branchesSubmenu = [];

          branches.forEach(function(branchName) {
            branchesSubmenu.push({
              label: decodeURIComponent(branchName),
              type: 'radio',
              enabled: true,
              click: function() {
                REPO = 'SimpliField/' + repo.reponame;
                BRANCH = branchName;
                getCircleStatus();
              },
            });
          });
          menu.push({ label: repo.reponame, submenu: branchesSubmenu });
        });
        menu.push({ label: 'Quit', click: function() { app.quit(); } });

        contextMenu = Menu.buildFromTemplate(menu);
        mb.tray.setContextMenu(contextMenu);
      });
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

    if ('' !== BRANCH) {
      rp.get(options)
        .then(function getLast(builds) {
          mb.tray.setToolTip(builds[0].reponame + ': ' + builds[0].branch);
          mb.tray.setImage(path.join(__dirname, icons[builds[0].status || 'default']));
          makeMenu();
        })
        .catch(function error(err) {
          console.log('API call failed...', err);
        });
    }
  }

}());
