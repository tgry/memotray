// jQueryの読み込み
window.jQuery = window.$ = require("./lib/jquery-3.2.0.min");

const remote = require("electron").remote;

let config = {};
let memo = {count:0};
let tray = {count:0, trays:[]};
let tags = [];
let state = {search:false};

// 初期化処理
$(() => {

	// 最小化ボタン
	$("#minimum_button").click(minimizeWindow);
	// 閉じるボタン
	$("#close_button").click(closeWindow);
	
	// サイドバー
	$("#add_memo_button").click(() => {
		const m = addMemo();
		const elem = memoManager.create(m.id, m.title, m.text, m.time);
		memoManager.add(elem);
		$("#memo_view_area").animate({ scrollTop: 0 }, "fast");
		memoManager.focus(m.id);
	});
	
	$("#search_button").click(() => {
		searchManeger.show();
	});

	const Menu = remote.Menu;
	const MenuItem = remote.MenuItem;
	
	const menu = new Menu();
	menu.append(new MenuItem({ label: "エクスポート", click: () => {
		externalManeger.export(memo, tray);
	} }));
	menu.append(new MenuItem({ label: "インポート", click: () => {
		externalManeger.import((m, t) => {
			const w = remote.getCurrentWindow();
			w.hide();
			
			memo = m;
			tray = t;
			// ループで値を入れる
			/*
			for (let key in m) {
				memo[key] = m[key];
			}
			for (let key in tray) {
				tray[key] = t[key];
			}
			*/
			
			// タブを作成
			tabManager.clear();
			for (let i=0; i<tray.trays.length; i++) {
				tabManager.add(tabManager.create(tray.trays[i].name, tray.trays[i].id));
			}
			
			if (tray.trays.length == 0) {
				const t = addTray();
				tabManager.add(tabManager.create(t.name, t.id));
			}
			
			tabManager.select(tray.trays[tray.trays.length - 1].id);

			w.show();
		});
	} }));
	
	
	$("#side_menu_button").click(() => {
		menu.popup(remote.getCurrentWindow());
	});
	
	// ショートカットキー
	
	$(document).keydown((e) => {
		switch (e.keyCode) {
			case 27:
				// Escで閉じる
				if (state.search) {
					searchManeger.hide();
				} else {
					closeWindow();
				}
				break;
			case 78:
				if(event.ctrlKey && !state.search){
					// メモの追加（Ctrl+n）
					const m = addMemo();
					const elem = memoManager.create(m.id, m.title, m.text, m.time);
					memoManager.add(elem);
					$("#memo_view_area").animate({ scrollTop: 0 }, "fast");
					memoManager.focus(m.id);
					
					return false;
				}
				break;
			case 70:
				if(event.ctrlKey){
					// 検索（Ctrl+f）
					searchManeger.show();
					
					return false;
				}
				break;
			case 9:
				if (event.ctrlKey && !state.search) {
					// 次のタブへ(Ctrl+TAB)
					if (tray.trays.length < 2) {
						break;
					}
					let index = tray.trays.findIndex((element) => {
						return element.id == tabManager.current;
					});
					
					index--;
					if (index < 0) {
						index = tray.trays.length - 1;
					}
					tabManager.select(tray.trays[index].id);
				}
				break;
		}
	});
	
	
	// タブの初期化
	
	tabManager.init(memoManager);
	
	tabManager.addButtonFunc = () => {
		const t = addTray();
		const tab = tabManager.create(t.name, t.id);
		tabManager.add(tab);
		tabManager.select(t.id);
	}
	
	tabManager.renameFunc = (trayId) => {
		const t = getTray(trayId);
		
		showInputDialog({title:"名前の変更"}, "rename-tray", t.name, (text) => {
			t.name = text;
			tabManager.rename(text, trayId);
			saveData();
		});
	}
	
	tabManager.removeFunc = (trayId) => {
		for (let i=0; i < tray.trays.length; i++) {
			if (tray.trays[i].id == trayId) {
				const t = tray.trays[i];
				for (let j=0; j<t.memo.length; j++) {
					delete memo[t.memo[j]];
				}
				tray.trays.splice(i,1);
				break;
			}
		}
		
		tabManager.select(tray.trays[tray.trays.length - 1].id);
		saveData();
	}
	
	// メモの初期化
	memoManager.init();
	
	memoManager.getMemoFunc = (trayId) => {
		const t = getTray(trayId);
				
		const m = [];
		for (let i=0; i<t.memo.length; i++) {
			m.push(memo[t.memo[i]]);
		}
		
		if (m.length == 0) {
			m.push(addMemo());
		}
		
		return m;
	}
	
	memoManager.removeMemoFunc = (memoId) => {
		delete memo[memoId];
		
		let emptyFlag = false;
		
		const t = getTray(tabManager.current);
		
		for (let j=0; j< t.memo.length; j++) {
			if (memoId == t.memo[j]) {
				t.memo.splice(j,1);
				
				if (t.memo.length == 0) {
					emptyFlag = true;
				}
				break;
			}
			
		}
		
		// 空になってしまったときは新しいメモを作成
		if (emptyFlag) {
			const m = addMemo();
			const elem = memoManager.create(m.id, m.title, m.text, m.time);
			memoManager.add(elem);
			memoManager.focus(m.id);
		} else {
			saveData();
		}
		
	}
	
	memoManager.changeMemoFunc = (memoId, title, text) => {
		memo[memoId].title = title;
		memo[memoId].text = text;
		memo[memoId].time = createTimeStr(new Date());
		
		saveData();
		
		return memo[memoId];
	}
	
	// 検索の初期化
	searchManeger.init();
	searchManeger.stateChangeFunc = (s) => {
		state.search = s;
	}
	
	searchManeger.getMemosFunc = (text) => {
		const list = [];
		for (let key in memo) {
			if (key == "count") {
				continue;
			}
			
			if (memo[key].text.indexOf(text) > -1) {
				list.push({"memo": memo[key], "tray": getTray(memo[key].trayId)});
			}
		}
		
		return list;
	}
	
	searchManeger.viewMemoFunc = (memoId) => {
		if (tabManager.current != memo[memoId].trayId) {
			tabManager.select(memo[memoId].trayId);
		}
		
		memoManager.scroll(memoId);
		memoManager.focus(memoId);
	}
});

