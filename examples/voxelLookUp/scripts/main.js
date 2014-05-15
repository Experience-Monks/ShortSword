/*
	Demo of loading and displaying an OBJ file.
 */
var ssView = new SHORTSWORD.View();

var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/mario_obj.obj", function(geometry) {

	var mat = new SHORTSWORD.materials.VoxelLookUp();

	var colours = [ 0xFFFFCAFE, 0xFF000000, 0xFF00FF00, 0xFF3300FF ];
	var lenColours = colours.length;

	for( var i = 0, len = geometry.vertices.length; i < len; i++ ) {

		mat.add( colours[ i % lenColours ] );
	}

	var mesh = new SHORTSWORD.Mesh( geometry, mat );
	ssView.scene.add(mesh);
	_this.objModel = mesh;
});

var mouseMove = {x:0,y:0,speed:.1};
SHORTSWORD.PerformanceTweaker.upgradeWhen = 45;
SHORTSWORD.PerformanceTweaker.degradeWhen = 30;

var canvasGraph = new SHORTSWORD.CanvasGraph();
canvasGraph.addValue(SHORTSWORD.FPS, "fps", "green", "FPS Smoothed");
canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "degradeWhen", "#550000", "FPS Smoothed");
canvasGraph.addValue(SHORTSWORD.PerformanceTweaker, "upgradeWhen", "#2244aa", "FPS Smoothed");

ssView.renderManager.onEnterFrame.add(function() {
	if(!_this.objModel) return;
	_this.objModel.rotateY(mouseMove.x * mouseMove.speed);
	_this.objModel.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};