import { Sprite } from './sprite'
import { Animation } from './animation'

class ModelData
	@cache: []

	@load: (loader, file) ->
		model = ModelData.cache[file]
		unless model
			model = new ModelData
			model.load loader, file
			ModelData.cache[file] = model
		model

	load: (loader, file) ->
		loader.loadJson file, (data) =>
			@loadData loader, data

	loadData: (loader, data) ->
		if data
			for key, value of data
				this[key] = value

			if @images
				imagesData = @images
				@images = []
				for key, image of imagesData
					@images[key] = loader.loadImage image

			if @sprites
				spritesData = @sprites
				@sprites = []
				for key, sprite of spritesData
					@sprites[key] = Sprite.load loader, sprite

			if @models
				modelsData = @models
				@models = []
				for key, model of modelsData
					@models[key] = 
						if typeof model == 'string'
							ModelData.load loader, model
						else
							@loadData.call new ModelData, loader, model

				nodesLoad = (nodes, nodePath = '') ->
					for name, node of nodes
						node.nodePath = nodePath + name
						node.nodeName = '@' + name
						if node.before
							nodesLoad node.before, node.nodePath + '<'
						if node.after
							nodesLoad node.after, node.nodePath + '>'

				if @bones
					nodesLoad @bones
		this


drawTypeObj =
	line: (g) ->
		g.moveTo @x1 || 0, @y1 || 0
		g.lineTo @x2 || 0, @y2 || 0
		this

	rect: (g) ->
		g.rect @x || 0, @y || 0, @width || 1, @height || 1
		this

	rectRound: (g) ->
		@noClose = false
		x = @x || 0
		y = @y || 0
		w = @width
		h = @height
		r = @radius
		if w < 2 * r then r = w / 2
		if h < 2 * r then r = h / 2

		g.moveTo x + r, y
		g.arcTo  x + w, y,     x + w, y + h, r
		g.arcTo  x + w, y + h, x,     y + h, r
		g.arcTo  x,     y + h, x,     y,     r
		g.arcTo  x,     y,     x + w, y,     r
		this

	arc: (g) ->
		g.arc(
			@x || 0,
			@y || 0,
			@radius,
			(@startAngle || 0) * Math.PI / 180,
			(@endAngle || 360) * Math.PI / 180,
			if @clockwise then false else true)
		this

	elipse: (g) ->
		g.ellipse(
			@x || 0,
			@y || 0,
			@rx,
			@ry,
			(@rotation || 0) * Math.PI / 180,
			(@startAngle || 0) * Math.PI / 180,
			(@endAngle || 360) * Math.PI / 180,
			if @clockwise then false else true)
		this

	path: (g) ->
		x = @x || 0
		y = @y || 0
		if typeof @path == 'string'
			@path = new Path2D @path
		#
		@noClose = true
		g.translate x, y
		draw = @draw || 'f&s'
		if draw == 'f' || draw == 'f&s'
			g.fill @path
		if draw == 's' || draw == 'f&s'
			g.stroke @path
		this

	node: (g, model, opacity, data) ->
		@noClose = @draw = true
		# Save current model data
		tData = model.data
		# Select model
		data = data || tData.models?[@model]
		if data
			model.data = data
			nodes = data.bones
		else
			nodes = model.data.bones
		if nodes
			# Select node in model
			node = @node
			if typeof node == 'string'
				node = nodes[node]
			else
				root = nodes
				for path in node
					root = root[path]
				node = root
			if node
				g.translate @x || 0, @y || 0
				drawNode.call node, g, model, opacity
				# Recive model data
		model.data = tData
		this

	attach: (g, model, opacity) ->
		data = model.attachment[@attach]
		if data
			drawTypeObj.node.call this, g, model, opacity, data
		this

	image: (g, model) ->
		@noClose = @draw = true
		image = model.data.images[@image]
		if @width || @height
			g.drawImage image, @x || 0, @y || 0, @width, @height
		else
			g.drawImage image, @x || 0, @y || 0
		this

	sprite: (g, model) ->
		@noClose = @draw = true
		sprite = @sprite
		if sprite.constructor == String
			@sprite = sprite = model.data.sprites[sprite]
		sprite.draw g, @frame, @x || 0, @y || 0, @index
		this

	text: (g) ->
		if @draw != true
			@drawText = @draw
		draw = @drawText
		@noClose = @draw = true
		#
		if @font then g.font = @font
		if @textAlign then g.textAlign = @textAlign
		if @textBaseline != null then g.textBaseline = @textBaseline
		if @direction then g.direction = @direction
		#
		if draw == 'f' || draw == 'f&s'
			g.fillText @text, @x || 0, @y || 0, @maxWidth
		if draw == 's' || draw == 'f&s'
			g.strokeText @text, @x || 0, @y || 0, @maxWidth
		this

