import { ModelData, Model } from './model'
import { AnimationData } from './animation'
import { Loader } from './loader'

$(document).ready ->
	$canvas = $ '#canvas'
	canvas = $canvas.get 0
	context = canvas.getContext '2d', alpha: false

	modelFile = 'models/banny'
	loader = new Loader
	model = new Model
	modelData = new ModelData
	animationFrame = null
	camera =
		canvas: canvas
		g: context
		x: 0
		y: 0
		z: 1

	resize = ->
		canvas.width = $(window).width()
		canvas.height = $(window).height() - $('#canvas').offset().top

	resize()

	$(window).on 'resize', resize

	modelRefresh = ->
#		for key, _ of modelData
#			delete modelData[key]
		modelData.load loader, modelFile
	
	loader.on 'load', ->
		model.setData modelData
		if model.animation.data
			# model.animation.set 'test'
			#
			container = $ '.js-frame-container'
			container.empty()
			for anim, _ of model.animation.data
				container.append "<a class='dropdown-item js-frame-select' href='#'>#{anim}</a>"
			model.animation.set animationFrame
			$('.js-frame-select').click ->
				animationFrame = $(this).text()
				model.animation.set animationFrame

	console.log model

	mRefreshInterval = setInterval modelRefresh, 500

	render = (delta) ->
		context.save()
		w = canvas.width
		h = canvas.height
		cx = w / 2
		cy = h / 2
		context.fillStyle = '#fff'
		context.fillRect 0, 0, w, h
		context.beginPath()
		context.lineWidth = 2
		context.strokeStyle = '#f00'
		context.moveTo cx, 0
		context.lineTo cx, h
		context.moveTo 0, cy
		context.lineTo w, cy
		context.stroke()

		context.translate cx, cy

		model.animation.play()

		model.drawParts context, camera

		Model.transform(0, 0, 1, camera)
			.apply context

		model.draw2D context

		context.restore()
		# 
		window.requestAnimationFrame render

	render(0)

	oldMouseX = oldMouseY =0
	moveCamera = (e) ->
		camera.x += e.clientX - oldMouseX
		camera.y += e.clientY - oldMouseY
		oldMouseX = e.clientX
		oldMouseY = e.clientY

	$canvas.on 'mousedown', (e) ->
		oldMouseX = e.clientX
		oldMouseY = e.clientY
		$canvas.on 'mousemove', moveCamera

	$canvas.on 'touchstart', (e) ->
		oldMouseX = e.touches[0].clientX
		oldMouseY = e.touches[0].clientY

	$canvas.on 'touchmove', (e) ->
		moveCamera e.touches[0]

	$canvas.on 'mouseup', ->
		$canvas.off 'mousemove', moveCamera

	$('.js-z-number')
		.val camera.z
		.on 'input change', ->
			camera.z = + $(this).val()

	$('.js-model-select').click ->
		modelData = new ModelData
		modelFile = $(this).data 'file'

	$('.js-anim-select').click ->
		file = $(this).data 'file'
		model.animation.data = new AnimationData
		model.animation.data.load loader, file
		$('.js-anim-refresh').data 'file', file
		#
		$('.js-refresh-model').prop 'checked', false
		clearInterval mRefreshInterval

	Model.drawOrigin = true
	$('.js-draw-origin').change ->
		Model.drawOrigin = $(this).prop 'checked'

	$('.js-refresh-model').change ->
		if $(this).prop 'checked'
			mRefreshInterval = setInterval modelRefresh, 500
		else
			clearInterval mRefreshInterval

	$('.js-reset-pos').click ->
		camera.x = camera.y = 0
		camera.z = 1
		$('.js-z-number').val '1'

	fullscreen = false
	$('.js-full-screen').click ->
		if fullscreen
			cancelFullscreen()
		else
			launchFullScreen document.documentElement
		fullscreen = !fullscreen

	launchFullScreen = (element) ->
		if element.requestFullScreen
			element.requestFullScreen()
		else if element.mozRequestFullScreen
			element.mozRequestFullScreen()
		else if element.webkitRequestFullScreen
			element.webkitRequestFullScreen()

	cancelFullscreen = ->
		if document.cancelFullScreen
			document.cancelFullScreen()
		else if document.mozCancelFullScreen
			document.mozCancelFullScreen()
		else if document.webkitCancelFullScreen
			document.webkitCancelFullScreen()