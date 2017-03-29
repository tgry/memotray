
var memoManager = {};

memoManager.init = function() {
	this.memos = {};
	this.getMemoFunc = null;
	this.removeMemoFunc = null;
	this.changeMemoFunc = null;
}

memoManager.create = function(memoId, title, text, time) {
	const memoElem = $("<div></div>", {
		"id": memoId,
		"addClass": "memo"
	});
	
	memoElem.append(memoManager.createControlButton(memoId));
	memoElem.append(memoManager.createTitle(memoId, title, time));
	memoElem.append(memoManager.createText(memoId, text));
	
	return memoElem;
}

memoManager.createControlButton = function(memoId) {
	const con =  $("<div></div>", {"addClass":"memo_control"});
	const closeButton = $("<div></div>", {
		"addClass": "memo_control_button",
		"title": "メモを閉じる"
	}).text("×");
	closeButton.on("click", ()=> {
				memoManager.remove(memoId);
				if (memoManager.removeMemoFunc) {
					memoManager.removeMemoFunc(memoId);
				}
			});
	con.append(closeButton);
	
	return con;
}

memoManager.createTitle = function(memoId, title, time) {
	const t = $("<div></div>", {"addClass": "memo_title"});
	
	t.append($("<div></div>", {"addClass": "memo_title_label"}).text("TITLE:"));
	t.append($("<input>", {"addClass": "memo_title_label_input", "type": "text"}).val(title).on("change", memoManager.onChangeValue(memoId)));
	t.append($("<div></div>", {"addClass": "memo_title_label_time", "title": "最終更新日"}).text(time));
	
	return t;
}

memoManager.createText = function(memoId, text) {
	let row = this.countRow(text);
	
	if (row < 10) {
		row = 10;
	} else if (row > 50) {
		row = 50;
	}
	
	const m = $("<div></div>", {"addClass": "memo_text"});
	m.append($("<textarea></textarea>", {"addClass": "memo_text_input", "rows": "" + row}).val(text).on("change", memoManager.onChangeValue(memoId)));
	
	return m;
}

memoManager.add = function(elem) {
	this.memos[elem.attr("id")] = elem;
	$("#memo_view_area").prepend(elem);
}

memoManager.remove = function(memoId) {
	this.memos[memoId].remove();
	delete this.memos[memoId];
}

memoManager.viewTray = function(trayId) {
	this.clear();
	
	if (!this.getMemoFunc) {
		return;
	}
	
	const m = this.getMemoFunc(trayId);
	
	for (let i=0; i<m.length; i++) {
		this.add(this.create(m[i].id, m[i].title, m[i].text, m[i].time));
	}
	
	this.focus(m[m.length - 1].id);
}

memoManager.focus = function(memoId) {
	$("#" + memoId + " .memo_text_input").focus();
}

memoManager.clear = function() {
	$("#memo_view_area").empty();
	
	this.memos = {};
}

memoManager.updateTime = function (memoId, time) {
	 $("#" + memoId + " .memo_title_label_time").text(time);
}

memoManager.onChangeValue = function(memoId) {
	return (e) => {
		if(memoManager.changeMemoFunc){
			const m = memoManager.memos[memoId];
			let memo = memoManager.changeMemoFunc(memoId, $("#" + memoId + " .memo_title_label_input").val(), $("#" + memoId + " .memo_text_input").val());
			memoManager.updateTime(memo.id, memo.time);
			
			let row = memoManager.countRow(memo.text);
			if (row < 10) {
				row = 10;
			} else if (row > 50) {
				row = 50;
			}
			$("#" + memoId + " .memo_text_input").attr("rows", row);
		}
	}
}

memoManager.scroll = function(memoId) {
	const offset = $("#" + memoId).offset();
	$("#memo_view_area").animate({ scrollTop: offset.top }, "fast");
}

memoManager.countRow = function(text) {
	let rowCount = 1;
	let index = text.indexOf("\n");
	while (index > -1) {
		index++;
		index = text.indexOf("\n", index);
		rowCount++;
	}
	
	return rowCount;
}