obj =
	stand:
		duration: 1
		frames:
			"@body": [
				{
					start: 0
					end: 0.4
					func: "quad"
					to: origY: -62
				}, {
					start: 0.4
					end: 0.8
					func: "quadEaseOut"
					to: origY: -66
				}
			]
			"@leg_l": [
				{
					start: 0
					end: 0.4
					func: "quad"
					to: origY: 41
				}, {
					start: 0.4
					end: 0.8
					func: "quadEaseOut"
					to: origY: 45
				}
			]
			"@leg_r": [
				{
					start: 0
					end: 0.4
					func: "quad"
					to: origY: 41
				}, {
					start: 0.4
					end: 0.8
					func: "quadEaseOut"
					to: origY: 45
				}
			]
	run:
		duration: 1
		frames:
			"@body": [
				{
					start: 0
					end: 0.5
					func: "quadEaseOut"
					to:
						angle: 2
						origY: -70
				}, {
					start: 0.5
					end: 1
					func: "quad"
					to:
						angle: 0
						origY: -66
				}
			]
			"@tail": [
				{
					start: 0
					end: 0.5
					func: "quadEaseOut"
					to:	angle: -16
				}, {
					start: 0.5
					end: 1
					func: "quad"
					to: angle: 0
				}
			]
			"@hand_l": [
				{
					start: 0
					end: 0.25
					func: "quad"
					to: angle: -30
				}, {
					start: 0.25
					end: 0.75
					func: "quad"
					to: angle: 30
				}, {
					start: 0.75
					end: 1
					func: "quad"
					to: angle: 0
				}
			]
			"@hand_r": [
				{
					start: 0
					end: 0.25
					func: "quad"
					to: angle: 26
				}, {
					start: 0.25
					end: 0.75
					func: "quad"
					to: angle: -26
				}, {
					start: 0.75
					end: 1
					func: "quad"
					to: angle: 0
				}
			]
			"@leg_l": [
				{
					start: 0
					end: 0.25
					to: angle: 20
				}, {
					start: 0.25
					end: 0.75
					to: angle: -20
				}, {
					start: 0.75
					end: 1
					to: angle: 0
				}
			]
			"@leg_r": [
				{
					start: 0
					end: 0.25
					to: angle: 20
				}, {
					start: 0.25
					end: 0.75
					to: angle: -20
				}, {
					start: 0.75
					end: 1
					to: angle: 0
				}
			]
	attack:
		duration: 1.5
		frames:
			"@hand_r": [
				{
					start: 0
					end: 0.7
					func: "quad"
					to: angle: 40
				}
				{
					start: 0.7
					end: 1.2
					func: "quadEaseOut"
					to:
						angle: -90
						y: 10
				}
				{
					start: 1.2
					end: 1.5
					func: "quad"
					to:
						angle: 0
						y: -10
				}
			]
			"@hand_l": [
				{
					start: 0
					end: 0.7
					func: "quad"
					to: angle: 10
				}
				{
					start: 0.7
					end: 1.2
					func: "quadEaseOut"
					to: angle: -60
				}
				{
					start: 1.2
					end: 1.5
					func: "quad"
					to: angle: 0
				}
			]
			"@weapon_node": [
				{
					start: 0
					end: 0.7
					func: "quad"
					to: origY: 6
				}
				{
					start: 0.7
					end: 1.2
					func: "quadEaseOut"
					to:
						origY: 28
						angle: 8
				}
				{
					start: 1.2
					end: 1.5
					func: "quad"
					to:
						origY: 0
						angle: 0
				}
			]