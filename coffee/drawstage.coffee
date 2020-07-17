import { Model } from './model'

MIN_Z_DISTANCE = -2000
MAX_Z_DISTANCE = 5000

class DrawStage

	objects: []

	constructor: (@canvas, @camera) ->

	add: (model, v) ->
		objects = @objects
		v = v ||
			x: 0
			y: 0
			z: 0
		if model.parts
			for _, part of model.parts
				unless part.hide
					p = new PartObject model, part
					p.v = v
					objects.push p

		unless model.nodeObj
			nObj = new NodeObject model
			nObj.v = v
			model.nodeObj = nObj
			objects.push nObj
		this

	delete: (model) ->
		delete model.nodeObj
		@objects = @objects.filter (obj) ->
			obj.model != model
		this

	draw: ->
		cz = @camera.z
		@drawList = drawObjs = @objects
			.filter ((obj) ->
				z = obj.getZ() + cz
				z >= MIN_Z_DISTANCE && z <= MAX_Z_DISTANCE)
			.sort (a, b) ->
				a.getZ() - b.getZ()
		#
		for obj in drawObjs
			obj.draw this
		this

tVector =
	x: 0
	y: 0
	z: 0

class PartObject
	constructor: (@model, @part) ->

	setPos: (v) ->
		@v.x = v.x
		@v.y = v.y
		@v.z = v.z

	getZ: ->
		@part.z + @v.z

	draw: (stage) ->
		c = stage.camera
		g = stage.canvas
		tVector.x = @v.x + c.x
		tVector.y = @v.y + c.y
		tVector.z = @v.z + c.z
		if @scale then g.scale @scale, @scale
		@model.drawPart g, @part, tVector, @opacity

class NodeObject
	constructor: (@model) ->

	setPos: (v) ->
		@v.x = v.x
		@v.y = v.y
		@v.z = v.z

	getZ: ->
		@v.z

	draw: (stage) ->
		c = stage.camera
		g = stage.canvas
		g.save()
		Model.transform(@v.x, @v.y, @v.z, camera)
			.apply g
		if @scale then g.scale @scale, @scale
		@model.drawNode g, @node, @opacity
		g.restore()