styleTypeFunc =
	linear: (g) ->
		gradient = g.createLinearGradient @x0 || 0, @y0 || 0, @x1 || 0, @y1 || 0
		for colorStop in @colorStops
			gradient.addColorStop colorStop.pos || 0, colorStop.color
		gradient

	radial: (g) ->
		gradient = g.createRadialGradient @x0 || 0, @y0 || 0, @r0 || 0, @x1 || 0, @y1 || 0, @r1 || 0
		for colorStop in @colorStops
			gradient.addColorStop colorStop.pos || 0, colorStop.color
		gradient

	pattern: (g, model) ->
		image = model.data.images[@image]
		g.createPattern image, @repetition || "repeat"

initStyle = (g, model, style) ->
	styleTypeFunc[style.type]?.call style, g, model

setDrawStyle = (g, model) ->
	stroke = @stroke
	if stroke
		if stroke.constructor == Object
			@stroke = initStyle g, model, stroke
		g.strokeStyle = @stroke
	fill = @fill
	if fill
		if fill.constructor == Object
			@fill = initStyle g, model, fill
		g.fillStyle = @fill
	if @lineWidth != null then g.lineWidth = @lineWidth
	if @lineCap != null then g.lineCap = @lineCap
	if @lineJoin then g.lineJoin = @lineJoin
	if @lineDashOffset != null then g.lineDashOffset = @lineDashOffset
	this

drawNode = (g, model, opacity) ->
	g.save()
	model.animation.animate this
	g.transform @scaleX || 1, @skewY || 0, @skewX || 0, @scaleY || 1, @origX || 0, @origY || 0
	if @angle then g.rotate @angle * Math.PI / 180
	setDrawStyle.call this, g, model
	# Shadows
	if @noShadow
		g.shadowBlur = 0
		g.shadowOffsetX = 0
		g.shadowOffsetY = 0
	if @shadowBlur != null then g.shadowBlur = @shadowBlur
	if @shadowColor != null then g.shadowColor = @shadowColor
	if @shadowOffsetX != null then g.shadowOffsetX = @shadowOffsetX
	if @shadowOffsetY != null then g.shadowOffsetY = @shadowOffsetY
	g.globalAlpha = opacity * (if @opacity == null then 1 else @opacity)

	if @before
		model.animation.reciveProps this
		#
		for key, node of @before
			if !node.hide
				drawNode.call node, g, model, opacity
		#
		model.animation.animate this

	g.beginPath()
	drawTypeObj[@type]?.call this, g, model, opacity
	if !@noClose then g.closePath()

	draw = @draw || 'f&s'
	if draw == 'f' || draw == 'f&s'
		g.fill()
	if draw == 's' || draw == 'f&s'
		g.stroke()

	if @clip
		g.clip()

	model.animation.reciveProps this

	if @after
		for key, node of @after
			if !node.hide
				drawNode.call node, g, model, opacity

	if Model.drawOrigin
		g.fillStyle = '#f00'
		g.shadowBlur = 0
		g.shadowOffsetX = 0
		g.shadowOffsetY = 0
		g.fillRect -2, -2, 4, 4

	g.restore()
	this


