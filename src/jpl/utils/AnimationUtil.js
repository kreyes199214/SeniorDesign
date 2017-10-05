define([
    "dojo/_base/declare",
    "dojo/fx",
    "dojo/_base/fx"
], function (declare, fx, baseFx) {
    /**
     * Utility class to simplify DOM animations
     * @requires dojo/_base/declare
     * @requires dojo/fx
     * @requires dojo/_base/fx
     * @class jpl.utils.AnimationUtil
     */
    return declare(null, /** @lends jpl.utils.AnimationUtil.prototype */ {
        /**
         * Slides a DOM element to the provided top-left position
         * @param {object} node - The DOM node to perform the animation
         * @param {number} top - The top position, in pixels, to place the node
         * @param {number} left - The left position, in pixels, to place the node
         * @return {null}
         */
        slideAnimation: function (node, top, left) {
            fx.slideTo({
                node: node,
                top: top.toString(),
                left: left.toString(),
                unit: "px",
                onBegin: function() {
                    //me.animationPlaying = true;
                },
                onEnd: function() {
                    //me.animationPlaying = false;
                }
            }).play();
        },

        /**
         * Fades a dom element in, waits duration, and fades out.
         * @param {object} node - The DOM node to fade in and out.
         * @param {number} duration - The duration, in milliseconds, to wait before fading out. Defaults to 3000.
         * @return {null}
         */
        fadeInOutAnimation: function(node, duration) {
            if(!duration || isNaN(duration)) {
                duration = 3000;
            }

            baseFx.fadeIn({node: node}).play();

            setTimeout(function() {
                baseFx.fadeOut({node: node}).play();
            }, duration);
        },

        /**
         * Wipes a DOM element in
         * @param {object} node - The DOM node to fade in and out.
         * @param {number} duration - The duration, in milliseconds, to wipe in. Defaults to 300.
         * @return {null}
         */
        wipeInAnimation: function(node, duration) {
            if(!duration || isNaN(duration)) {
                duration = 300;
            }

            fx.wipeIn({
                node: node,
                duration: duration
            }).play();
        },

        /**
         * Wipes a DOM element out
         * @param {object} node - The DOM node to fade in and out.
         * @param {number} duration - The duration, in milliseconds, to wait before wiping out. Defaults to 300.
         * @return {null}
         */
        wipeOutAnimation: function(node, duration) {
            if(!duration || isNaN(duration)) {
                duration = 300;
            }

            fx.wipeOut({
                node: node,
                duration: duration
            }).play();
        }
    });
});