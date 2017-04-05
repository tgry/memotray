var searchManeger = {};

searchManeger.init = function() {
	this.stateChangeFunc = null;
	this.getMemosFunc = null;
	this.viewMemoFunc = null;
	this.isShow = false;
}

searchManeger.show = function(text) {
	if (this.isShow) {
		this.hide();
		return;
	}
	
	const elem = $("<div></div>", {"id": "search_area"});
	elem.on("click", (e) => {
		e.stopPropagation();
	});
	
	elem.append($("<div></div>", {"id": "search_close_button", "title": "検索を閉じる"}).click(()=>{ searchManeger.hide(); }).text("×"));
	
	elem.append($("<div></div>", {"css": { "font-size": "15pt", "margin": "5pt" }}).text("Search"));
	
	const input = $("<div></div>");
	input.append($("<input>", {"id": "search_text_input",  "size": "30", "on": {"change": () => { searchManeger.search($("#search_text_input").val()); } }}));
	input.append($("<input>", {"id": "search_text_button", "type": "button", "value": "search", "on": {"click": () => { searchManeger.search($("#search_text_input").val()); } }}));
	elem.append(input);
	
	const result = $("<div></div>", {"id": "search_result_area"});
	elem.append(result);

	$("#contents").append(elem);
	if (this.stateChangeFunc) {
		this.stateChangeFunc(true);
	}
	
	$("#search_text_input").focus();
	this.isShow = true;
}


searchManeger.hide = function() {
	if (!this.isShow) {
		return;
	}
	
	$("#search_area").remove();
	
	if (this.stateChangeFunc) {
		this.stateChangeFunc(false);
	}
	this.isShow = false;
}

searchManeger.search = function(text) {
	if (text == "") {
		return;
	}
	
	
	$("#search_result_area").empty();
	
	const list = this.getMemosFunc(text);
	
	if (list.length == 0) {
		$("#search_result_area").text("該当するメモはありません");
		return;
	}
	
	for (let i=0; i<list.length; i++) {
		$("#search_result_area").append(this.createResultItem(list[i].memo, list[i].tray, text));
	}
}

searchManeger.createResultItem = function(memo, tray, text) {
	const elem = $("<div></div>", {"addClass": "search_result_item"}).on("click", ()=>{
		if (searchManeger.viewMemoFunc) {
			searchManeger.viewMemoFunc(memo.id);
		}
		searchManeger.hide();
	});
	
	let d = $("<div></div>", {"addClass": "info"});
	d.append($("<div></div>", {"addClass": "label"}).text("TRAY"));
	d.append($("<div></div>", {"addClass": "value"}).text(tray.name));
	elem.append(d);
	
	d = $("<div></div>", {"addClass": "info"});
	d.append($("<div></div>", {"addClass": "label"}).text("TITLE"));
	d.append($("<div></div>", {"addClass": "value"}).text(memo.title));
	elem.append(d);
	
	d = $("<div></div>", {"addClass": "info"});
	d.append($("<div></div>", {"addClass": "label"}).text("TIME"));
	d.append($("<div></div>", {"addClass": "value"}).text(memo.time));
	elem.append(d);
	
	elem.append($("<div></div>", {"css": {"clear": "both"}}).text(" "));

	let exText = this.extractText(memo, text);
	
	d = $("<div></div>", {"addClass": "search_result_item_text"});
	d.append($("<span></span>").text(exText.substring(0, exText.indexOf(text))));
	d.append($("<span></span>", {"addClass": "highlight"}).text(text));
	d.append($("<span></span>").text(exText.substring(exText.indexOf(text) + text.length, exText.length)));
	
	elem.append(d);
	
	return elem;
}

searchManeger.extractText = function(memo, text) {
	const length = 20;
	const m = memo.text;
	const index = m.indexOf(text);
	
	let preIndex = index - length;
	if (preIndex < 0) {
		preIndex = 0;
	}
	
	let postIndex = index + length;
	if (m.length < postIndex) {
		postIndex = m.length;
	}
	
	let exText = m.substring(preIndex, postIndex);
	
	if (preIndex != 0) {
		exText = "…" + exText;
	}
	if (postIndex != m.length) {
		exText = exText + "…";
	}
	
	return exText;
	
}
