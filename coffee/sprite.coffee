class Sprite
	@cache: []

	@load: (loader, file) ->
		sprite = Sprite.cache[file]
		unless sprite
			sprite = new Sprite
			sprite.load loader, file
			Sprite.cache[file] = sprite
		sprite

	load: (loader, file) ->
		loader.loadJson file, (@data) =>
		loader.loadImage file + '.png', (@texture) =>

	draw: (g, frame, x, y, index = 0) ->
		data = @data
		if data
			switch frame.constructor
				when Object
					g.drawImage @texture,
						frame.x, frame.y, frame.w, frame.h,
						x + frame.cx, y + frame.cy, frame.w, frame.h
				when Array
					@draw g, frame[Math.floor(index) % frame.lenght], x, y
				when String
					@draw g, data[frame], x, y, index
		this

export { Sprite }