'use strict';

import { isCoordWithinArea } from './util';
import ResizeHandle from './ResizeHandle';
import EventEmitter from 'event-emitter-mixin';

@EventEmitter
export default class ResizeHandles {
    constructor (canvas, {
            width,
            offset
        } = {}) {
        this.canvas = canvas;
        this.handles = {};

        ['nw', 'ne', 'sw', 'se'].forEach((corner) => {
            this.handles[corner] = new ResizeHandle(this.canvas, corner, {width, offset});
        });
    }

    /**
     * Determine handle at coordinate, may be undefined if none
     *
     * @param coord
     * @returns {ResizeHandle|undefined}
     */
    findHandleAtCoord (coord) {
        return this.toArray().find(handle => handle.isCoordWithinBounds(coord));
    }

    /**
     * Get a ResizeHandle by it's corner
     *
     * @param corner
     * @returns {ResizeHandle}
     */
    getHandleAtCorner(corner) {
        return this.handles[corner];
    }

    /**
     * Draws each of the handles at the relevant bound corner
     *
     * @param bounds
     */
    drawHandles (bounds) {
        this.handles.nw.draw({x: bounds.left,  y: bounds.top});
        this.handles.ne.draw({x: bounds.right, y: bounds.top});
        this.handles.sw.draw({x: bounds.left,  y: bounds.bottom});
        this.handles.se.draw({x: bounds.right, y: bounds.bottom});
    }

    /**
     * Set the offset on each resize handle
     * 0 is inside selection, negative half the handles width would be on the corner of the select tool
     *
     * @param offset
     */
    setOffset (offset) {
        this.toArray().forEach((handle) => {
            handle.setOffset(offset);
        });
    }

    /**
     * Set the width of the resize handle
     *
     * @param width
     */
    setWidth (width) {
        this.toArray().forEach((handle) => {
            handle.setWidth(width);
        });
    }

    toArray () {
        return [
            this.handles.nw,
            this.handles.ne,
            this.handles.sw,
            this.handles.se
        ];
    }
}