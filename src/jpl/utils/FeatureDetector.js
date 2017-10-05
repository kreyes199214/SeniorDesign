define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/has",
    "dojo/topic",
    "jpl/utils/MakeSingletonUtil",
    "jpl/utils/WebGLDetector",
    "jpl/events/BrowserEvent"
], function(declare, Evented, has, topic, MakeSingletonUtil, WebGLDetector, BrowserEvent) {
    /**
     * Class to insert Google Analytics tracking code asynchronously.
     * @requires dojo/_base/declare
     * @requires dojo/evented,
     * @requires dojo/has,
     * @requires dojo/topic,
     * @requires jpl/utils/MakeSingletonUtil,
     * @requires jpl/utils/WebGLDetector,
     * @requires jpl/events/BrowserEvent
     * @class jpl.utils.FeatureDetector
     */
    return MakeSingletonUtil(declare("gov.nasa.jpl.mmmp.FeatureDetector", [Evented], /** @lends jpl.utils.FeatureDetector.prototype */ {
        nightly38: false,
        /**
         * @property {boolean} - Flag to determine if user is on a mobile device
         * @type {boolean}
         * @default false
         * @description Flag to determine if user is on a mobile device
         */
        mobileDevice: false,
        /**
         * @property {boolean} - Flag to determine if user is on a touch enabled device
         * @type {boolean}
         * @default false
         * @description Flag to determine if user is on a touch enabled device
         */
        touchDevice: false,
        /**
         * @property {boolean} - Flag to determine if user supports webGL
         * @type {boolean}
         * @default false
         * @description Flag to determine if user supports webGL
         */
        webGL: false,

        /**
         * Constructor function that tests mobile, touch and webGL conditions
         * @return {null}
         */
        constructor: function () {
            this.nightly38 = this.isNightly38();
            this.mobileDevice = this.isMobile();
            this.touchDevice = this.hasTouch();
            this.webGL = this.hasWebGL();
            this.detectionComplete();
        },

        /**
         * Determines if user is browsing from a touch enabled device
         * @return {boolean}
         */
        hasTouch: function () {
            return has("touch");
        },

        isNightly38: function () {
            if (has("ff") == 38 ) {
                return true;
            } else {
                return false;
            }
        },
        /**
         * Determines if a user is browsing from a mobile device
         * @return {boolean}
         */
        isMobile: function () {
            if (has("ios") || has("android") || has("bb") || has("windowsphone")) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Determines if a user supports WebGL
         * @return {boolean}
         */
        hasWebGL: function() {
            //Don't allow webGL on IE as it is still experimental and shaders do not work
            if(has("ie") || has("trident")) {
                return false;
            } else {
                return WebGLDetector.prototype.hasWebGL();
            }
        },

        /**
         * Called when all detections have been completed
         * @return {null}
         */
        detectionComplete: function() {
            topic.publish(BrowserEvent.prototype.FEAT_DETECT_COMPLETE, null);
            console.info('feature detection complete');
        }
    }));
});