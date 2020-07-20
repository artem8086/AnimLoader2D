obj =
	verts:
		0: x: 0,   y: 0, z: 0.85
		1: x: 305, y: 0, z: 0.85
		2: x:0,    y: 0, z: 1.15
		3: x:305,  y: 0, z: 1.15

		4: x: 150, y: 0, z: 0.97
		5: x: 250, y: 0, z: 0.97
		6: x: 150, y: 0, z: 1.03
		7: x: 250, y: 0, z: 1.03

		u0: x: 0,   y: 0, z: 0.3
		u1: x: 300, y: 0, z: 0.3

		8:  x: 300, y: 0, z: 0.85
		
		11: x: 140, y: 0, z: 0.83
		12: x: 160, y: 0, z: 0.83
		13: x: 160, y: 0, z: 0.73
		14: x: 140, y: 0, z: 0.73
		
		15: x: 140, y: 0, z: 0.61
		16: x: 160, y: 0, z: 0.61
		17: x: 160, y: 0, z: 0.51
		18: x: 140, y: 0, z: 0.51

		19: x: 140, y: 0, z: 0.41
		20: x: 160, y: 0, z: 0.41
		21: x: 160, y: 0, z: 0.34
		22: x: 140, y: 0, z: 0.34

		r1: x: 0,   y: 0, z: 1
		r2: x: 300, y: 0, z: 1
		r3: x: 600, y: 0, z: 1
		r4: x: 900, y: 0, z: 1
	parts:
		asfalt:
			hide: true
			faces: [
				{draw: 'f', fill: '#404040',verts:[0,2,3,1]}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:[0,1]}
				{draw: 'f', fill: '#ffffff', verts:[4,5,7,6]}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:[2,3]}
			]

		asfaltUp:
			hide: true
			faces: [
				{draw: 'f', fill: '#404040',verts:['u0',2,3,1,8,'u1']}
				# {draw: 's', stroke: '#000', lineWidth: 2, verts:['u0','u1']}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:['u0',0]}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:['u1',8]}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:[8,1]}
				{draw: 'f', fill: '#ffffff', verts:[11,12,13,14]}
				{draw: 'f', fill: '#ffffff', verts:[15,16,17,18]}
				{draw: 'f', fill: '#ffffff', verts:[19,20,21,22]}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:[2,3]}
			]

		road:
			faces: [
				{type: "part", part: "asfalt", vert: "r1"}
				{type: "part", part: "asfalt", vert: "r2"}
				{type: "part", part: "asfalt", vert: "r3"}
				{type: "part", part: "asfalt", vert: "r4"}
			]
