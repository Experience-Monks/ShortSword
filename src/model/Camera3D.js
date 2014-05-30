var Object3D = require('./Object3D');
require('../vendor/three');
/**
 * A camera to render a scene from
 * @param {Object} props an object of properties to override default dehaviours
 */
function Camera3D(props) {
	Object3D.call( this );
	props = props || {};
	this.fov = props.fov !== undefined ? fov : 50;
	this.aspect = props.aspect !== undefined ? aspect : 1;
	this.near = props.near !== undefined ? near : 0.1;
	this.far = props.far !== undefined ? far : 2000;

	this.matrixWorldInverse = new THREE.Matrix4();

	this.projectionMatrix = new THREE.Matrix4();
	this.projectionMatrixInverse = new THREE.Matrix4();
	this.translationMatrix = new THREE.Matrix4();

	this.updateProjectionMatrix();
}

/**
 * Camera3D extends Object3D
 */
Camera3D.prototype = Object.create(Object3D.prototype);

Camera3D.prototype.setLens = function ( focalLength, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( focalLength * 2 ) ) );
	this.updateProjectionMatrix();
}

Camera3D.prototype.setLensHorizontalFit = function ( frameWidth, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( frameWidth * 2 ) ) );
	this.translationMatrix.makeTranslation(0, 20 * frameHeight / frameWidth, 0);
	this.updateProjectionMatrix();
}

Camera3D.prototype.updateProjectionMatrix = function () {

	this.projectionMatrix.makePerspective( this.fov, this.aspect, this.near, this.far );
	this.projectionMatrix.multiply(this.translationMatrix);
};

Camera3D.prototype.setAspect = function(aspect) {
	this.aspect = aspect;
	this.updateProjectionMatrix();
}

module.exports = Camera3D;
