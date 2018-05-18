const lineWidth = 5; //width of line to draw
const slopeVertexDifferential = 5; //number of points between which to calculate the beginning or ending slope of a line
var markWidth = 365;
var markHeight = 418;
var markSpacing = 20;
var curMarkIndex = 0;
var marksArr = ['line-house-rev.svg', 'line-loan.svg','line-investing.svg'];
var storyMarksArr = [];
var $marksHolder = document.getElementById('marksHolder');

markScale = window.innerWidth / (markWidth * marksArr.length);
console.log(markScale);
markPosY = (window.innerHeight / 2) - (markHeight / 2);


$(function () {
    drawMark();
});

function drawConnector() {
    var two = new Two({
        type: Two.Types['svg'],
        fullscreen: true,
        autostart: true
    }).appendTo($marksHolder);

    var firstCoord = storyMarksArr[curMarkIndex + 1].firstCoord;
    var lastCoord = storyMarksArr[curMarkIndex].lastCoord;

    var lastSlope = storyMarksArr[curMarkIndex].lastSlope;
    var firstSlope = storyMarksArr[curMarkIndex + 1].firstSlope;

    var line = new Two.Vector(), randomness = 0;
    var control1Percent = map(lastSlope, .1, 10, .111, .333);
    var control1X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * control1Percent));

    var control1Y = (lastSlope * (control1X - lastCoord.x)) + lastCoord.y;

    var controlPoint1 = new Two.Vector(control1X, control1Y);
    var control2Percent = map(firstSlope, .1, 10, .666, .999);
    var control2X = Math.min(firstCoord.x, lastCoord.x) + (Math.abs((firstCoord.x - lastCoord.x) * control2Percent));

    var control2Y = firstCoord.y - (firstSlope * (firstCoord.x - control2X));
    var controlPoint2 = new Two.Vector(control2X, control2Y);

    line = two.makeCurve([new Two.Vector(lastCoord.x, lastCoord.y), controlPoint1, controlPoint2, new Two.Vector(firstCoord.x, firstCoord.y)], true);
    line.noFill().stroke = 'white';
    line.linewidth = lineWidth;
    line.cap = 'round';
    var firstVertex = line.vertices[0];
    line.subdivide();
    line.vertices[0] = firstVertex;
    line.total = calculateDistance(line);

    const animTime = 10 / line.total; //amount of time in ms to wait between each update call

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
        }).appendTo($marksHolder);
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
        var markPosX = (curMarkIndex * markWidth) + (curMarkIndex > 0 ? markSpacing : 0);
        storyMark.translation.set(markPosX, markPosY);

        var firstChild = storyMark.children[0];
        var firstVertex = firstChild.vertices[0];
        var thisFirstCoord = {};
        thisFirstCoord.x = storyMark.translation.x + firstChild.translation.x + firstVertex.x;
        thisFirstCoord.y = storyMark.translation.y + firstChild.translation.y + firstVertex.y;

        var firstSlope = (firstChild.vertices[5].y - firstChild.vertices[0].y) / (firstChild.vertices[5].x - firstChild.vertices[0].x);

        var lastChildIndex = storyMark.children.length - 1;
        var lastChild = storyMark.children[lastChildIndex];
        var lastVertexIndex = lastChild.vertices.length - 1;
        var lastVertex = lastChild.vertices[lastVertexIndex];
        var thisLastCoord = {};
        thisLastCoord.x = storyMark.translation.x + lastChild.translation.x + lastVertex.x;
        thisLastCoord.y = storyMark.translation.y + lastChild.translation.y + lastVertex.y;

        var lastSlope = (lastChild.vertices[lastVertexIndex].y - lastChild.vertices[lastVertexIndex - 5].y) / (lastChild.vertices[lastVertexIndex].x - lastChild.vertices[lastVertexIndex - 5].x);

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
            firstSlope: firstSlope,
            lastSlope: lastSlope,
            width: storyMark.getBoundingClientRect().width,
        });
        if (curMarkIndex < marksArr.length - 1) {
            curMarkIndex++;
            drawMark();
        } else { //all marks drawn, play the first
            curMarkIndex = 0;

            storyMarksArr[curMarkIndex].instance.play();
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
    return _.map(group.children, function (child) {
        var d = 0,
            a;
        _.each(child.vertices, function (b, i) {
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
