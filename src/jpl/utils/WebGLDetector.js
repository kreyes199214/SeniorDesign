define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom"
], function (declare, domConstruct, dom) {
    /**
     * Utility class to detect support of WebGL in user's browser.
     * @requires dojo/_base/declare
     * @requires dojo/dom
     * @requires dojo/dom-construct
     * @class jpl.utils.WebGLDetector
     */
    return declare(null, /** @lends jpl.utils.WebGLDetector.prototype */ {

        /**
         * Determines if WebGL is supported in current browser.
         * @return {boolean}
         */
        hasWebGL: function() {
            var canvasID = '3dTestCanvas',
                canvas = this.generateTestCanvas(canvasID),
                glExperimental = false,
                gl;

            //check if webgl is enabled
            try {
                gl = canvas.getContext("webgl");
            } catch (x) {
                gl = null;
            }

            //check if experimental webgl is enabled
            if (gl === null) {
                try {
                    gl = canvas.getContext("experimental-webgl");
                    glExperimental = true;
                } catch (x) {
                    gl = null;
                }
            }

            //get rid of the testing canvas as its no longer needed
            this.destroyTestCanvas(canvasID);

            if(gl) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Generates a test canvas to the DOM. We can attempt to access the webgl context of the canvas to determine
         * if WebGL is supported. Returns the dom node of the created canvas.
         * @param {string} canvasID - The ID of the canvas to be used when created
         * @return {object}
         */
        generateTestCanvas: function(canvasID) {
            //create the canvas element and place it at the end of the body
            var testCanvas = '<canvas id="' + canvasID + '"></canvas>';
            domConstruct.place(testCanvas, document.body, "last");
            //grab the canvas from the dom and return it
            return dom.byId(canvasID);
        },

        /**
         * Removes a canvas from the DOM.
         * @param {string} canvasID - The ID of the canvas to be removed
         * @return {null}
         */
        destroyTestCanvas: function(canvasID) {
            domConstruct.destroy(canvasID);
        }
    });
});