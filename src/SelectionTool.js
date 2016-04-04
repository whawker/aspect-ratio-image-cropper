'use strict';

import ResizeHandles from './ResizeHandles';
import { isCoordWithinArea, parseAspectRatio } from './util';

export default class SelectionTool {

    constructor (canvas, {
            aspectRatio = '1:1',
            handleWidth,
            handleOffset
        } = {}) {
        this.canvas = canvas;

        this.canvas.on('mouse-down', this.determineDragAction.bind(this));
        //this.canvas.on('mouse-drag', will be determined by mouse down handler);
        this.canvas.on('mouse-move', this.setMouseCursor.bind(this));

        this.canvas.on('mouse-up', this.onSelectionEnd.bind(this));
        this.canvas.on('mouse-up', this.setMouseCursor.bind(this));

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onSelectionEnd.bind(this));

        this.resizeHandles = new ResizeHandles(this.canvas, {
            width: handleWidth,
            offset: handleOffset
        });

        this.setAspectRatio(aspectRatio);
        this.setMinimumSize();
    }

    /**
     * Create a selection between two points. Anchored at the 'fixed' point
     *
     * Given loose coord may be changed, it will be normalised to aspect ratio
     *
     * @param fixed
     * @param loose
     */
    create (fixed, loose) {
        this.fixedCoord = fixed;
        this.setLooseCoord(loose);
    }

    /**
     * Create a selection anchored to a point, the loose point will be calculated from the minimum size
     *
     * @param coord
     */
    setFixedCoord (coord) {
        this.create(coord, coord);
    }

    /**
     * Set the 'loose' point of a selection. This is the point diagonally opposite the fixed point.
     *
     * Given loose coord may be changed, it will be normalised to aspect ratio
     *
     * @param coord
     */
    setLooseCoord (coord) {
        let width = coord.x - this.fixedCoord.x,
            height = coord.y - this.fixedCoord.y,
            heightCoefficient = (height < 0) ? -1 : 1;

        this.width = width;
        this.height = Math.abs(width) * this.aspectRatio * heightCoefficient;

        let looseCoord = {
            x: this.fixedCoord.x + this.width,
            y: this.fixedCoord.y + this.height
        };

        //Ensure selection is within bounds of canvas
        if (looseCoord.x > this.canvas.getWidth()) {
            looseCoord.x = this.canvas.getWidth();
            this.fixedCoord.x = looseCoord.x - this.width;
        }
        if (looseCoord.y > this.canvas.getHeight()) {
            looseCoord.y = this.canvas.getHeight();
            this.fixedCoord.y = looseCoord.y - this.height;
        }
        this.looseCoord = looseCoord;

        this.drawSelectionTool();
    }

    /**
     * Work out what our mouse cursor should be, from where we are currently hovering over the selection
     *
     * @param coord
     */
    setMouseCursor (coord) {
        let cursor = 'crosshair',
            handle = (this.isActive()) ? this.resizeHandles.findHandleAtCoord(coord) : false;

        if (handle) {
            cursor = handle.getMouseCursor();
        } else if (this.isCoordWithinBounds(coord)) {
            cursor = 'move';
        }

        this.canvas.setMouseCursor(cursor);
    }

    /**
     * Set the aspect ratio of the selection. Given as a colon seperated string
     *
     * i.e. "1:1", "4:3", "16:9"
     *
     * @param aspectRatio
     */
    setAspectRatio (aspectRatio) {
        this.aspectRatio = parseAspectRatio(aspectRatio);
    }

    /**
     * Set the minimum size of the selection by giving its width
     *
     * The height will be computed from the aspect ratio
     *
     * @param width
     */
    setMinimumSize(width = 50) {
        this.minimumWidth = width;
    }

    /**
     * Returns the top, bottom, left and right limits of the current selection
     *
     * @returns {{top: *, left: *, bottom: *, right: *}}
     */
    getBounds () {
        let top = (this.height < 0) ? this.looseCoord.y : this.fixedCoord.y,
            left = (this.width < 0) ? this.looseCoord.x : this.fixedCoord.x,
            bottom = (this.height < 0) ? this.fixedCoord.y : this.looseCoord.y,
            right = (this.width < 0) ? this.fixedCoord.x : this.looseCoord.x;

        return {
            top: top,
            left: left,
            bottom: bottom,
            right: right
        };
    }

    /**
     * Is a given coordinate within the current selection?
     *
     * @param coord
     * @returns {boolean}
     */
    isCoordWithinBounds (coord) {
        if (this.isActive()) {
            let bounds = this.getBounds();
            return isCoordWithinArea(coord, bounds);
        }
        return false;
    }

    /**
     * Returns whether a selection is current active
     * @returns {boolean}
     */
    isActive () {
        return this.fixedCoord && this.looseCoord;
    }

    /**
     * Removes the current selection
     */
    clear () {
        this.fixedCoord = false;
        this.looseCoord = false;
        this.canvas.publish('clear-selection');
    }

    /**
     * We can work out what our mouse-drag action is, by discovering where the mouse down took place.
     *
     * In a drag handle? Inside/outside selection?
     *
     * @param coord
     */
    determineDragAction (coord) {
        //Remove current drag handler
        this.canvas.off('mouse-drag');

        let handle = (this.isActive()) ? this.resizeHandles.findHandleAtCoord(coord) : false,
            dragHandler = null;

        if (handle) {
            dragHandler = this.resizeFromHandle.bind(this, handle);
        } else if (this.isCoordWithinBounds(coord)) {
            dragHandler = this.move.bind(this);
        } else {
            this.setFixedCoord(coord);
            dragHandler = this.setLooseCoord.bind(this);
        }

        this.canvas.on('mouse-drag', dragHandler);
    }

    /**
     * Moves a selection centered at given argument coord, unless the result selection would be outside the canvas
     *
     * @param coord
     */
    move (coord) {
        let newFixedCoord = {
                x: Math.max(0, coord.x - (this.width / 2)),
                y: Math.max(0, coord.y - (this.height / 2))
            },
            newLooseCoord = {
                x: newFixedCoord.x + this.width,
                y: newFixedCoord.y + this.height
            };
        this.create(newFixedCoord, newLooseCoord);
    }

    /**
     * Resizes the selection from the given handle, to a given loose point
     *
     * Given loose coord may not be the same as loose coord that is set, it will be normalised to aspect ratio
     *
     * @param handle
     * @param coord
     */
    resizeFromHandle(handle, coord) {
        switch (handle.corner) {
            case 'nw':
                this.create(this.looseCoord, coord);
                break;
            case 'ne':
                this.create({x: this.fixedCoord.x, y: this.looseCoord.y}, coord);
                break;
            case 'sw':
                this.create({x: this.looseCoord.x, y: this.fixedCoord.y}, coord);
                break;
            case 'se':
                this.create(this.fixedCoord, coord);
                break;
        }
        this.canvas.off('mouse-drag');
        this.canvas.on('mouse-drag', this.setLooseCoord.bind(this));
    }

    onKeyDown(e) {
        if (this.isActive()) {
            switch (e.keyCode) {
                case 27: // Escape
                    this.clear();
                    break;
                case 37: // Left arrow
                    e.preventDefault();
                    this.create({x: this.fixedCoord.x - 5, y: this.fixedCoord.y}, {x: this.looseCoord.x - 5, y: this.looseCoord.y});
                    break;
                case 38: // Up arrow
                    e.preventDefault();
                    this.create({x: this.fixedCoord.x, y: this.fixedCoord.y - 5}, {x: this.looseCoord.x, y: this.looseCoord.y - 5});
                    break;
                case 39: // Right arrow
                    e.preventDefault();
                    this.create({x: this.fixedCoord.x + 5, y: this.fixedCoord.y}, {x: this.looseCoord.x + 5, y: this.looseCoord.y});
                    break;
                case 40: // Down arrow
                    e.preventDefault();
                    this.create({x: this.fixedCoord.x, y: this.fixedCoord.y + 5}, {x: this.looseCoord.x, y: this.looseCoord.y + 5});
                    break;
                default:
                    break;
            }
        }
    }

    onSelectionEnd () {
        if (this.isActive() && this.oldDimensions !== this.toString()) {

            //Only ensure size and normalise if we have resized selection since last time
            if (this.oldWidth !== this.width) {
                this.ensureMinimumSize();
                this.normalise();
                this.oldWidth = this.width;
            }

            this.emitDimensions();
            this.drawResizeHandles();
            this.oldDimensions = this.toString();
        }
    }

    /**
     * When a selection is made, this enforces the minimum size, if too small
     */
    ensureMinimumSize () {
        if (Math.abs(this.width) < this.minimumWidth) {
            let width = this.minimumWidth,
                height = this.minimumWidth * this.aspectRatio;

            width = (this.width < 0) ? -width : width;
            height = (this.height < 0) ? -height : height;

            this.setLooseCoord({
                x: this.fixedCoord.x + width,
                y: this.fixedCoord.y + height
            });

            this.drawSelectionTool();
        }
    }

    /**
     * Normalises the selection, so the top left corner is the the fixed coord, and the bottom right is the loose coord
     *
     * Ensures width and height are positive, and ensures we know where the fixed point is after selection is made
     */
    normalise () {
        let bounds = this.getBounds();

        this.fixedCoord = {x: bounds.left, y: bounds.top};
        this.looseCoord = {x: bounds.right, y: bounds.bottom};

        this.width = Math.abs(this.width);
        this.height = Math.abs(this.height);
    }

    /**
     * After a selection is made, emits the fixed point of the selection, and it's width and height
     */
    emitDimensions () {
        let ctx = this.canvas.getContext(),
            bounds = this.getBounds(),
            width = this.width,
            height = this.height;

        this.canvas.publish('before-selection', ctx, {width, height, ...bounds});
        this.canvas.publish('selection', ctx, {width, height, ...bounds});
        this.canvas.publish('draw-selection-tool', ctx, {width, height, posX: bounds.left, posY: bounds.top});
        this.canvas.publish('after-selection', ctx, {width, height, ...bounds});
    }

    /**
     * Draws the current selection, emitting appropriate events
     */
    drawSelectionTool () {
        let ctx = this.canvas.getContext(),
            posX = this.fixedCoord.x,
            posY = this.fixedCoord.y,
            width = this.width,
            height = this.height;

        this.canvas.publish('clear-selection');
        this.canvas.publish('draw-selection-tool', ctx, {posX, posY, width, height});
    }

    /**
     * Draws resize handles at the corners of the current selection
     */
    drawResizeHandles () {
        let bounds = this.getBounds();
        this.resizeHandles.drawHandles(bounds);
    }

    /**
     * Re draws the current selection tool
     */
    redraw () {
        this.setLooseCoord(this.looseCoord);
        this.onSelectionEnd();
    }

    /**
     * Used to compare if the selection has been modified
     *
     * @returns {String}
     */
    toString () {
        let bounds = this.getBounds();

        return `[Selection] w:${this.width},h:${this.height},t:${bounds.top},l:${bounds.left},b:${bounds.bottom},r:${bounds.right}`;
    }

    /**
     * Clear up event listeners
     */
    destroy () {
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onSelectionEnd.bind(this));
    }
}