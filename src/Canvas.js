'use strict';

import CanvasImage from './CanvasImage';
import { normaliseMouseEventToElement } from './util';
import EventEmitter from 'event-emitter-mixin';

@EventEmitter
export default class Canvas {

    constructor (containerElem) {
        this.containerElem = containerElem;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.getContainerWidth();
        this.canvas.height = this.getContainerHeight();

        //Set the background image of the container to light and dark grey squares
        this.containerElem.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAV0lEQVQ4T+2RsQ0AIQwDjWApysyClJ2Qsgtllkr0rwzgngI3111xbqr6gSwzMedEka09AS5osNaiN0YERARFeqOZUcEYA+ccFKlg700FvXe4O4pPcHODH9VZb+nrHffqAAAAAElFTkSuQmCC)';
        this.containerElem.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1.0;
        // Prevent blurry canvas lines, @see http://stackoverflow.com/questions/8696631/canvas-drawings-are-blurry#13294650
        this.ctx.translate(0.5, 0.5);

        this.setMouseCursor();

        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    /**
     * Gets the DOM element this class wraps
     *
     * @returns {Element}
     */
    getElement () {
        return this.canvas;
    }

    /**
     * Gets the 2D Drawing context of the canvas
     *
     * @returns {CanvasRenderingContext2D}
     */
    getContext () {
        return this.ctx;
    }

    /**
     * Get the width of the containing element
     *
     * @returns {number}
     */
    getContainerWidth () {
        return this.containerElem.clientWidth;
    }

    /**
     * Get the height of the containing element
     *
     * @returns {number}
     */
    getContainerHeight () {
        return this.containerElem.clientHeight;
    }

    /**
     * Get the width of the canvas
     *
     * @returns {number}
     */
    getWidth () {
        return this.canvas.width;
    }

    /**
     * Get the width of the canvas
     *
     * @returns {number}
     */
    getHeight () {
        return this.canvas.height;
    }

    /**
     * Emits a mouse-down event with the current coordinate of the mouse
     *
     * @param e
     */
    onMouseDown (e) {
        this.isMouseDown = true;

        this.emit('mouse-down', {x: e.offsetX, y: e.offsetY});
    }

    /**
     * Emits a mouse-move event with the current coordinate of the mouse
     * Emits a mouse-drag if the mouse was previously down
     *
     * Listens to the entire document, but normalizes mouse events to within the canvas
     *
     * @param e
     */
    onMouseMove (e) {
        let event = 'mouse-move';
        if (this.isMouseDown) {
            event = 'mouse-drag';
        }

        this.emit(event, normaliseMouseEventToElement(this.canvas, e));
    }

    /**
     * Emits a mouse-up event with the current coordinate of the mouse
     *
     * Listens to the entire document, but normalizes mouse events to within the canvas
     *
     * @param e
     */
    onMouseUp (e) {
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.emit('mouse-up', normaliseMouseEventToElement(this.canvas, e));
        }
    }

    /**
     * Sets the current mouse cursor
     *
     * @param type
     */
    setMouseCursor (type = 'crosshair') {
        this.canvas.style.cursor = type;
    }

    /**
     * Allows other components to publish events on this canvas component
     *
     * @param args
     */
    publish (...args) {
        this.emit.apply(this, args)
    }

    /**
     * Clear up event listeners
     */
    destroy () {
        this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
}
