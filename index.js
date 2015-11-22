(function() {
  'use strict';

  var REPO = '';
  var BRANCH = '';
  var TOKEN = '';

  var app = require('electron').app;
  var shell = require('electron').shell;
  var rp = require('request-promise');
  var path = require('path');
  var menubar = require('menubar');
  var Menu = require('menu');
  var BrowserWindow = require('browser-window');
  var ipcMain = require('ipc-main');

  var tokenWindow;
  var opts = {
    dir: __dirname,
    icon: path.join(__dirname, 'images/icon_neutral.png'),
  };
  var mb = menubar(opts);

  mb.on('ready', appReady);
  mb.on('click', function() {});
  ipcMain.on('send-token', function(event, arg) {
    TOKEN = arg;
    tokenWindow.hide();
    makeMenu();
  });

  function appReady() {
    openSettings();
    makeMenu();
    getCircleStatus();
    setInterval(getCircleStatus, 60000);
  }

  function makeMenu() {
    var menu = [];
    var contextMenu;

    if ('' === TOKEN) {
      menu.push({ label: 'Settings', click: openSettings });
      menu.push({ type: 'separator' });
      menu.push({ label: 'Quit', click: function() { app.quit(); } });
      contextMenu = Menu.buildFromTemplate(menu);
      mb.tray.setContextMenu(contextMenu);
    } else {
      get('projects/', function(values) {
        menu.push({
          label: BRANCH ? REPO + ':' + decodeURIComponent(BRANCH) : 'Pick a branch',
          enabled: !!REPO,
          click: function(menuItem) {
            if (menuItem.enabled) {
              shell.openExternal('https://circleci.com/gh/' + REPO + '/tree/' + BRANCH);
            }
          },
        });
        menu.push({ type: 'separator' });
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
        menu.push({ type: 'separator' });
        menu.push({ label: 'Settings', click: openSettings });
        menu.push({ type: 'separator' });
        menu.push({ label: 'Quit', click: function() { app.quit(); } });
        contextMenu = Menu.buildFromTemplate(menu);
        mb.tray.setContextMenu(contextMenu);
      });
    }
  }
  function getCircleStatus() {
    var endpoint = 'project/' + REPO + '/tree/' + BRANCH;

    printStatus(endpoint);
  }
  function printStatus(endpoint) {
    var icons = {
      cancelled: 'images/icon_cancelled.png',
      failed: 'images/icon_failed.png',
      running: 'images/icon_running.png',
      success: 'images/icon_success.png',
      default: 'images/icon_neutral.png',
    };

    if ('' !== BRANCH) {
      get(endpoint, function getLast(builds) {
        mb.tray.setToolTip(builds[0].reponame + ': ' + builds[0].branch);
        mb.tray.setImage(path.join(__dirname, icons[builds[0].status || 'default']));
        makeMenu();
      })
    }
  }
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
        console.log('API call failed...', err);
      })
  }
  function openSettings() {
    tokenWindow = new BrowserWindow({ width: 400, height: 200, show: false });
    tokenWindow.on('closed', function() {
      tokenWindow = null;
    });
    tokenWindow.loadURL('file://' + path.join(__dirname, 'token.html'));
    tokenWindow.show();
  }

}());