// 設定・データの受け取り

require("electron").ipcRenderer.on("config-message", (e, message) => {
	config = message.config;
	if (message.memo != null && message.memo.count != null) {
		memo = message.memo;
	}
	if (message.tray != null && message.tray.count != null) {
		tray = message.tray;
	}
	
	const w = remote.getCurrentWindow();
	setData(w);
	w.show();
	// 開発用
	// w.webContents.openDevTools();
});

require("electron").ipcRenderer.on("test-message", (e, message) => {
	$("#memo_view_area").text(message);
});

// データを保存
function saveData() {
	require("electron").ipcRenderer.send("save-data", {tray:tray, memo:memo});
};

// 設定を保存
function saveConfig() {
	require("electron").ipcRenderer.send("save-config", {config:config});
}

// データを反映
function setData(win) {
	win.setSize(config.width, config.height);
	
	// タブを作成
	tabManager.clear();
	for (let i=0; i<tray.trays.length; i++) {
		tabManager.add(tabManager.create(tray.trays[i].name, tray.trays[i].id));
	}
	
	if (tray.trays.length == 0) {
		const t = addTray();
		tabManager.add(tabManager.create(t.name, t.id));
	}
	
	tabManager.select(tray.trays[tray.trays.length - 1].id);
}

// ウィンドウを閉じる
function closeWindow() {
	const s = remote.getCurrentWindow().getSize();
	config.width = s[0];
	config.height = s[1];
	saveConfig();
	
	if (config.closeTray) {
		remote.getCurrentWindow().hide();
		remote.getCurrentWindow().setSkipTaskbar(true);
		require("electron").ipcRenderer.send("set-tray-icon", {});
	} else {
		remote.getCurrentWindow().close();
	}
}

// ウィンドウの最小化
function minimizeWindow() {
	const s = remote.getCurrentWindow().getSize();
	config.width = s[0];
	config.height = s[1];
	saveConfig();
	
	if (config.minimizeTray) {
		remote.getCurrentWindow().hide();
		remote.getCurrentWindow().setSkipTaskbar(true);
		require("electron").ipcRenderer.send("set-tray-icon", {});
	} else {
		remote.getCurrentWindow().minimize();
	}
}

// トレイの追加
function addTray() {
	tray.count++;
	const trayId = "tray" + tray.count;
	const trayName = "トレイ" + tray.count;
	const t = {"id": trayId, "memo":[], "name": trayName};
	tray.trays.push(t);
	
	saveData();
	
	return t;
}

// メモの追加
function addMemo() {
	memo.count++;
	const memoId = "memo" + memo.count;
	const title = "メモ" + memo.count;
	const m = {"id": memoId, "title": title, "text": "", "trayId": tabManager.current, "time": createTimeStr(new Date())};
	
	memo[m.id] = m;
	
	for (let i=0; i<tray.trays.length; i++) {
		if (tray.trays[i].id == tabManager.current) {
			tray.trays[i].memo.push(m.id);
			break;
		}
	}
	
	saveData();
	return m;
}

// ダイアログ
function showInputDialog(option, name, value, callback) {
	const BrowserWindow = remote.BrowserWindow;
	option.parent = remote.getCurrentWindow();
	option.modal = true;
	option.show = false;
	option.width = option.width | 300;
	option.height = option.height | 100;
	
	const childWindow = new BrowserWindow(option);
	childWindow.setMenu(null);
	childWindow.webContents.on("did-finish-load", () => {
		childWindow.send("dialog-setting", {"sendName": name, "text": value});
		childWindow.show();
	});
	childWindow.loadURL("file://" + __dirname + "/dialog.html");

	
	// 戻りのイベントを登録
	require("electron").ipcRenderer.once(name, (e, message) => {
		if (message) {
			callback(message);
		}
	});
}

// 日付文字列
function createTimeStr(date) {
	return date.getFullYear() + "/" + ("00" + (date.getMonth() + 1)).slice(-2) + "/" + ("00" + date.getDate()).slice(-2) + " "
	+ ("00" + date.getHours()).slice(-2) + ":" + ("00" + date.getMinutes()).slice(-2) + ":" + ("00" + date.getSeconds()).slice(-2);
}

// トレイを取得（ID指定）

function getTray(trayId) {
	let t = tray.trays.find((element) => {
		return element.id == trayId;
	});
	
	return t;
}