'use strict';

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipc = electron.ipcMain;

let mainWindow = null;
let tray = null;
let memo = null;
let config = {};

app.on("window-all-closed", function() {
  if (process.platform != "darwin")
    app.quit();
});

app.on("ready", function() {
	// メインウィンドウ作成
	mainWindow = new BrowserWindow({width: 800, height: 400, minWidth: 200, minHeight: 300, show: false, frame: false, transparent: true});
	mainWindow.loadURL("file://" + __dirname + "/index.html");

	mainWindow.on("closed", function() {
		mainWindow = null;
	});

	const init = require("./lib/init");
	init(mainWindow, (c) => {config = c;});
});

ipc.on("set-tray-icon", (e, message) => {
	setTrayIcon();
});

function setTrayIcon() {
	// トレイアイコン
	tray = new Tray(__dirname + "/img/tray_icon.png");
	tray.setToolTip("MemoTray");
	tray.on("click", () => {
		mainWindow.show();
		mainWindow.setSkipTaskbar(false);
		
		tray.destroy();
	});
	
	const menu = new Menu();
	menu.append(new MenuItem({ label: "終了", click: () => {mainWindow.close();} }));
	tray.setContextMenu(menu);

}

// データを保存
ipc.on("save-data", (e, message) => {
	memo = message.memo;
	tray = message.tray;
	const storage = require("electron-json-storage");
	storage.set("memo", message.memo, function (error) {
		if (error) {
			console.log(error);
		}
	});
	storage.set("tray", message.tray, function (error) {
		if (error) {
			console.log(error);
		}
	});
});

// 設定を保存
ipc.on("save-config", (e, message) => {
	config = message.config;
	saveConfig();
})

function saveConfig() {
	const storage = require('electron-json-storage');
	storage.set("config", config, function (error) {
		if (error) {
			console.log(error);
		}
	});
}