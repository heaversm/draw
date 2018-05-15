var lineWidth = 5;

$(function () {
	var two = new Two({
		type: Two.Types['svg'],
		fullscreen: true
	}).appendTo(document.body);
	$.get('../images/line-house.svg', function(doc) {
		var fresh = two.interpret($(doc).find('svg')[0]);
		fresh.subdivide();
		fresh.noFill();
		var t = 0;
		var startOver,
			movingmouse = false;
		var clearT = function() {
			t = 0;
			setEnding(fresh, 0);
			startOver = _.after(60, clearT);
		};
		fresh.center().translation.set(two.width / 2, two.height / 2);
		fresh.distances = calculateDistances(fresh);
		fresh.total = 0;
		fresh.stroke = 'white';
		fresh.linewidth = lineWidth;
		_.each(fresh.distances, function(d) {
			fresh.total += d;
		});

		clearT();

		resize();
		two
			.bind('resize', resize)
            .bind('update', function () {
                fresh.lineWidth = getRandomInt(3, 50);
                //lineWidth = getRandomInt(3, 5);
                //console.log(lineWidth);
				if (t < 0.9999) {
					t += 0.00625;
				} else {
					startOver();
				}

				setEnding(fresh, t);
			})
			.play();

		function resize() {
			fresh.translation.set(two.width / 2, two.height / 2);
		}

		function setEnding(group, t) {
			var i = 0;
			var traversed = t * group.total;
			var current = 0;

			_.each(group.children, function(child) {
				var distance = group.distances[i];
				var min = current;
				var max = current + distance;
				var pct = cmap(traversed, min, max, 0, 1);
				child.ending = pct;
				current = max;
				i++;
			});
		}
	});
});

function calculateDistances(group) {
	return _.map(group.children, function(child) {
		var d = 0,
			a;
		_.each(child.vertices, function(b, i) {
			if (i > 0) {
				d += a.distanceTo(b);
			}
			a = b;
		});
		return d;
	});
}

function clamp(v, min, max) {
	return Math.max(Math.min(v, max), min);
}

function map(v, i1, i2, o1, o2) {
	return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

function cmap(v, i1, i2, o1, o2) {
	return clamp(map(v, i1, i2, o1, o2), o1, o2);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
