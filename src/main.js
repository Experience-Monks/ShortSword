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
	Object3D : require('./model/Object3D'),
}