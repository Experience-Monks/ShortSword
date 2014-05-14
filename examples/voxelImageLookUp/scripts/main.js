/*
	Demo of loading and displaying an OBJ file.
 */
var ssView = new SHORTSWORD.View();

var _this = this;
SHORTSWORD.Loader.loadGeometryOBJ("../assets/models/mario_obj.obj", function(geometry) {

	

	var img = new Image();
	img.src = '../assets/images/image1.png';

	var img2 = new Image();
	img2.src = '../assets/images/image2.png';

	var mat = new SHORTSWORD.materials.VoxelImageLookUp();

	geometry.vertices.length = 5000;

	img.onload = onImageLoaded;
	img2.onload = onImageLoaded;


	function onImageLoaded() {

		console.log( img.complete && img2.complete );

		if( img.complete && img2.complete ){

			for( var i = 0, len = geometry.vertices.length; i < len; i++ ) {

				if( i % 2 )
					mat.addFromImage( img );
				else
					mat.addFromImage( img2 );
			}
			
			var mesh = new SHORTSWORD.Mesh( geometry, mat );

			ssView.scene.add( mesh );
			_this.objModel = mesh;
		}
	}
});

var mouseMove = {x:0,y:0,speed:.1};
ssView.renderManager.onEnterFrame.add(function() {
	if(!_this.objModel) return;
	_this.objModel.rotateY(mouseMove.x * mouseMove.speed);
	_this.objModel.rotateX(mouseMove.y * mouseMove.speed);
})
window.onmousemove = function(event) {
	mouseMove.x = event.x / window.innerWidth * 2 - 1;
	mouseMove.y = event.y / window.innerHeight * 2 - 1;
};