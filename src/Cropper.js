'use strict';

import Canvas from './Canvas';
import CanvasImage from './CanvasImage';
import SelectionTool from './SelectionTool';
import EventEmitter from 'event-emitter-mixin';
import { computeActualSizes } from './util';

function redrawImageWithinSelectionTool (ctx, data) {
    let factor = this.croppableImage.getScaleFactor(),
        actualData = computeActualSizes(data, factor);

    ctx.drawImage(this.image, actualData.x, actualData.y, actualData.width, actualData.height, data.left, data.top, data.width, data.height);
}

@EventEmitter
class Cropper {
    constructor (containerElem, {
            image,
            aspectRatio,
            handleWidth,
            handleOffset
        } = {}) {

        this.canvas = new Canvas(containerElem);

        //Defaults
        this.canvas.on('selection', redrawImageWithinSelectionTool.bind(this));
        this.canvas.on('clear-selection', this.redrawImage.bind(this));

        //Make these events public to ease integration
        ['draw-selection-tool', 'before-selection', 'selection', 'after-selection', 'draw-handle', 'image-load'].forEach((eventName) => {
            this.canvas.on(eventName, this.emit.bind(this, eventName));
        });

        this.selectTool = new SelectionTool(this.canvas, {
            aspectRatio,
            handleWidth,
            handleOffset
        });

        if (image) {
            this.setImage(image);
        }
    }

    /**
     * Sets the current image in the crop tool, removes the selection tool if an image is already present
     * @param image
     */
    setImage (image) {
        if (this.image) {
            this.clearSelection();
        }
        this.image = image;
        this.fullSizeImage = new CanvasImage(image);
        this.croppableImage = new CanvasImage(image, this.canvas.getElement());

        //Make these events public
        ['image-loaded'].forEach((eventName) => {
            this.croppableImage.on(eventName, this.emit.bind(this, eventName));
        });
    }

    /**
     * Changes the aspect ratio of the select tool
     * @param ratio i.e. 1:1, 4:3 16:9 etc
     */
    setAspectRatio (ratio) {
        this.selectTool.setAspectRatio(ratio);
        this.selectTool.redraw();
    }

    /**
     * Sets the minimum width of the crop generated (height is inferred for aspect ratio)
     * @param width
     */
    setMinimumWidth (width) {
        let factor = this.croppableImage.getScaleFactor();
        this.selectTool.setMinimumSize(Math.ceil(width * (1 / factor)));
    }

    /**
     * Gets the data url of the crop generated
     * @param ctx
     * @param data
     * @returns {*}
     */
    getCroppedDataUrl (ctx, data) {
        let factor = this.croppableImage.getScaleFactor(),
            actualData = computeActualSizes(data, factor);

        this.fullSizeImage.drawImageSection(actualData.x, actualData.y, actualData.width, actualData.height);

        return this.fullSizeImage.getDataUrl();
    }

    /**
     * Refreshes/resets the canvas with the current image
     */
    redrawImage () {
        this.croppableImage.redrawToCanvas();
    }

    /**
     * Hides the current select tool
     */
    clearSelection () {
        this.selectTool.clear();
    }

    /**
     * Removes the current Cropper instance
     */
    destroy () {
        this.canvas.destroy();
        this.selectTool.destroy();
    }
}

export default Cropper;
window.Cropper = Cropper;