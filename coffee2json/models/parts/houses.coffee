obj =
	verts:
		0:  x: 0,    y: 0,    z: 1.15
		1:  x: 0,    y: -652, z: 1.15
		2:  x: 490,  y: -652, z: 1.15
		3:  x: 490,  y: 0,    z: 1.15
		4:  x: 290,  y: 0,    z: 1.15
		5:  x: 290,  y: -232, z: 1.15
		6:  x: 200,  y: -232, z: 1.15
		7:  x: 200,  y: 0,    z: 1.15

		8:  x: 0,    y: -652, z: 1.17
		9:  x: 245,  y: -897, z: 1

		10: x: 490,  y: -652, z: 1.17

		11: x: 0,    y: 0,    z: 0.85
		12: x: 0,    y: -652, z: 0.85
		13: x: 490,  y: -652, z: 0.85
		14: x: 490,  y: 0,    z: 0.85
		
		15: x: 310,  y: 0,    z: 1.15
		16: x: 310,  y: -500, z: 1.15
		17: x: 180,  y: -500, z: 1.15
		18: x: 180,  y: 0,    z: 1.15
		
		19: x: 310,  y: -370, z: 1.15
		20: x: 180,  y: -370, z: 1.15

		21: x: 82,   y: -734, z: 1.02
		22: x: 82,   y: -860, z: 1.02
		23: x: 132,  y: -860, z: 1.02
		24: x: 132,  y: -784, z: 1.02

		25: x: 82,   y: -734, z: 0.98
		26: x: 82,   y: -860, z: 0.98
		27: x: 132,  y: -860, z: 0.98
		28: x: 132,  y: -784, z: 0.98
	parts:
		house1:
			faces: [
				{draw: 'f', fill: 'rgb(109,4,20)', verts:[8,9,12]} # left roof
				{draw: 's', stroke: '#000', verts:[9,12]}

				{draw: 'f', fill: '#000', verts:[26,25,28,27]} # truba back
				{draw: 's', stroke: '#000', verts:[22,26]}
				{draw: 's', stroke: '#000', verts:[23,27]}

				{draw:'f', fill: '#7f7f7f', verts:[25,21,22,26]}
				{draw:'f', fill: '#7f7f7f', verts:[27,23,24,28]}
				{draw:'f', fill: '#7f7f7f', verts:[22,21,24,23]}
				{draw: 's', stroke: '#000', verts:[21,22,23,24], noClose: true}

				{draw: 'f', fill: 'rgb(109,4,20)', verts:[9,10,13]} # right roof
				{draw: 's', stroke: '#000', verts:[9,13]}

				{draw: 'f', fill: 'rgb(100,230,100)', verts:[1,0,11,12]} # left wall
				{draw: 's', stroke: '#000', verts:[0,11]}
				{draw: 's', stroke: '#000', verts:[8,12]}

				{draw: 'f', fill: 'rgb(100,230,100)', verts:[14,3,2,13]} # right wall
				{draw: 's', stroke: '#000', verts:[10,13]}
				{draw: 's', stroke: '#000', verts:[3,14]}

				{draw: 'f', fill: 'rgb(100,250,100)', verts:[0,1,2,3]} # front wall
				{draw: 's', stroke: '#000', verts:[0,3]}

				{stroke: '#000', fill: 'rgb(199,131,34)', verts:[4,5,6,7]} # door

				{stroke: '#000', fill: 'rgb(32,32,255)', verts:[20,17,16,19]} # window

				{draw: 'f', fill: 'rgb(109,4,20)', verts:[1,8,10,2]} # roof
				{stroke: '#000', fill: 'rgb(109,4,20)', verts:[8,9,10]} # roof

			]

for k, v of obj.verts
	v.x -= 245