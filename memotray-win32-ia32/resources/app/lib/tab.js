
var tabManager = {};

tabManager.init = function(memoObj){
	this.tabs = {};
	this.count = 0;
	this.current = null;
	this.memo = memoObj;
	this.addButtonFunc = null;
	this.renameFunc = null;
	this.removeFunc = null;
	
	$("#add_tray").click(() => {
		if (tabManager.addButtonFunc) {
			tabManager.addButtonFunc();
		}
	});
}

tabManager.create = function(name, trayId){
	this.count++;
	const t = $("<div></div>",
		{
			"id": "tab" + this.count,
			"title": name,
			"addClass": "tab",
			"on": {
				click: () => {tabManager.select(trayId);}
				}
		}
	);
	t.text(name);
	t.data("tray-id", trayId);
	
	const remote = require("electron").remote;
	const Menu = remote.Menu;
	const MenuItem = remote.MenuItem;
	
	const menu = new Menu();
	menu.append(new MenuItem({ label: "名前の変更", click: () => {
		if (tabManager.renameFunc) {
			tabManager.renameFunc(trayId);
		}
	} }));
	menu.append(new MenuItem({ label: "削除", click: () => {
		if (Object.keys(tabManager.tabs).length <= 1) {
			require('electron').remote.dialog.showMessageBox({message:"最後のトレイは削除できません"});
			return;
		}
		
		if (tabManager.removeFunc) {
			tabManager.removeFunc(trayId);
		}
		tabManager.remove(trayId);
	} }));
	
	t.bind("contextmenu", (e) => {menu.popup(remote.getCurrentWindow());});
	
	return t;
}

tabManager.add = function(elem){
	this.tabs[elem.data("tray-id")] = elem;
	
	$("#tab_scroll_area").prepend(elem);
}

tabManager.remove = function(trayId){
	tabManager.tabs[trayId].remove();
	delete tabManager.tabs[trayId];
}

tabManager.get = function(trayId){
}

tabManager.rename = function(name, trayId){
	tabManager.tabs[trayId].attr("title", name);
	tabManager.tabs[trayId].text(name);
}

tabManager.clear = function(){
	this.current = null;
	for (let key in this.tabs) {
		this.tabs[key].remove();
	}
	
	this.tabs = {};
	this.count = 0;
}

tabManager.select = function(trayId) {
	this.current = trayId;
	for (let key in this.tabs) {
		const t = this.tabs[key];
		if (t.data("tray-id") == trayId) {
			t.addClass("tab_current");
		} else {
			t.removeClass("tab_current");
		}
	}
	
	this.memo.viewTray(trayId);
}
