(function() {
  'use strict';

  var REPO = '';
  var BRANCH = '';
  var TOKEN = '';

  var api;
  var app = require('electron').app;
  var shell = require('electron').shell;
  var path = require('path');
  var menubar = require('menubar');
  var Menu = require('menu');
  var BrowserWindow = require('browser-window');
  var ipcMain = require('ipc-main');
  var storage = require('./data.js');

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
    storage.set('token', TOKEN);
    api = require('./circleApi.js')(TOKEN);
    tokenWindow.hide();
    makeMenu();
  });

  function appReady() {
    if (!storage.get('token')) {
      openSettings();
    } else {
      TOKEN = storage.get('token');
      api = require('./circleApi.js')(TOKEN);
    }
    makeMenu();
    getStatus();
    setInterval(getStatus, 60000);
  }

  function makeMenu() {
    var menu = [];
    var contextMenu;

    if ('' === TOKEN) {
      menu.push({ label: 'Settings', click: openSettings });
      menu.push({ type: 'separator' });
      menu.push({ label: 'Copy', accelerator: 'Command+C', selector: 'copy:' });      // HACK
      menu.push({ label: 'Paste', accelerator: 'Command+V', selector: 'paste:' });    // HACK
      menu.push({ type: 'separator' });
      menu.push({ label: 'Quit', click: function() { app.quit(); } });
      contextMenu = Menu.buildFromTemplate(menu);
      mb.tray.setContextMenu(contextMenu);
    } else {
      api.get('projects/', function(values) {
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
                REPO = repo.username + '/' + repo.reponame;
                BRANCH = branchName;
                getStatus();
              },
            });
          });
          menu.push({ label: repo.reponame, submenu: branchesSubmenu });
        });
        menu.push({ type: 'separator' });
        menu.push({ label: 'Settings', click: openSettings });
        menu.push({ label: 'Logout', click: logout });
        menu.push({ type: 'separator' });
        menu.push({ label: 'Quit', click: function() { app.quit(); } });
        contextMenu = Menu.buildFromTemplate(menu);
        mb.tray.setContextMenu(contextMenu);
      });
    }
  }
  function getStatus() {
    var icons = {
      cancelled: 'images/icon_cancelled.png',
      failed: 'images/icon_failed.png',
      running: 'images/icon_running.png',
      success: 'images/icon_success.png',
      default: 'images/icon_neutral.png',
    };
    var endpoint = 'project/' + REPO + '/tree/' + BRANCH;
    if ('' !== BRANCH) {
      api.get(endpoint, function getLast(builds) {
        mb.tray.setToolTip(builds[0].reponame + ': ' + builds[0].branch);
        mb.tray.setImage(path.join(__dirname, icons[builds[0].status || 'default']));
        makeMenu();
      });
    }
  }
  function openSettings() {
    tokenWindow = new BrowserWindow({ width: 400, height: 200, show: false });
    tokenWindow.on('closed', function() {
      tokenWindow = null;
    });
    tokenWindow.loadURL('file://' + path.join(__dirname, 'token.html'));
    tokenWindow.show();
  }
  function logout() {
    storage.unset('token');
    TOKEN = '';
    makeMenu();
    openSettings();
  }

}());
