/*
	Demo of loading 2 OBJs and blending between them
 */
var ssView = new SHORTSWORD.View();

var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/cube.obj", function(geometry) {
	SHORTSWORD.GeometryGarage.fillSurfaces(geometry, 1000000, function(){console.log("DONE!")});
//	SHORTSWORD.GeometryUtils.fillSurfaces(geometry, 1000000);
	var mesh = new SHORTSWORD.Mesh(geometry);
	ssView.scene.add(mesh);
	_this.model = mesh;
	_this.model.scale.multiplyScalar(50);
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
	if(!_this.model) return;
	_this.model.rotateY(mouseMove.x * mouseMove.speed * SHORTSWORD.FPS.animSpeedCompensation);
	_this.model.rotateX(mouseMove.y * mouseMove.speed * SHORTSWORD.FPS.animSpeedCompensation);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};

//ssView.renderManager.stop();