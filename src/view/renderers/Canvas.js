var BaseRenderer = require('./Base');
function CanvasRenderer() {
	BaseRenderer.call( this );

	console.log('CanvasRenderer initialized!');
}

CanvasRenderer.prototype = Object.create(BaseRenderer.prototype);
CanvasRenderer.prototype.render = function() {
	console.log("render");
}

module.exports = CanvasRenderer;