
module.exports = function(grunt) {

	// Nodejs libs.
	var path = require('path'),
		fs = require('fs'),
		tar = require("tar"),
		zlib = require("zlib"),
		fstream = require("fstream"),
		THREE = require('../lib/three.min');

	var objLoader = new THREE.OBJLoader();

	console.log(objLoader.parse);


	var _this = this;

	// External libs.
	//var _ = require('lodash');

	// Internal libs.
	//var git = require('./lib/git').init(grunt);

	function generateTar() {
		fstream.Reader({
			path: _this.inputPath,
			type: "Directory",
			filter: function () {
				var isDirectory = this.type == "Directory"
				var willInclude = isDirectory || (_this.filesToInclude.indexOf(this.basename) != -1);
				if(willInclude && !isDirectory) console.log("adding " + this.basename);
				return willInclude;
			}
		})
		.pipe(tar.Pack())
		.pipe(zlib.createGzip())
		.pipe(fstream.Writer(_this.outputPath));
	};

	grunt.registerTask('packVoxels', 'pack OBJ models into one zipped archive.', function() {
		var options = this.options();
		_this.done = this.async();
		var manifestPath = path.resolve(options.pathToModels + "/" + options.manifest);
		_this.inputPath = path.resolve(options.pathToModels);
		_this.outputPath = path.resolve(options.pathToModels + "/" + options.output);

		console.log( 'FILES WILL GO TO', _this.outputPath );

		fs.readFile(manifestPath, 'utf8', function (err,data) {
			if (err) {
				console.log(err);
				_this.done();
			} else {
				_this.filesToInclude = [];
				var manifestData = JSON.parse(data).sections;

				for(var key in manifestData) {

					var fileName = manifestData[key];

					if( typeof fileName == 'object' )
						fileName = fileName.model;

					if(_this.filesToInclude.indexOf(fileName) == -1) _this.filesToInclude.push(fileName);
				}

				var leftToTranscode = _this.filesToInclude.length;

				checkIfDoneTranscodingAll = function() {
					leftToTranscode--;
					if(leftToTranscode == 0) {
						for (var i = _this.filesToInclude.length - 1; i >= 0; i--) {
							_this.filesToInclude[i] = _this.filesToInclude[i].replace(".obj", ".json");
						};
						generateTar();
					}
				}

				for (var i = 0; i < _this.filesToInclude.length; i++) {
					function closure() {
						var modelPath = path.resolve(options.pathToModels + "/" + _this.filesToInclude[i]);
						var modelJsonPath = path.resolve(options.pathToModels + "/" + _this.filesToInclude[i].replace(".obj", ".json"));
						function transcode() {
							fs.readFile(modelPath, 'utf8', function (err, data) {
								var mesh = objLoader.parse(data);
								if(mesh.children.length > 1) throw("ERROR:", modelPath, "contains more than one mesh. Please merge all geometry into one mesh.");
								var jsonModel = {};
								jsonModel.vertices = mesh.children[0].geometry.vertices;
								var faces = mesh.children[0].geometry.faces;
								var facesIndexes = [];
								for (var i = 0; i < faces.length; i++) {
									facesIndexes[i] = [faces[i].a, faces[i].b, faces[i].c];
								};
								jsonModel.faces = facesIndexes;
								var jsonData = JSON.stringify(jsonModel)
								fs.open(modelJsonPath, 'wx', function(err, fd){
									if(fd) fs.write(fd, jsonData, 0, 'utf8', function(err, written, buffer) {
										fs.close(fd);
										console.log("wrote", modelJsonPath);
										checkIfDoneTranscodingAll();
									});
									
								});
							});
						};
						fs.exists(modelJsonPath, function(exists){
							if(exists) {
								fs.unlink(modelJsonPath, transcode);
							} else {
								transcode();
							}
						})
					};
					closure();
				};
				
				//_this.filesToInclude = ["all.json"];
				
			};
		});

	});
};