drawPartType =
	poly: (g, verts, camera, model) ->
		v = verts[@verts[0]]
		xc = camera.x
		yc = camera.y
		zt = camera.z
		z = ((v.z || 1) * zt)
		x = ((v.x || 0) + xc) * z
		y = ((v.y || 0) + yc) * z
		g.moveTo x, y
		l = @verts.length - 1
		for i in [1..l]
			v = verts[@verts[i]];
			z = ((v.z || 1) * zt)
			x = ((v.x || 0) + xc) * z
			y = ((v.y || 0) + yc) * z
			g.lineTo x, y
		this

	part: (g, verts, camera, model, opacity) ->
		@noClose = @draw = true
		# Save model data
		tData = model.data
		# Select model
		data = tData.models?[@model]
		if data
			model.data = data
			parts = data.parts
		else
			parts = model.data.parts
		if parts
			v = verts[@vert]
			c =
				x: camera.x + (v.x || 0)
				y: camera.y + (v.y || 0)
				z: camera.z * (v.z || 1)

			part = parts[@part]
			if part
				tParts = model.parts
				model.parts = parts
				for face in part.faces
					drawPart.call face, g, model, c, opacity
				model.parts = tParts
		model.data = tData
		this

	node: (g, verts, camera, model, opacity) ->
		transformVert verts[@vert], camera
			.apply g
		drawNode.call this, g, model, opacity
		# drawTypeObj.node.call this, g, model, opacity
		this

	attach: (g, model, opacity) ->
		transformVert verts[@vert], camera
			.apply g
		data = model.attachment[@attach]
		if data
			drawTypeObj.node.call this, g, model, opacity, data
		this

	elipse: (g, verts, camera) ->
		v = transformVert verts[@vert1], camera
		x1 = v.x
		y1 = v.y
		v = transformVert verts[@vert2], camera
		x2 = v.x
		y2 = v.y
		rx = (x2 - x1) / 2
		ry = (y2 - y1) / 2
		g.ellipse(
			x1 + rx,
			y1 + ry,
			rx,
			ry,
			(@rotation || 0) * Math.PI / 180,
			(@startAngle || 0) * Math.PI / 180,
			(@endAngle || 360) * Math.PI / 180,
			if @clockwise then false else true)
		this


drawPart = (g, model, camera, opacity) ->
	g.save()
	stroke = @stroke
	setDrawStyle.call this, g, model
	g.globalAlpha = opacity * (if @opacity == null then 1 else @opacity)

	g.beginPath()
	drawPartType[@type || 'poly']?.call this, g, model.data.verts, camera, model, opacity
	if !@noClose then g.closePath()

	draw = @draw || 'f&s'
	if draw == 'f' || draw == 'f&s'
		g.fill()
	if draw == 's' || draw == 'f&s'
		g.stroke()

	g.restore()
	this

trsfObj =
	x: 0
	y: 0
	scale: 1
	apply: (g) ->
		g.transform @scale, 0, 0, @scale, @x, @y


class Model
	@transform: (x, y, z, camera) ->
		z = camera.z * z
		trsfObj.x = (x + camera.x) * z
		trsfObj.y = (y + camera.y) * z
		trsfObj.scale = z
		trsfObj

	constructor: (@data) ->
		@attachment = []
		@animation = new Animation

	setData: (@data) ->

	draw2D: (g, opacity = 1) ->
		if bones = @data?.bones
			for key, node of bones
				if !node.hide
					drawNode.call node, g, this, opacity

	drawNode: (g, node, opacity = 1) ->
		if bones = @data?.bones
			node = bones[node]
			if node
				drawNode.call node, g, this, opacity

	drawPart: (g, part, camera, opacity = 1) ->
		for face in part.faces
			drawPart.call face, g, this, camera, opacity

	drawParts: (g, camera, opacity = 1) ->
		if parts = @data?.parts
			for _, part of parts
				if !part.hide
					for face in part.faces
						drawPart.call face, g, this, camera, opacity

transform = Model.transform

transformVert = (v, camera) ->
	transform v.x || 0, v.y || 0, v.z || 1, camera

export { ModelData, Model }