var DOMMode = require('./DOMMode');

function View(props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);

	props = props || {};
	this.scene = props.scene || new (require('../model/Scene'))();
	this.renderer = props.renderer || new (require('./renderers/Canvas'))(this, props.renderer);
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;
	this.canvasID = props.canvasID || "ShortSwordCanvas";
	this.domMode = props.domMode || DOMMode.FULLSCREEN;
	
	//use provided canvas or make your own
	this.canvas = document.getElementById(this.canvasID) || this.createCanvas();

	console.log('View initialized!');

	this.renderManager = new(require('./RenderManager'))(this);
	this.setDOMMode(this.domMode);
	if(this.autoStartRender) this.renderManager.start();
}

View.prototype = {
	render: function () {
		this.renderer.render(this.scene);
	},
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		this.addCanvasToDOMBody(canvas);
		return canvas;
	},
	addCanvasToDOMBody: function(canvas) {
		canvas = canvas || this.canvas;
		if(document.body) {
			console.log("adding canvas to DOM");
			document.body.appendChild(canvas);
		} else {
			console.log("wait for DOM")
			setTimeout(this.addCanvasToDOMBody, 50);
		}
	},
	setDOMMode: function(mode) {
		
	}
};

module.exports = View;