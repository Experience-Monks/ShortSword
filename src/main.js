/**
 * ShortSword is a library for rendering realtime animated voxels to a canvas.
 * Supports standard canvas element.
 *
 * Special Notes
 * =============
 * 
 * Math:
 * This uses a custom build of a subset of threejs. Specifically the math objects/methods.
 * math.js was considered but it lacks any convenience functions like rotate() or translate().
 */
SHORTSWORD = {
	View : require('./view/View'),
	Scene : require('./model/Scene'),
	BlendMesh : require('./model/BlendMesh'),
	Mesh : require('./model/Mesh'),
	Object3D : require('./model/Object3D'),
	Camera3D : require('./model/Camera3D'),
	Loader : require('./loader/Loader'),
	ColorUtils : require('./utils/Color'),
	GeometryUtils : require('./utils/Geometry'),
	TestFactory : require('./utils/TestFactory'),
	FPS : require('./utils/FPS'),
	CanvasGraph : require('./utils/CanvasGraph'),
	PerformanceTweaker : require('./utils/PerformanceTweaker'),
	materials: {

		Voxel: require( './model/materials/Voxel' ),
		VoxelGradient: require( './model/materials/VoxelGradient' ),
		VoxelLookUp: require( './model/materials/VoxelLookUp' ),
		VoxelImageLookUp: require( './model/materials/VoxelImageLookUp' )
	},
	effects: {
		GlitchOffset : require('./view/effects/GlitchOffset'),
		GlitchOffsetSmearBlock : require('./view/effects/GlitchOffsetSmearBlock')
	}
}