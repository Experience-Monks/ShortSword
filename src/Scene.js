var Object3D = require('./Object3D');
function Scene(props) {
	props = props || {};

	Object3D.call( this );

	console.log('Scene initialized!');
	
	this.test();
}

Scene.prototype = Object.create(Object3D.prototype);

Scene.prototype.test = function() {
	console.log("SCENE TEST!!!!");
}

module.exports = Scene;
