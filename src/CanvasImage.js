'use strict';

import EventEmitter from 'event-emitter-mixin';

@EventEmitter
export default class CanvasImage {

    constructor (image, canvas) {
        if (image instanceof HTMLImageElement) {
            this.loadImage(image.src, this.drawToCanvas.bind(this, canvas));
        } else if (typeof image === 'string') {
            this.loadImage(image, this.drawToCanvas.bind(this, canvas));
        } else if (image instanceof Image) {
            this.drawToCanvas(canvas, image);
        } else {
            //Say what???!!!
        }
    }

    /**
     * Load an image asyncronously for the given src, and execute the given callback
     *
     * @param imageSrc
     * @param cb
     */
    loadImage (imageSrc, cb) {
        let image = new Image;
        image.onload = () => {
            cb.call(this, image);
        };
        image.onerror = () => {
            //TODO: do something?
        };
        image.src = imageSrc;
    }

    /**
     * Draw the image to the given canvas, scales the image to the max canvas size and resizes canvas appropriately
     *
     * @param canvasElem
     * @param imageObj
     */
    drawToCanvas (canvasElem, imageObj) {
        let canvas = null;

        this.image = imageObj;
        if (typeof canvasElem === 'undefined') {
            canvas = document.createElement('canvas');
            canvas.width = imageObj.width;
            canvas.height = imageObj.height;
        } else {
            canvas = canvasElem;
        }

        let canvasRatio = canvas.width / canvas.height,
            imageRatio = imageObj.width / imageObj.height;

        let posX = 0,
            posY = 0,
            newCanvasWidth = canvas.width,
            newCanvasHeight = canvas.height;

        if (imageRatio > canvasRatio) {
            newCanvasHeight = newCanvasWidth * (1 / imageRatio);
            posY = (canvas.height - newCanvasHeight) / 2;
        } else if (imageRatio < canvasRatio) {
            newCanvasWidth = newCanvasHeight * imageRatio;
            posX = (canvas.width - newCanvasWidth) / 2;
        }

        canvas.setAttribute('width', newCanvasWidth);
        canvas.setAttribute('height', newCanvasHeight);
        canvas.style.marginLeft = posX + 'px';
        canvas.style.marginTop = posY + 'px';

        canvas.getContext('2d').drawImage(imageObj, 0, 0, newCanvasWidth, newCanvasHeight);

        this.canvas = canvas;
        this.emit('image-loaded');
    }

    /**
     * Draws the image to the canvas without resizing canvas
     */
    redrawToCanvas () {
        this.canvas.getContext('2d').drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

        //Trigger image loaded
        this.emit('image-drawn');
    }

    /**
     * Returns a float describing the scale ratio between the original image and the image drawn on canvas
     *
     * @returns {number}
     */
    getScaleFactor () {
        return this.image.width / this.canvas.width;
    }

    /**
     * Draws a section of the image to canvas without scaling,
     *
     * @param sx
     * @param sy
     * @param sWidth
     * @param sHeight
     */
    drawImageSection (sx, sy, sWidth, sHeight) {
        this.canvas.setAttribute('width', sWidth);
        this.canvas.setAttribute('height', sHeight);

        this.canvas.getContext('2d').drawImage(this.image, sx, sy, sWidth, sHeight, 0, 0, this.canvas.width, this.canvas.height);
    }

    getDataUrl () {
        return this.canvas.toDataURL('image/png');
    }
}