function BaseRenderer(view, props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);

	this.view = view;
	
	props = props || {};
	this.canvasID = props.canvasID || "ShortSwordCanvas";
	
	//use provided canvas or make your own
	this.canvas = document.getElementById(this.canvasID) || this.createCanvas();

	console.log('BaseRenderer initialized!');

}

BaseRenderer.prototype = {
	render: function () {
		console.log("Dummy Render! Extend this Renderer to implement a real Renderer.");
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
	}
};

module.exports = BaseRenderer;