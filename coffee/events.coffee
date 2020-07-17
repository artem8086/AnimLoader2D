class EventEmmiter
	handlers: []

	on: (event, callback) ->
		if callback
			handler = @handlers[event]
			if !handler
				@handlers[event] = handler = []
			if handler.indexOf(callback) < 0
				handler.push callback
		this

	off: (event, callback) ->
		if callback
			handler = @handlers[event]
			if handler
				index = handler.indexOf callback
				if index >= 0
					handler.splice index, 1
		this

	trigger: (event, args) ->
		handler = @handlers[event]
		if handler
			for callback in handler
				callback.apply this, args
		this

	removeEvent: (event) ->
		delete @handlers[event]
		this

export { EventEmmiter }