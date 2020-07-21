GW = 100
GD = 240

obj =
	images:
		background: 'images/environment/background.png'

	verts:
		0: x: 0,  y: 0, z: 0.3
		1: x: GW, y: 0, z: 0.3
		2: x: 0,  y: 0, z: 1
		3: x: GW, y: 0, z: 1

		g0: x: 0,    y: 0, z: 1
		g1: x: GD*1, y: 0, z: 1
		g2: x: GD*2, y: 0, z: 1
		g3: x: GD*3, y: 0, z: 1
		g4: x: GD*4, y: 0, z: 1
		g5: x: GD*5, y: 0, z: 1
		g6: x: GD*6, y: 0, z: 1

	parts:
		line:
			hide: true
			faces: [
				{draw: 'f', fill: 'rgba(0,0,0,0.1)', verts: [0, 1, 3, 2]}
			]
		ground:
			# hide: true
			faces: [
				{type: 'part', part: 'line', vert: 'g0'}
				{type: 'part', part: 'line', vert: 'g1'}
				{type: 'part', part: 'line', vert: 'g2'}
				{type: 'part', part: 'line', vert: 'g3'}
				{type: 'part', part: 'line', vert: 'g4'}
				{type: 'part', part: 'line', vert: 'g5'}
				{type: 'part', part: 'line', vert: 'g6'}
			]

	bones:
		back:
			hide: true
			type: 'rect'
			draw: 'f'
			fill: '#fff'
			width: 1601
			height: 1001
			after:
				back1:
					type: 'image'
					image: 'background'
					x: 800
					y: -66
				back2:
					type: 'image'
					image: 'background'
					x: -800
					y: -66
					scaleX: -1
		fore:
			hide: true
			type: 'rect'
			draw: 'f'
			fill: '#eee'
			width: 801
			height: 1001
			after:
				fore_bg:
					type: 'path'
					draw: 'f'
					fill: '#eee'
					y: -120
					path: 'M 0,120 L 0,87 C 49,87 98,81 160,87 c 61,6 135,26 213,26 77,-0.1215 160,-20 232,-26 72,-6 134,1 196,0 L 800,120'
				fore:
					type: 'path'
					draw: 's'
					lineWidth: 2
					stroke: '#000'
					noClose: true
					y: -120
					path: 'M 0,87 C 49,87 98,81 160,87 c 61,6 135,26 213,26 77,-0.1215 160,-20 232,-26 72,-6 134,1 196,0'
