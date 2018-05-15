var lineWidth = 10;

function getFieldBounds(canvasWidth) {
    var screensize = window.innerWidth;
    var left, right;
    left = (screensize / 2) - (canvasWidth / 2);
    right = left + canvasWidth;
    return { "left": left, "right": right }
}

$(function () {
    var bounds = getFieldBounds($(window).width());
    console.log(bounds);
    var width = $(window).width();
    var two = new Two({
        type: Two.Types['svg'],
        fullscreen: true,
        autostart: true
    }).appendTo(document.body);

    var x, y, line, mouse = new Two.Vector(), randomness = 0;

    var drag = function (e) {
        x = e.clientX;
        y = e.clientY;
        if (!line) {
            console.log(x);
            if (x > bounds.left && x < bounds.right) {
                var v1 = makePoint(mouse);
                var v2 = makePoint(x, y);
                var circle = two.makeCircle(x, y, lineWidth/2);
                circle.noStroke();
                line = two.makeCurve([v1, v2], true);
                line.noFill().stroke = 'white';
                line.linewidth = lineWidth;
                _.each(line.vertices, function (v) {
                    v.addSelf(line.translation);
                });
                line.translation.clear();
            }
        } else {
            if (x > bounds.left && x < bounds.right) {
                var v1 = makePoint(x, y);
                line.vertices.push(v1);
            }
        }
        mouse.set(x, y);
    };

    var dragEnd = function (e) {
        x = e.clientX;
        y = e.clientY;
        var circle = two.makeCircle(x, y, lineWidth/2);
        circle.noStroke();
        $(window)
            .unbind('mousemove', drag)
            .unbind('mouseup', dragEnd);
    };

    var touchDrag = function (e) {
        e.preventDefault();
        var touch = e.originalEvent.changedTouches[0];
        drag({
            clientX: touch.pageX,
            clientY: touch.pageY
        });
        return false;
    };

    var touchEnd = function (e) {
        e.preventDefault();
        $(window)
            .unbind('touchmove', touchDrag)
            .unbind('touchend', touchEnd);
        return false;
    };

    $(window)
        .bind('mousedown', function (e) {
            mouse.set(e.clientX, e.clientY);
            line = null;
            $(window)
                .bind('mousemove', drag)
                .bind('mouseup', dragEnd);
        })
        .bind('touchstart', function (e) {
            e.preventDefault();
            var touch = e.originalEvent.changedTouches[0];
            mouse.set(touch.pageX, touch.pageY);
            line = null;
            $(window)
                .bind('touchmove', touchDrag)
                .bind('touchend', touchEnd);
            return false;
        })
        .bind('keydown', function (e) {
            e.preventDefault();
            if (e.key === 'Escape') {
                two.clear();
            }
        });

    two.bind('update', function (frameCount, timeDelta) {
        _.each(two.scene.children, function (child) {
            _.each(child.vertices, function (v) {
                if (!v.position) {
                    return;
                }
                v.x = v.position.x + (Math.random() * randomness - randomness / 2);
                v.y = v.position.y + (Math.random() * randomness - randomness / 2);
            });
        });
    });

    function makePoint(x, y) {

        if (arguments.length <= 1) {
            y = x.y;
            x = x.x;
        }

        var v = new Two.Vector(x, y);
        v.position = new Two.Vector().copy(v);

        return v;

    }

});


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
