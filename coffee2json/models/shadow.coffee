obj =
	bones:
		shadow:
			type: "arc"
			draw: "f"
			fill:
				type: "radial"
				r0: 30
				r1: 50
				colorStops: [
					{pos: 0, color: 'rgba(0,0,0,0.6)'}
					{pos: 1, color: 'rgba(0,0,0,0)'}
				]
			radius: 50
			scaleY: 0.4
