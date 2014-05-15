var Geometry = require('../model/Geometry');
var GeometryUtils = require('./Geometry');
var work = [];
var GeometryGarage = {
	fillSurfaces : function() {
		var verticesPerWorkRun = 10000;
		var targetWorkRunDuration = 6;
		var targetTweakRatio = 1.2;
		return function(geometries, newTotalVertices, callback) {
			if(!GeometryUtils.checkIfGeometryAttributesLengthsMatch(geometries)) {
				return;
			}
			var workLoad = {
				timeToProcess: 0,
				done: false,
				currentTotalVertices: geometries[0].vertices.length,
				targetTotalVertices: newTotalVertices,
				callback: callback,
				run: function() {
					var timeBefore = new Date;
					var nextTotal = Math.min(this.targetTotalVertices, this.currentTotalVertices + verticesPerWorkRun);
					for (var i = 0; i < geometries.length; i++) {
						GeometryUtils.fillSurfaces(geometries[i], nextTotal);
					};
					this.currentTotalVertices = nextTotal;
					var timeAfter = new Date;
					var duration = timeAfter - timeBefore;
					if(duration < targetWorkRunDuration) {
						verticesPerWorkRun = ~~(verticesPerWorkRun * targetTweakRatio);
					} else if(duration > targetWorkRunDuration) { 
						verticesPerWorkRun = ~~(verticesPerWorkRun / targetTweakRatio);
					}
					console.log("added " + verticesPerWorkRun + " vertices in " + (timeAfter-timeBefore) + "ms");
					if(this.targetTotalVertices == this.currentTotalVertices) {
						this.done = true;
						this.callback();
					}
				}
			};
			work.push(workLoad);
		};
	}(),
	octTreeSort: function() {
		return function() {

		}
	}(),
	doSomeWork: function() {
		for (var i = work.length - 1; i >= 0; i--) {
			work[i].run();
			if(work[i].done) work.splice(i, 1);
		};
	}
};

module.exports = GeometryGarage;