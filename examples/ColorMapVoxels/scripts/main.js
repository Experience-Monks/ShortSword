/*
	Demo of loading and displaying an OBJ file.
 */
var ssView = new SHORTSWORD.View();

var _this = this;
var fileName = SHORTSWORD.URLParamUtils.getParam("obj") || "cube.obj";
var voxels = SHORTSWORD.URLParamUtils.getParam("voxels");
if(!voxels) voxels = 60000;
var scale = SHORTSWORD.URLParamUtils.getParam("scale") || 60;
var pngRow = SHORTSWORD.URLParamUtils.getParam("pngRow");
if(pngRow === undefined) pngRow = 0;
function onVoxelImageReady(canvas) {
	SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/" + fileName, function(geometry) {
		SHORTSWORD.GeometryGarage.fillSurfaces([geometry], voxels, function(){console.log("DONE!")});
		var mesh = new SHORTSWORD.Mesh(geometry, 
			new SHORTSWORD.materials.VoxelGradient({
				colors: SHORTSWORD.ColorUtils.extractRowFromCanvas(canvas, pngRow),
				bumpFirst: true
			})
		);
		ssView.scene.add(mesh);
		_this.objModel = mesh;
		_this.objModel.scale.multiplyScalar(scale);
	});
}
SHORTSWORD.ImageUtils.loadAsCanvas('../assets/images/voxelColors.png', onVoxelImageReady);
var mouseTarget = new THREE.Vector3(0, 0, 100);
var mouseTargetTarget = mouseTarget.clone();

SHORTSWORD.PerformanceTweaker.upgradeWhen = 45;
SHORTSWORD.PerformanceTweaker.degradeWhen = 30;

var canvasGraph = new SHORTSWORD.CanvasGraph();
//canvasGraph.addValue(SHORTSWORD.FPS, "fps", "green", "FPS Smoothed");
//canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "degradeWhen", "#550000", "FPS Smoothed");
//canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "upgradeWhen", "#2244aa", "FPS Smoothed");


ssView.renderManager.onEnterFrame.add(function() {
	var timeToGraph = (new Date * .001) % 1;

	SHORTSWORD.GeometryGarage.doSomeWork();
	if(!_this.objModel) return;
	mouseTarget.x -= (mouseTarget.x - mouseTargetTarget.x) * .1;
	mouseTarget.y -= (mouseTarget.y - mouseTargetTarget.y) * .1;
	this.objModel.lookAt(mouseTarget);
})
window.onmousemove = function(event) {
	mouseTargetTarget.x = 100 * (event.x / window.innerWidth * 2 - 1);
	mouseTargetTarget.y = -100 * (event.y / window.innerHeight * 2 - 1);
}.bind(this);
