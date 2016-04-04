'use strict';

import { isCoordWithinArea } from './util';

export default class ResizeHandle {
    constructor (canvas, corner, {
            width = 16,
            offset = 0
        } = {}) {
        this.canvas = canvas;
        this.corner = corner;

        this.setWidth(width);
        this.setOffset(offset);
    }

    setWidth (width) {
        this.width = width;
    }

    setOffset (offset) {
        this.offset = offset;
    }

    /**
     * Returns the top, bottom, left and right limits of the current handle
     *
     * @returns {{top: *, left: *, bottom: *, right: *}}
     */
    getBounds () {
        let bounds = {},
            offset = this.offset,
            width = this.width;

        if (this.corner.charAt(0) === 'n') {
            bounds.top = this.coord.y + offset;
            bounds.bottom = this.coord.y + width + offset;
        } else {
            bounds.top = this.coord.y - width - offset;
            bounds.bottom = this.coord.y - offset;
        }

        if (this.corner.charAt(1) === 'w') {
            bounds.left = this.coord.x + offset;
            bounds.right = this.coord.x + width + offset;
        } else {
            bounds.left = this.coord.x - width - offset;
            bounds.right = this.coord.x - offset;
        }

        return bounds;
    }

    /**
     * Is a given coordinate within the current handle?
     *
     * @param coord
     * @returns {boolean}
     */
    isCoordWithinBounds (coord) {
        let bounds = this.getBounds();
        return isCoordWithinArea(coord, bounds);
    }

    /**
     * Work out what our mouse cursor should be, depending on which handle this is
     *
     * @param coord
     */
    getMouseCursor () {
        let map = {
            nw: 'nwse',
            ne: 'nesw',
            sw: 'nesw',
            se: 'nwse'
        };
        return map[this.corner] + '-resize';
    }

    /**
     * Draws the current handle. Override this function
     */
    draw (coord) {
        this.coord = coord;
        let bounds = this.getBounds(),
            ctx = this.canvas.getContext(),
            width = this.width,
            height = width,
            corner = this.corner;

        this.canvas.publish('draw-handle', ctx, {corner, width, height, ...bounds});
    }
}