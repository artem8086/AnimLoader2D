CoffeeScript = require 'coffeescript'
path = require  'path'
fs = require 'fs'
gulp = require 'gulp'
jade = require 'gulp-jade'
connect = require 'gulp-connect'
stylus = require 'gulp-stylus'
coffee = require 'gulp-coffee'
uglify = require('gulp-uglify-es').default
clean = require 'gulp-clean'
rollup = require 'gulp-rollup'
copy = require 'gulp-copy'
sourcemaps = require 'gulp-sourcemaps'

utils = require './utils'


assetsT = (cb) ->
	gulp.src 'assets/**/*.*'
		.pipe copy 'dist/', prefix: 1
	cb()

connectT = (cb) ->
	connect.server
		port: 1337
		livereload: on
		root: './dist'
	cb()

jadeT = (cb) ->
	gulp.src 'jade/*.jade'
		.pipe jade()
			.on 'error', console.log
		.pipe gulp.dest 'dist'
		.pipe do connect.reload
	cb()

stylusT = (cb) ->
	gulp.src 'stylus/*.styl'
		.pipe stylus(compress: on)
			.on 'error', console.log
		.pipe gulp.dest 'dist/css'
		.pipe do connect.reload

buildT = (cb) ->
	gulp.src 'coffee/**/*.coffee'
		.pipe do sourcemaps.init
		.pipe coffee()
			.on 'error', console.log
		.pipe rollup(
			input: 'coffee/main.js'
			output:
				format: 'cjs'
				intro: '(function(){'
				outro: '})();'
			).on 'error', console.log
		# .pipe uglify()
		# 	.on 'error', console.log
		.pipe do sourcemaps.write
		.pipe gulp.dest 'dist/js'
		.pipe do connect.reload

	gulp.src 'coffee/**/*.js', read: no
		.pipe do clean
	cb()

watchT = (cb) ->
	gulp.watch 'jade/**/*.jade', jadeT
	gulp.watch 'stylus/**/*.styl', stylusT
	gulp.watch 'coffee/**/*.coffee', buildT
	gulp.watch 'assets/**/*.*', assetsT
	gulp.watch 'coffee2json/**/*.coffee', coffee2JsonT
	cb()

coffee2jsonDir = path.join __dirname, 'coffee2json'
coffee2jsonExportDir = path.join __dirname, 'dist'

coffee2JsonT = (cb) ->
	compileInDir = (dir) ->
		fullDir = path.join coffee2jsonDir, dir
		items = fs.readdirSync fullDir

		files = []
		for file in items
			fileName = path.join fullDir, file
			if fs.statSync(fileName).isDirectory()
				exDir = path.join coffee2jsonExportDir, dir, file
				unless fs.existsSync exDir
					fs.mkdirSync exDir
				compileInDir path.join dir, file
			else if file.endsWith '.coffee'
				try
					js = CoffeeScript.compile fs.readFileSync(fileName).toString(),
						bare: true
					func = new Function 'utils', js + ';return obj;'
					json = JSON.stringify func(utils)
					fs.writeFile path.join(coffee2jsonExportDir, dir, path.basename(file, '.coffee') + '.json'), json, ->
				catch e
					console.log 'Error in file: ' + path.join(dir, file) + '\n' + e

	compileInDir ''
	cb()

exports.default = gulp.series assetsT, jadeT, stylusT, coffee2JsonT, buildT, connectT, watchT
