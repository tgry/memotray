window.jQuery = window.$ = require("./lib/jquery-3.2.0.min");

let sendName = null;

$(() => {
	$("#ok_button").click(sendParent);
	$("#cancel_button").click(()=>{
		require("electron").remote.getCurrentWindow().close();
	});
	
	$("#text_input").focus();
});

require("electron").ipcRenderer.on("dialog-setting", (e, message) => {
	sendName = message.sendName;
	
	const text = message.text;
	$("#text_input").val(text);
});

function sendParent() {
	if (!sendName) {
		require("electron").remote.getCurrentWindow().getParentWindow().send(sendName, null);
		require("electron").remote.getCurrentWindow().close();
		return;
	}
	require("electron").remote.getCurrentWindow().getParentWindow().send(sendName, $("#text_input").val());
	require("electron").remote.getCurrentWindow().close();
}
