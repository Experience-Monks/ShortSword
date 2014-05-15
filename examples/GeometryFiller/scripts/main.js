/*
	Demo of loading 2 OBJs and blending between them
 */
var ssView = new SHORTSWORD.View();

var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/cube.obj", function(geometry) {
	SHORTSWORD.GeometryUtils.fillSurfaces(geometry, 200000);
	var mesh = new SHORTSWORD.Mesh(geometry);
	ssView.scene.add(mesh);
	_this.model = mesh;
	_this.model.scale.multiplyScalar(50);
});

var mouseMove = {x:0,y:0,speed:.1};

var canvasGraph = new SHORTSWORD.CanvasGraph();

ssView.renderManager.onEnterFrame.add(function() {
	if(!_this.model) return;
	_this.model.rotateY(mouseMove.x * mouseMove.speed);
	_this.model.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};

//ssView.renderManager.stop();