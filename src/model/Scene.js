var Object3D = require('./Object3D');
/**
 * The basic root Object3D to build a scene
 */
function Scene() {
	Object3D.call( this );

	console.log('Scene initialized!');

}

/**
 * Scene extends Object3D
 */
Scene.prototype = Object.create(Object3D.prototype);

module.exports = Scene;
