var lineWidth = 5;
var curMarkIndex = 0;
var marksArr = ['line-house-rev.svg', 'line-investing.svg'];
var markPosArr = [
    { x: .2, y: .25 },
    { x: .6, y: .25 }
]
var markWidth = 0;
var controlVariance = 150;

var firstCoord = { x: 0, y: 0 }
var lastCoord = { x: 0, y: 0 }

var storyMarksArr = [];

$(function () {
    drawMark();
});

function drawConnector() {
    var two = new Two({
        type: Two.Types['svg'],
        fullscreen: true,
        autostart: true
    }).appendTo(document.body);

    firstCoord = storyMarksArr[curMarkIndex + 1].firstCoord;
    lastCoord = storyMarksArr[curMarkIndex].lastCoord;

    var line = new Two.Vector(), randomness = 0;
    var control1X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * .333));
    var control1Y = Math.min(firstCoord.y, lastCoord.y) + (Math.abs((firstCoord.y - lastCoord.y) * .333)) + controlVariance;
    var controlPoint1 = new Two.Vector(control1X, control1Y);

    var control2X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * .888));
    var control2Y = Math.min(firstCoord.y, lastCoord.y) + (Math.abs((firstCoord.y - lastCoord.y) * .666)) - controlVariance;
    var controlPoint2 = new Two.Vector(control2X, control2Y);

    line = two.makeCurve([new Two.Vector(lastCoord.x, lastCoord.y), controlPoint1, controlPoint2, new Two.Vector(firstCoord.x, firstCoord.y)], true);
    line.noFill().stroke = 'white';
    line.linewidth = lineWidth;
    line.cap = 'round';
    var firstVertex = line.vertices[0];
    line.subdivide();
    line.vertices[0] = firstVertex;
    line.total = calculateDistance(line);

    const animTime = 10 / line.total;

    function calculateDistance(line) {
        var d = 0,
            a;
        _.each(line.vertices, function (b, i) {
            if (i > 0) {
                d += a.distanceTo(b);
            }
            a = b;
        });
        return d;
    }
    var t = 0;
    two.bind('update', function () {
        if (t < 0.9999) {
            t += animTime; //MH - should be dynamic
            var traversed = t * line.total;
            var pct = map(traversed, 0, line.total, 0, 1);
            line.ending = pct;
        } else {
            two.pause();
            two.unbind('update');
            curMarkIndex++;
            storyMarksArr[curMarkIndex].instance.play();
        }
    });

}

function drawMark() {
    $.get(`../images/${marksArr[curMarkIndex]}`, function (doc) {
        var two = new Two({
            type: Two.Types['svg'],
            fullscreen: true
        }).appendTo(document.body);
        markWidth = two.width / marksArr.length;
        var storyMark = two.interpret($(doc).find('svg')[0]);
        storyMark.subdivide();
        storyMark.noFill();
        var t = 0;
        var startOver,
            movingmouse = false;
        var clearT = function () {
            t = 0;
            setEnding(storyMark, 0);
            startOver = _.after(60, clearT);
        };
        storyMark.distances = calculateDistances(storyMark);
        storyMark.total = 0;
        storyMark.stroke = 'white';
        storyMark.linewidth = lineWidth;
        storyMark.cap = 'round';
        _.each(storyMark.distances, function (d) {
            storyMark.total += d;
        });

        const animTime = 10 / storyMark.total;

        clearT();
        resize();

        var firstChild = storyMark.children[0];
        var firstVertex = firstChild.vertices[0];
        var thisFirstCoord = {};
        thisFirstCoord.x = storyMark.translation.x + firstChild.translation.x + firstVertex.x;
        thisFirstCoord.y = storyMark.translation.y + firstChild.translation.y + firstVertex.y;

        var lastChildIndex = storyMark.children.length - 1;
        var lastChild = storyMark.children[lastChildIndex];
        var lastVertexIndex = lastChild.vertices.length - 1;
        var lastVertex = lastChild.vertices[lastVertexIndex];
        var thisLastCoord = {};
        thisLastCoord.x = storyMark.translation.x + lastChild.translation.x + lastVertex.x;
        thisLastCoord.y = storyMark.translation.y + lastChild.translation.y + lastVertex.y;

        two
            .bind('resize', resize)
            .bind('update', function () {
                if (t < 0.9999) {
                    t += animTime;
                    setEnding(storyMark, t);
                } else {
                    if (curMarkIndex < marksArr.length - 1) {
                        drawConnector();
                    }

                    two.pause();
                    two.unbind('update');
                }
            });
        storyMarksArr.push({
            instance: two,
            firstCoord: thisFirstCoord,
            lastCoord: thisLastCoord,
        });
        if (curMarkIndex < marksArr.length - 1) {
            curMarkIndex++;
            drawMark();
        } else { //all marks drawn, play the first
            curMarkIndex = 0;
            storyMarksArr[curMarkIndex].instance.play();
        }
        //two.play();

        function resize() {
            storyMark.translation.set(markPosArr[curMarkIndex].x * two.width, markPosArr[curMarkIndex].y * two.height);
        }

        function setEnding(group, t, last = false) {
            var i = 0;
            var traversed = t * group.total;
            var current = 0;

            _.each(group.children, function (child, j) {
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
}

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
