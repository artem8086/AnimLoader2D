import { EventEmmiter } from './events'

# Events:
# 'changepercent' trigger when some resorces loaded
# 'load' trigger when all resorces loaded

class Loader extends EventEmmiter
	loadResNumber = 0
	allResLoader = 0

	reset: () ->
		loadResNumber = allResLoader = 0

	getPercent: ->
		1 - if allResLoader != 0 then loadResNumber / allResLoader else 0

	updatePercent: () ->
		@trigger 'changepercent', [ @getPercent() ]

	load: (callback) ->
		_this = this
		loadResNumber++
		allResLoader++
		# @updatePercent()
		->
			callback?.apply _this, arguments
			loadResNumber--
			if loadResNumber <= 0
				_this.reset()
				_this.trigger 'load'
			_this.updatePercent()

	loadJson: (file, callback) ->
		callback = @load callback
		$.getJSON file + '.json'
			.done callback
			.fail ->
				callback null

	loadImage: (file, callback) ->
		callback = @load callback
		img = new Image
		img.onload = ->
			callback img
		img.src = file
		img

export { Loader }