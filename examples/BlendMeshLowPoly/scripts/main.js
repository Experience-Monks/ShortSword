/*
	Demo of loading 2 OBJs and blending between them
 */
var ssView = new SHORTSWORD.View();

var totalVerts = 200000;
var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/cube.obj", function(geometry1) {
	SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/yoshi.obj", function(geometry2) {
		SHORTSWORD.GeometryUtils.fillSurfaces(geometry1, geometry2.vertices.length);
		SHORTSWORD.GeometryGarage.fillSurfaces([geometry1, geometry2], totalVerts, function(){
			var mesh = new SHORTSWORD.BlendMesh(geometry1, geometry2);
			ssView.scene.add(mesh);
			_this.blendModel = mesh;
			_this.blendModel.scale.multiplyScalar(60);
		});
	});
});

var mouseMove = {x:0,y:0,speed:.1};

SHORTSWORD.PerformanceTweaker.upgradeWhen = 45;
SHORTSWORD.PerformanceTweaker.degradeWhen = 30;

var canvasGraph = new SHORTSWORD.CanvasGraph();
canvasGraph.addValue(SHORTSWORD.FPS, "fps", "green", "FPS Smoothed");
canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "degradeWhen", "#550000", "FPS Smoothed");
canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "upgradeWhen", "#2244aa", "FPS Smoothed");

ssView.renderManager.onEnterFrame.add(function() {
	SHORTSWORD.GeometryGarage.doSomeWork();
	if(!_this.blendModel) return;
	_this.blendModel.blend = Math.sin((new Date()).getTime() * .001) * .5 + .5;
	_this.blendModel.rotateY(mouseMove.x * mouseMove.speed);
	_this.blendModel.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};