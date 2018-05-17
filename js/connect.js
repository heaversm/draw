var lineWidth = 5;
var curMarkIndex = 0;
var marksArr = ['line-house-rev.svg', 'line-investing.svg'];
var markPosArr = [
    { x: .2, y: .25 },
    { x: .6, y: .25 }
]
var drawingsArr = [];
var markWidth = 0;
var controlVariance = 150;

var firstCoord = { x: 0, y: 0 }
var lastCoord = { x: 0, y: 0 }

var connector = null;
var connectorLine = null;

$(function () {
    drawMark();
});

function drawConnector() {
    var two = new Two({
        type: Two.Types['svg'],
        fullscreen: true,
        autostart: true
    }).appendTo(document.body);

    var line = new Two.Vector(), randomness = 0;
    var control1X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * .333));
    var control1Y = Math.min(firstCoord.y, lastCoord.y) + (Math.abs((firstCoord.y - lastCoord.y) * .333)) + controlVariance;
    var controlPoint1 = new Two.Vector(control1X, control1Y);

    var control2X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * .888));
    var control2Y = Math.min(firstCoord.y, lastCoord.y) + (Math.abs((firstCoord.y - lastCoord.y) * .666)) - controlVariance;
    var controlPoint2 = new Two.Vector(control2X, control2Y);

    //console.log(firstCoord, lastCoord, controlPoint1);

    line = two.makeCurve([new Two.Vector(lastCoord.x, lastCoord.y), controlPoint1, controlPoint2, new Two.Vector(firstCoord.x, firstCoord.y)], true);
    line.noFill().stroke = 'white';
    line.linewidth = lineWidth;
    line.cap = 'round';
    var firstVertex = line.vertices[0];
    line.subdivide();
    line.vertices[0] = firstVertex;
    line.total = calculateDistance(line);
    connector = two;
    connectorLine = line;

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
    //console.log(line.total);
    var t = 0;
    two.bind('update', function () {
        if (t < 0.9999) {
            t += 0.00625;
            var traversed = t * line.total;
            //var pct = cmap(traversed, 0, line.total, 0, 1);
            var pct = map(traversed, 0, line.total, 0, 1);
            //console.log(pct);
            line.ending = pct;
        } else {
            two.pause();
            two.unbind('update');
        }
    });

}

function drawMark() {
    $.get(`../images/${marksArr[curMarkIndex]}`, function (doc) {
        console.log(doc);
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
        //storyMark.center().translation.set(curMarkIndex*markWidth, two.height / 2);
        storyMark.distances = calculateDistances(storyMark);
        storyMark.total = 0;
        storyMark.stroke = 'white';
        storyMark.linewidth = lineWidth;
        storyMark.cap = 'round';
        _.each(storyMark.distances, function (d) {
            storyMark.total += d;
        });

        clearT();
        resize();
        two
            .bind('resize', resize)
            .bind('update', function () {
                if (t < 0.9999) {
                    if (t === 0) {

                        if (curMarkIndex > 0) {
                            var firstChild = storyMark.children[0];
                            var firstVertex = firstChild.vertices[0];
                            firstCoord.x = storyMark.translation.x + firstChild.translation.x + firstVertex.x;
                            firstCoord.y = storyMark.translation.y + firstChild.translation.y + firstVertex.y;
                            drawConnector();
                        }

                    }
                    t += 0.00625;
                    setEnding(storyMark, t);
                } else {
                    if (curMarkIndex < marksArr.length - 1) {
                        var lastChildIndex = storyMark.children.length - 1;
                        var lastChild = storyMark.children[lastChildIndex];
                        var lastVertexIndex = lastChild.vertices.length - 1;
                        var lastVertex = lastChild.vertices[lastVertexIndex];
                        lastCoord.x = storyMark.translation.x + lastChild.translation.x + lastVertex.x;

                        lastCoord.y = storyMark.translation.y + lastChild.translation.y + lastVertex.y;
                        //console.log(storyMark,lastChild,lastVertex);
                    }

                    two.pause();
                    two.unbind('update');
                    if (curMarkIndex < marksArr.length - 1) {
                        curMarkIndex++;
                        drawMark();
                    } else {
                        curMarkIndex = 0;
                        //startOver
                    }
                }
            })
            .play();

        function resize() {
            //var markWidth = storyMark.getBoundingClientRect().width;
            //var markHeight = storyMark.getBoundingClientRect.height;
            //console.log(storyMark.getBoundingClientRect());
            //var markPos = (two.width * ((curMarkIndex + 1) / marksArr.length))-markWidth;
            //storyMark.translation.set(markPos, two.height / 2);
            storyMark.translation.set(markPosArr[curMarkIndex].x * two.width, markPosArr[curMarkIndex].y * two.height);
        }

        function setEnding(group, t, last = false) {
            var i = 0;
            var traversed = t * group.total;
            var current = 0;

            _.each(group.children, function (child, j) {
                //console.log(child);
                var distance = group.distances[i];
                var min = current;
                var max = current + distance;
                var pct = cmap(traversed, min, max, 0, 1);
                //console.log(pct);
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
