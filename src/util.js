'use strict';

/**
 * Returns whether the given coord is within the area provided
 *
 * @param coord
 * @param area
 * @returns {boolean}
 */
export function isCoordWithinArea (coord, area) {
    if (
        (coord.x > area.left) && (coord.x < area.right) &&
        (coord.y > area.top) && (coord.y < area.bottom)
    ) {
        return true;
    }
    return false;
}

/**
 * Allows mouse events to be attached to a container element, but restricts offsetX and offsetY to within the given element
 *
 * I.e. if a mouse event occurs outside the given elem, the returned coord will be reduced to the edges of the given elem
 *
 * @param elem
 * @param event
 * @returns {{x: *, y: *}}
 */
export function normaliseMouseEventToElement (elem, event) {
    let x = null,
        y = null;

    if (event.srcElement === elem) {
        x = event.offsetX;
        y = event.offsetY;
    } else { //We are dragging outside the element
        if (event.pageX < elem.offsetLeft) {
            x = 0;
        } else if (event.pageX > (elem.offsetLeft + elem.width)) {
            x = elem.width;
        } else {
            x = event.pageX - elem.offsetLeft;
        }

        if (event.pageY < elem.offsetTop) {
            y = 0;
        } else if (event.pageY > (elem.offsetTop + elem.height)) {
            y = elem.height;
        } else {
            y = event.pageY - elem.offsetTop;
        }
    }

    return {x, y};
}

/**
 * Parses a given aspect ratio to a float, representing the ratio between width and height
 *
 * @param aspectRatio
 * @returns {number}
 */
export function parseAspectRatio (aspectRatio) {
    let [x, y] = aspectRatio.split(':').map(function (aspect) {
        return parseInt(aspect, 10);
    });
    return (y / x);
}

/**
 * Multiply image crop data by a scale factor, to transpose the information onto the actual full sized image
 *
 * @param selectionData
 * @param scaleFactor
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function computeActualSizes (selectionData, scaleFactor) {
    return {
        x: selectionData.left * scaleFactor,
        y: selectionData.top * scaleFactor,
        width: selectionData.width * scaleFactor,
        height: selectionData.height * scaleFactor
    };
}