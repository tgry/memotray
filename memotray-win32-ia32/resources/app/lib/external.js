var externalManeger = {};

externalManeger.import = function(callback) {
	const path = require("electron").remote.dialog.showOpenDialog(require("electron").remote.getCurrentWindow(), {
		properties: ['openFile'],
			filters: [{
				name: 'テキストファイル',
				extensions: ['txt']
			}]
		});
		
	const fs = require("fs");
	fs.readFile(path[0], "utf8", (err, text) => {
		if (err) {
			console.log(err);
			return;
		}
		
		const date = new Date();
		const timeStr = date.getFullYear() + "/" + ("00" + (date.getMonth() + 1)).slice(-2) + "/" + ("00" + date.getDate()).slice(-2) + " " 
			+ ("00" + date.getHours()).slice(-2) + ":" + ("00" + date.getMinutes()).slice(-2) + ":" + ("00" + date.getSeconds()).slice(-2);
		
		const lines = text.split("\n");
		const memo = {count:0};
		const tray = {count:0, trays:[]};
		
		let t = null;
		let m = null;
		let formatError = false;
		for (let i=0; i<lines.length; i++) {
			const line = lines[i];
			if (line.indexOf("■") == 0) {
				tray.count++;
				t = {"id": "tray" + tray.count, "memo":[], "name": line.substring(1, line.length)};
				tray.trays.push(t);
			} else if (line.indexOf("\t□") == 0) {
				if (t == null) {
					formatError = true;
					break;
				}
				memo.count++;
				m = {"id": "memo" + memo.count, "title": line.substring(2, line.length), "text": "", "trayId": t.id, "time": timeStr};
				memo[m.id] = m;
				t.memo.push(m.id);
			} else if (line.indexOf("\t\t") == 0) {
				if (t == null || m == null) {
					formatError = true;
					break;
				}
				m.text += line.substring(2, line.length) + "\n";
			}
		}
		
		if (formatError || t == null || m == null) {
			require("electron").remote.dialog.showMessageBox(require("electron").remote.getCurrentWindow(), {"type" : "warning", "message": "フォーマットが不正です"});
			return;
		}
		
		// 改行のみのデータは空に
		for (let key in memo) {
			if (key == "count") {
				continue;
			}
			if (memo[key].text == "\n") {
				memo[key].text = "";
			}
		}
		
		callback(memo, tray);
	});
}

externalManeger.export = function(memo, tray) {
	const path = require("electron").remote.dialog.showSaveDialog(
		require("electron").remote.getCurrentWindow(),
		{
			title:"保存先を選択",
			filters: [{name: 'テキストファイル', extensions: ['txt']}],
			defaultPath: '.'
		}
	);
	
	if (path == null || path == "") {
		return;
	}
	
	const fs = require("fs");
	
	let str = "";
	
	for(let i=0; i<tray.trays.length; i++){
		str += "■" + tray.trays[i].name + "\n";
		for (let j=0; j<tray.trays[i].memo.length; j++) {
			const m = memo[tray.trays[i].memo[j]];
			str += "\t□" + m.title + "\n";
			const lines = m.text.split("\n");
			
			for (let k=0; k<lines.length; k++) {
				str += "\t\t" + lines[k] + "\n";
			}
		}
	}
	
	fs.writeFile(path, str , (err) => {console.log(err);} );
}