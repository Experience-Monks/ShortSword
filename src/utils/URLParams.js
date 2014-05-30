module.exports = {
	getParam : function(name) {
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(window.location.href);
		
		if (results==null){
		   return undefined;
		} else if(results[1] == "true"){
			return true;
		} else if(results[1] == "false"){
			return false;
		} else if(!isNaN(results[1])){
			return parseInt(results[1]);
		} else {
			return results[1] || false;
		}
	}
}