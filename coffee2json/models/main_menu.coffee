obj =
	models:
		tiles: 'models/parts/tiles'
		asfalt: 'models/parts/asfalt'
		houses: 'models/parts/houses'
		trees: 'models/parts/trees'
	verts:
		"house": x:346,     y:201, z:0.26

		"grnd0": x:-1700,   y:180,   z: 0.8
		"grnd1": x:800,     y:180,   z: 0.8
		
		"asf-6": x:-2800,   y:200, z:1
		"asf-5": x:-2500,   y:200, z:1
		"asf-4": x:-2200,   y:200, z:1
		"asf-3": x:-1900,   y:200, z:1
		"asf-2": x:-1600,   y:200, z:1
		"asf-1": x:-1300,   y:200, z:1

		"asf0":  x:-1000,   y:200, z:1
		"asf1":  x:-700,    y:200, z:1
		"asf2":  x:-400,    y:200, z:1
		"asf3":  x:-100,    y:200, z:1
		"asf4":  x:200,     y:200, z:1
		"asf5":  x:500,     y:200, z:1
		"asf6":  x:800,     y:200, z:1

		"back0": x:-3200*4, y:0,   z:0.15
		"back1": x:-1600*4, y:0,   z:0.15
		"back2": x:0,       y:0,   z:0.15
		"back3": x:1600*4,   y:0,   z:0.15

		"fore0": x:-1600,   y:222, z:1.2
		"fore1": x:-800,    y:222, z:1.2
		"fore2": x:0,       y:222, z:1.2
		"fore3": x:800,     y:222, z:1.2

		"tree0": x:-320,    y:180, z:0.8
		"tree1": x:-150,    y:180, z:0.65
		"tree2": x:1200,    y:180, z:0.4
		"tree3": x:-1200,   y:180, z:0.5
		"tree4": x:-1850,   y:180, z:0.2

		title_sh: x: -200+2, y: -140+2, z: 1.595
		title:    x: -200,   y: -140,   z: 1.6
	parts:
		main_menu:
			faces: [
				{type: 'node', model: 'tiles', node: 'back', vert: 'back0', scaleX: 4, scaleY: 4}
				{type: 'node', model: 'tiles', node: 'back', vert: 'back1', scaleX: 4, scaleY: 4}
				{type: 'node', model: 'tiles', node: 'back', vert: 'back2', scaleX: 4, scaleY: 4}
				{type: 'node', model: 'tiles', node: 'back', vert: 'back3', scaleX: 4, scaleY: 4}

				{type: 'part', model: 'tiles', part: 'ground', vert: 'grnd0'}
				{type: 'part', model: 'tiles', part: 'ground', vert: 'grnd1'}

				{type: 'part', model: 'trees', part: 'tree1', vert: 'tree4'}

				{type: 'part', model: 'houses', part: 'house1', vert: 'house'}

				{type: 'part', model: 'asfalt', part: 'asfaltUp', vert: 'asf4'}

				{type: 'part', model: 'trees', part: 'tree1', vert: 'tree3'}
				{type: 'part', model: 'trees', part: 'tree1', vert: 'tree2'}
				{type: 'part', model: 'trees', part: 'tree1', vert: 'tree1'}
				{type: 'part', model: 'trees', part: 'tree1', vert: 'tree0'}


				{type: 'part', model: 'asfalt', part: 'road', vert: 'asf-4'}
				{type: 'part', model: 'asfalt', part: 'road', vert: 'asf0'}
				{type: 'part', model: 'asfalt', part: 'road', vert: 'asf5'}

				{type: 'node', model: 'tiles', node: 'fore', vert: 'fore0'}
				{type: 'node', model: 'tiles', node: 'fore', vert: 'fore1'}
				{type: 'node', model: 'tiles', node: 'fore', vert: 'fore2'}
				{type: 'node', model: 'tiles', node: 'fore', vert: 'fore3'}

				{type: 'node', node: 'title', fill: 'rgba(0,0,0,0.7)', vert: 'title_sh'}
				{type: 'node', node: 'title', fill: '#f00', vert: 'title'}
			]
	bones:
		title:
			hide: true
			draw: 'f'
			type: 'text'
			text: '#title'
			textAlign: 'center'
			font: 'bold 80px serif'