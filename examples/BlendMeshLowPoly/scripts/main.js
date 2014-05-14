/*
	Demo of loading 2 OBJs and blending between them
 */
var ssView = new SHORTSWORD.View();

var totalVerts = 100000;
var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/mario.obj", function(geometry1) {
	SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/yoshi.obj", function(geometry2) {
		SHORTSWORD.GeometryUtils.fillSurfaces(geometry1, totalVerts);
		SHORTSWORD.GeometryUtils.fillSurfaces(geometry2, totalVerts);
		var mesh = new SHORTSWORD.BlendMesh(geometry1, geometry2);
		ssView.scene.add(mesh);
		_this.blendModel = mesh;
		_this.blendModel.scale.multiplyScalar(60);
	});
});

var mouseMove = {x:0,y:0,speed:.1};
var canvasGraph = new SHORTSWORD.CanvasGraph();
canvasGraph.addValue(SHORTSWORD.FPS, "fps", "green", "FPS Smoothed");

ssView.renderManager.onEnterFrame.add(function() {
	if(!_this.blendModel) return;
	_this.blendModel.blend = Math.sin((new Date()).getTime() * .001) * .5 + .5;
	_this.blendModel.rotateY(mouseMove.x * mouseMove.speed);
	_this.blendModel.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};