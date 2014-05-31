var BaseRenderer = require('./renderers/Base');
var DOMMode = require('./DOMMode');
var EventUtils = require('../utils/Events');
var signals = require('../vendor/signals');
var PerformanceTweaker = require('../utils/PerformanceTweaker');
/**
 * View is the viewport canvas and the renderer
 * @param {Object} props an object of properties to override default dehaviours
 */
function View(props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);

	props = props || {};
	this.scene = props.scene || new (require('../model/Scene'))();
	if(props.camera) {
		this.camera = props.camera;
	} else {
		this.camera = new (require('../model/Camera3D'))();
		this.scene.add(this.camera);
		this.camera.position.z = 150;
		this.camera.position.y = 60;
		this.camera.lookAt(this.scene.position);
	}
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;
	this.canvasID = props.canvasID || "ShortSwordCanvas";
	this.domMode = props.domMode || DOMMode.FULLSCREEN;
	
	//use provided canvas or make your own
	this.canvas = document.getElementById(this.canvasID) || this.createCanvas();

	if( this.renderer !== undefined && this.renderer instanceof BaseRenderer)
		this.renderer = props.renderer;
	else 
		this.renderer = new (require('./renderers/Canvas'))(this.canvas, props.renderer);

	this.renderManager = new(require('./RenderManager'))(this);
	this.setDOMMode(this.domMode);
	if(this.autoStartRender) this.renderManager.start();

	PerformanceTweaker.onChange.add(this.onPerformanceTweakerChangeResolution.bind(this));

	this.setupResizing();
}

View.prototype = {
	setupResizing: function() {
		this.onResize = new signals.Signal();
		this.setSize = this.setSize.bind(this);
		EventUtils.addEvent(window, "resize", function(event) {
	
			this.onResize.dispatch(window.innerWidth, window.innerHeight);
		}.bind(this));
		this.onResize.add(this.setSize);
		this.setSize(window.innerWidth, window.innerHeight);

	},
	/**
	 * Renders the scene to the canvas using the renderer
	 * @return {[type]} [description]
	 */
	render: function () {
		PerformanceTweaker.update();
		this.renderer.render(this.scene, this.camera);
	},

	/**
	 * Creates the canvas DOM Element and appends it to the document body
	 * @return {CanvasElement} The newly created canvas element.
	 */
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
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
			
			document.body.appendChild(canvas);
		} else {
			
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
	},

	setSize: function(w, h) {
		this.canvas.style.width = w;
		this.canvas.style.height = h;
		this.camera.setAspect(w/h);
		this.camera.setLens(w, h);

		this.setResolution(
			~~(w / PerformanceTweaker.denominator), 
			~~(h / PerformanceTweaker.denominator)
		);
	},

	setResolution: function(w, h) {
		this.canvas.width = w;
		this.canvas.height = h;
		this.renderer.setSize(w, h);
	},

	onPerformanceTweakerChangeResolution: function(dynamicScale) {
		this.setResolution(
			~~(window.innerWidth * dynamicScale),
			~~(window.innerHeight * dynamicScale)
		);
	}
};

module.exports = View;