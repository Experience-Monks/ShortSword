/*
	Demo of loading 2 OBJs and blending between them
 */
var ssView = new SHORTSWORD.View();

var lerpColors = [
	[ 0xFF000000, 0xFFFF00FF, 0xFFFFFFFF ],
	[ 0xFF000000, 0xFF00FFFF, 0xFFFFFFFF ],
	[ 0xFF000000, 0xFFFF0000, 0xFFFFFFFF ],
	[ 0xFF000000, 0xFF00FF00, 0xFFFFFFFF ]
];

var lerpWeights = [ 0, .25, 1];

var colors = [];
for (var i = 0; i < lerpColors.length; i++) {
	colors[i] = SHORTSWORD.ColorUtils.sampleGradient(
		lerpColors[i],
		lerpWeights,
		SHORTSWORD.materials.VoxelGradient.steps
	)

	console.log(i, "------");
	for (var j = 0; j < colors[i].length; j++) {
		console.log(SHORTSWORD.ColorUtils.pretty(colors[i][j]));
	};

	SHORTSWORD.GradientUtils.preventColor(colors[i], 0xFF000000);
	SHORTSWORD.GradientUtils.makeUnique(colors[i]);
	SHORTSWORD.GradientUtils.bump(colors[i]);

	console.log(i, "------");
	for (var j = 0; j < colors[i].length; j++) {
		console.log(SHORTSWORD.ColorUtils.pretty(colors[i][j]));
	};
};

var animator = null;

var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/Luigi_obj.obj", function(geometry1) {
	SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/mario_obj.obj", function(geometry2) {
		var mesh = new SHORTSWORD.BlendMesh(
			geometry1,
			geometry2,
			new SHORTSWORD.materials.VoxelGradient({
				colors: colors[0]
			})
		);

		animator = mesh.addAnimator( SHORTSWORD.animators.MaterialGradient );
		changeColors();
		setInterval( changeColors, 4000 );
		

		ssView.scene.add(mesh);
		_this.blendModel = mesh;
	});
});

var mouseMove = {x:0,y:0,speed:.1};
ssView.renderManager.onEnterFrame.add(function() {
	if(!_this.blendModel) return;
	_this.blendModel.blend = Math.sin((new Date()).getTime() * .001) * .5 + .5;
	//_this.blendModel.updateGeometry();
	_this.blendModel.rotateY(mouseMove.x * mouseMove.speed);
	_this.blendModel.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};

function changeColors() {

	var idx = Math.round( ( colors.length - 1 ) * Math.random() );
	animator.setTarget( colors[ idx ]);
}