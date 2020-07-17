class AnimationData
	@cache: []

	@load: (loader, file) ->
		animData = AnimationData.cache[file]
		unless animData
			animData = new AnimationData
			animData.load loader, file
			AnimationData.cache[file] = animData
		animData

	load: (loader, file) ->
		loader.loadJson file, (data) =>
			if data
				for key, value of data
					this[key] = value

getTime = ->
	new Date().getTime() / 1000

makeEaseOut = (timing) ->
	(time) ->
		1 - timing(1 - time)

makeEaseInOut = (timing) ->
	(time) ->
		if time < 0.5
			timing(2 * time) / 2
		else
			(2 - timing(2 * (1 - time))) / 2


setTimingFunction = (name, timing) ->
	timingFunctions[name] = timing
	timingFunctions[name + 'EaseOut'] = makeEaseOut timing
	timingFunctions[name + 'EaseInOut'] = makeEaseInOut timing

timingFunctions =
	linear: (time) ->
		time

	easeOut: (time) ->
		1 - time

	easeInOut: (time) ->
		if time < 0.5
			time * 2
		else
			2 - time * 2

setTimingFunction 'quad', (time) ->
	time * time

setTimingFunction 'circle', (time) ->
	1 - Math.sin Math.acos time

setTimingFunction 'bounce', (time) ->
	a = 0
	b = 1
	while true
		if time >= (7 - 4 * a) / 11
			return -Math.pow((11 - 6 * a - 11 * time) / 4, 2) + Math.pow(b, 2)
		a += b
		b /= 2

class Animation
	@getTime: getTime

	loop: true
	startTime: 0
	duration: 0
	deltaTime: 0
	scale: 1

	@props: []
	@propsUsed: []

	reset: ->
		@startTime = getTime()
		@deltaTime = 0
		this

	set: (name, data = @data) ->
		@anim = data?[name]
		@reset()
		if @anim
			@duration = if @anim then @anim.duration else 0
			@frame = @anim.frames
		this

	play: (time) ->
		time = time || getTime()
		@deltaTime = delta = (time - @startTime) * @scale
		duration = @duration
		unless duration
			return false
		if delta > duration
			if @loop
				@deltaTime %= duration
			else
				return false
		true

	animate: (node, nodePath = node.nodePath, nodeName = node.nodeName) ->
		frame = @frame
		if frame
			timestops = frame[nodePath] || frame[nodeName]
			if timestops
				delta = @deltaTime
				props = Animation.props
				propsUsed = Animation.propsUsed
				for point in timestops
					if delta >= point.end
						for name, toVal of point.to
							unless propsUsed[name]
								props[name] = node[name]
								propsUsed[name] = true
							node[name] = toVal
					else if delta >= point.start
						if point.func
							tFunc = timingFunctions[point.func]
						else
							tFunc = timingFunctions.linear
						#
						for name, toVal of point.to
							prop = node[name]
							unless propsUsed[name]
								props[name] = prop
								propsUsed[name] = true
							prop ||= 0
							if toVal.constructor == Number
								time = tFunc((delta - point.start) / (point.end - point.start))
								node[name] = (toVal - prop) * time + prop
							else
								node[name] = toVal
		this

	reciveProps: (node) ->
		props = Animation.props
		propsUsed = Animation.propsUsed
		for name, use of propsUsed
			if use
				node[name] = props[name]
				delete propsUsed[name]
		this

	createWorkFrame: ->
		@loop = false
		@frame =
			work: [
				{
					start: 0
					end: 0
					to: {}
				}
			]
		this

	resetWork: ->
		propsUsed = Animation.propsUsed
		for name, use of propsUsed
			if use then propsUsed[name] = false
		this

	clearWork: ->
		propsUsed = Animation.propsUsed
		aObj = @frame.work[0]
		aObj.start = aObj.end = 0
		to = 
		for name, _ of to
			delete to[name]
		this

	animateProps: (props, duration, func) ->
		@duration = duration
		aObj = @frame.work[0]
		aObj.end = duration
		aObj.func = func
		to = aObj.to
		for name, prop of props
			to[name] = prop
		@reset()
		this

export { AnimationData, Animation }