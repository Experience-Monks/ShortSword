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
	this.hackyOffset = {x:0, y:.75};

	this.updateProjectionMatrix();
}

/**
 * Camera3D extends Object3D
 */
var p = Camera3D.prototype = Object.create(Object3D.prototype);

p.setLens = function ( focalLength, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( focalLength * 2 ) ) );
	this.updateProjectionMatrix();
}

p.setLensHorizontalFit = function ( frameWidth, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( frameWidth * 2 ) ) );
	this.updateProjectionMatrix();
}

p.updateProjectionMatrix = function () {

	this.projectionMatrix.makePerspective( this.fov, this.aspect, this.near, this.far );
	//this.projectionMatrix.elements[2] += this.hackyOffset.x;
	this.projectionMatrix.elements[9] += this.hackyOffset.y;

};

p.setAspect = function(aspect) {
	this.aspect = aspect;
	this.updateProjectionMatrix();
};

p.recenter = function(horizontalRatio) {
	this.hackyOffset.y = -(horizontalRatio * 2 - 1);
	this.updateProjectionMatrix();
}

module.exports = Camera3D;
