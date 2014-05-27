/*
	Demo of loading and displaying an OBJ file.
 */
var ssView = new SHORTSWORD.View();

var hypotheticalJSONData = {
	"value" : "0xFFFFFFFF",
	"channelRamps" : {
		"r" : "gamma(0.75)",
		"g" : "sine",
		"b" : "gammaSine(1.6)"
	},
	"gammaColor" : 0.6,
	"gammaRamp" : 2.5
}

//var remapR = SHORTSWORD.RemapCurves.linear;
//var remapG = SHORTSWORD.RemapCurves.linear;
//var remapB = SHORTSWORD.RemapCurves.linear;

//var remapR = SHORTSWORD.RemapCurves.makeGamma(.75);
//var remapG = SHORTSWORD.RemapCurves.sine;
//var remapB = SHORTSWORD.RemapCurves.makeGammaSine(1.6);

var remapR = SHORTSWORD.RemapCurves.interpret(hypotheticalJSONData.channelRamps.r);
var remapG = SHORTSWORD.RemapCurves.interpret(hypotheticalJSONData.channelRamps.g);
var remapB = SHORTSWORD.RemapCurves.interpret(hypotheticalJSONData.channelRamps.b);

var _this = this;
var fileName = SHORTSWORD.URLParamUtils.getParam("obj") || "cube.obj";
var voxels = SHORTSWORD.URLParamUtils.getParam("voxels");
if(!voxels) voxels = 60000;
var scale = SHORTSWORD.URLParamUtils.getParam("scale") || 60;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/" + fileName, function(geometry) {
	SHORTSWORD.GeometryGarage.fillSurfaces([geometry], voxels, function(){console.log("DONE!")});
	var mesh = new SHORTSWORD.Mesh(geometry, 
		new SHORTSWORD.materials.VoxelGradient({
			gammaColor: hypotheticalJSONData.gammaColor,
			gammaRamp: hypotheticalJSONData.gammaRamp,
			//remapR: SHORTSWORD.RemapCurves.makeGamma(.5),
			remapR: remapR,
			remapG: remapG,
			remapB: remapB
		})
	);
	ssView.scene.add(mesh);
	_this.objModel = mesh;
	_this.objModel.scale.multiplyScalar(scale);
});

var mouseTarget = new THREE.Vector3(0, 0, 100);
var mouseTargetTarget = mouseTarget.clone();

SHORTSWORD.PerformanceTweaker.upgradeWhen = 45;
SHORTSWORD.PerformanceTweaker.degradeWhen = 30;

var canvasGraph = new SHORTSWORD.CanvasGraph();
//canvasGraph.addValue(SHORTSWORD.FPS, "fps", "green", "FPS Smoothed");
//canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "degradeWhen", "#550000", "FPS Smoothed");
//canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "upgradeWhen", "#2244aa", "FPS Smoothed");

var graphThese = {
	r: 0,
	g: 0,
	b: 0
}
canvasGraph.addValue(graphThese, "r", "red", "red");
canvasGraph.addValue(graphThese, "g", "green", "green");
canvasGraph.addValue(graphThese, "b", "blue", "blue");

ssView.renderManager.onEnterFrame.add(function() {
	var timeToGraph = (new Date * .001) % 1;
	graphThese.r = remapR(timeToGraph) * 60;
	graphThese.g = remapG(timeToGraph) * 60;
	graphThese.b = remapB(timeToGraph) * 60;

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
