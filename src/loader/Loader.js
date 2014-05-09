var GeometryOBJParser = require('./parsers/GeometryOBJ');
function Loader() {
	console.log('Loader initialized!');
}

Loader.prototype = {
	queue: [],
	current: undefined,
	loadGeometryOBJ:function (url, callback) {
		this.load(url, callback, GeometryOBJParser);
	},
	load: function (url, callback, parser) {
		this.queue.push({
			url: url,
			callback: callback,
			parser: GeometryOBJParser
		});
		this.next();
	},
	next: function() {
		if(this.queue.length == 0) return;
		this.current = this.queue.shift();
		this.requestFile(this.current);
	},
	requestFile: function(item) {
	    var xmlhttp;
	    if (window.XMLHttpRequest) {
	        // code for IE7+, Firefox, Chrome, Opera, Safari
	        xmlhttp = new XMLHttpRequest();
	    } else {
	        // code for IE6, IE5
	        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	    }

	    xmlhttp.onreadystatechange = function() {
	        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	            item.callback(item.parser.parse(xmlhttp.responseText));
	            this.next();
	        }
	    }.bind(this);

	    xmlhttp.open("GET", item.url, true);
	    xmlhttp.send();
	}
};

module.exports = new Loader();