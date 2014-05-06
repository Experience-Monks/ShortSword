var DOMMode = require('./DOMMode');
/**
 * View is the viewport canvas and the renderer
 * @param {Object} props an object of properties to override default dehaviours
 */
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
	/**
	 * Renders the scene to the canvas using the renderer
	 * @return {[type]} [description]
	 */
	render: function () {
		this.renderer.render(this.scene);
	},

	/**
	 * Creates the canvas DOM Element and appends it to the document body
	 * @return {CanvasElement} The newly created canvas element.
	 */
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		this.addCanvasToDOMBody(canvas);
		return canvas;
	},

	/**
	 * Actually appends canvas to the DOM.
	 * Will wait until document body is ready.
	 * @param {CanvasElement} canvas the Canvas Element to append to the document body when the DOM is ready.
	 */
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

	/**
	 * sets the DOM Mode, which controls the css rules of the canvas element
	 * @param {String} mode string, enumerated in DOMMode
	 */
	setDOMMode: function(mode) {
		var style = this.canvas.style;
		switch(mode) {
			case DOMMode.FULLSCREEN:
				style.position = "fixed";
				style.left = "0px";
				style.top = "0px";
				style.width = window.innerWidth;
				style.height = window.innerHeight;
				break;
			default:
		}
	}
};

module.exports = View;