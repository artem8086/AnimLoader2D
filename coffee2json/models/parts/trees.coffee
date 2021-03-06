obj =
	verts:
		r0: x:  -26, y: 0,    z: 1
		r1: x: -26,  y: -100, z: 1
		r2: x: 26,   y: 0,    z: 1
		r3: x: 26,   y: -100, z: 1

		e0: x: -26,  y: -11,  z: 1
		e1: x: 26,   y: 9,    z: 1

		tp0: x: 0,  y: 10,    z: 1
		tp1: x: 0,  y: -70,   z: 1
		tp2: x: 0,  y: -160,  z: 1
		tp3: x: 0,  y: -250,  z: 1
		
		t0: x: -110, y: 0,    z: 1
		t1: x: 110,  y: 0,    z: 1
		t2: x: 0,    y: -160, z: 1
		t3: x: -50,  y: 0,    z: 1
		t4: x: 70,   y: 0,    z: 1
		t5: x: 20,   y: 10,   z: 1.035

		t1_0: x: -90, y: 0,    z: 0
		t1_1: x: 90,  y: 0,    z: 0
		t1_2: x: 0,   y: -140, z: 0
		t1_3: x: -35, y: 0,    z: 0
		t1_4: x: 45,  y: 0,    z: 0
		t1_5: x: 20,  y: 8,    z: 1.030

		t2_0: x: -65, y: 0,    z: 0
		t2_1: x: 65,  y: 0,    z: 0
		t2_2: x: 0,   y: -120, z: 0
		t2_3: x: -25, y: 0,    z: 0
		t2_4: x: 35,  y: 0,    z: 0
		t2_5: x: 20,  y: 6,    z: 1.025
	parts:
		root:
			hide: true
			faces: [
				{type: 'elipse', fill: '#956100', stroke: '#000', vert1: 'e0', vert2: 'e1', endAngle: 180, clockwise: true, noClose: true}
				{draw: 'f', fill: '#956100',verts:['r0','r1','r3','r2']}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:['r0','r1']}
				{draw: 's', stroke: '#000', lineWidth: 2, verts:['r2','r3']}
				# {draw: 'f', fill: '#ffffff', verts:[4,5,7,6]}
				# {draw: 's', stroke: '#000', lineWidth: 2, verts:[2,3]}
			]

		top0:
			hide: true
			faces: [
				{stroke: '#000', fill: '#28e028', verts:['t3', 't0', 't2'], noClose: true}
				{stroke: '#000', fill: '#28e028', verts:['t4', 't1', 't2'], noClose: true}
				{draw: 'f', fill: '#11ff11', verts:['t4', 't5', 't2']}
				{draw: 'f', fill: '#22ee22', verts:['t3', 't5', 't2']}
				{draw: 's', stroke: '#000', verts:['t3', 't5', 't4'], noClose: true}

			]

		top1:
			hide: true
			faces: [
				{stroke: '#000', fill: '#28e028', verts:['t1_3', 't1_0', 't1_2'], noClose: true}
				{stroke: '#000', fill: '#28e028', verts:['t1_4', 't1_1', 't1_2'], noClose: true}
				{draw: 'f', fill: '#11ff11', verts:['t1_4', 't1_5', 't1_2']}
				{draw: 'f', fill: '#22ee22', verts:['t1_3', 't1_5', 't1_2']}
				{draw: 's', stroke: '#000', verts:['t1_3', 't1_5', 't1_4'], noClose: true}
			]

		top2:
			hide: true
			faces: [
				{stroke: '#000', fill: '#28e028', verts:['t2_3', 't2_0', 't2_2'], noClose: true}
				{stroke: '#000', fill: '#28e028', verts:['t2_4', 't2_1', 't2_2'], noClose: true}
				{draw: 'f', fill: '#11ff11', verts:['t2_4', 't2_5', 't2_2']}
				{draw: 'f', fill: '#22ee22', verts:['t2_3', 't2_5', 't2_2']}
				{draw: 's', stroke: '#000', verts:['t2_3', 't2_5', 't2_4'], noClose: true}
			]

		tree1:
			faces: [
				{type: 'part', part: 'root', vert: 'tp0'}
				{type: 'part', part: 'top0', vert: 'tp1'}
				{type: 'part', part: 'top1', vert: 'tp2'}
				{type: 'part', part: 'top2', vert: 'tp3'}
			]
