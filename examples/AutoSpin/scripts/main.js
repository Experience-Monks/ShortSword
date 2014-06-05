/*
	Demo of loading and displaying an OBJ file.
 */
var ssView = new SHORTSWORD.View();

var _this = this;
var fileName = SHORTSWORD.URLParamUtils.getParam("obj") || "cube.obj";
var voxels = SHORTSWORD.URLParamUtils.getParam("voxels");
if(!voxels) voxels = 60000;
var scale = SHORTSWORD.URLParamUtils.getParam("scale") || 20;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/" + fileName, function(geometry) {
	SHORTSWORD.GeometryGarage.fillSurfaces([geometry], voxels, function(){console.log("DONE!")});
	var mesh = new SHORTSWORD.Mesh(geometry, 
		new SHORTSWORD.materials.VoxelGradient({
			gammaColor: 4,
			gammaRamp: .5,
		})
	);
	_this.objModelPlatform = new SHORTSWORD.Object3D();
	_this.objModel = mesh;
	_this.objModel.scale.multiplyScalar(scale);
	ssView.scene.add(_this.objModelPlatform);
	_this.objModelPlatform.add(mesh);
});

var mouseTarget = new THREE.Vector3(0, 0, 100);
var mouseTargetTarget = mouseTarget.clone();
var horizontalLayout = .125;
var horizontalLayoutTarget = .125;

ssView.renderManager.onEnterFrame.add(function() {
	SHORTSWORD.GeometryGarage.doSomeWork();
	if(!_this.objModel) return;
	mouseTarget.x -= (mouseTarget.x - mouseTargetTarget.x) * .1;
	mouseTarget.y -= (mouseTarget.y - mouseTargetTarget.y) * .1;
	this.objModelPlatform.lookAt(mouseTarget);
	this.objModel.rotateY(.1);
	horizontalLayout -= (horizontalLayout - horizontalLayoutTarget) * .1;
	ssView.camera.recenter(horizontalLayout);
})
window.onmousemove = function(event) {
	mouseTargetTarget.x = 100 * (event.x / window.innerWidth * 2 - 1);
	mouseTargetTarget.y = -100 * (event.y / window.innerHeight * 2 - 1);
	horizontalLayoutTarget = Math.min(.875, Math.max(.125, (event.y / window.innerHeight)));
}.bind(this);
