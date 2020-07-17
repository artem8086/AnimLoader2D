module.exports =
	vRotateZ: (v, angle) ->
		angle = angle * Math.PI / 180
		cosA = Math.cos angle
		sinA = Math.sin angle
		y = v.y
		z = v.z
		v.y = y * cosA + z * sinA
		v.z = z * cosA - y * sinA

	vAdd: (v1, v2) ->
		v1.x += v2.x
		v1.y += v2.y
		v1.z += v2.z
		v1