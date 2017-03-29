'use strict';

var init = async function(mainWindow, callback) {
	const result = await readConfig();
	let config = getDefault();
	
	// デフォルトを保存されていた設定で上書き
	if (result.config) {
		for (let key in result.config) {
			config[key] = result.config[key];
		}
	}
	
	result.config = config;
	
	// 設定を送る
	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.webContents.send("config-message", result);
	});
	
	callback(config);
}

var readConfig = function() {
	const storage = require('electron-json-storage');
	
	return new Promise(function(resolve, reject) {
		storage.get("config", (error, data) => {
			resolve({"config":data});
		});
	}).then(function(result) {
		return new Promise( function(resolve, reject) {
			storage.get("memo", (error, data) => {
				result.memo = data;
				resolve(result);
			});
		});
	}).then(function(result) {
		return new Promise( function(resolve, reject) {
			storage.get("tray", (error, data) => {
				result.tray = data;
				resolve(result);
			});
		});
	});
}

var getDefault = function() {
	var c = {
		closeTray: true, // 閉じるボタンでタスクトレイに格納
		minimizeTray: true, // 最小化時にタスクトレイに格納
		width: 500, // メインウィンドウの横幅
		height: 300 // メインウィンドウの縦幅
	};
	
	return c;
}

module.exports = init;