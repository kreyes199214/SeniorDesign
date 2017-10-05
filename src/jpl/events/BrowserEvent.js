define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all bookmark events
     * @requires dojo/_base/declare
     * @class jpl.events.BrowserEvent
     */
    return declare(null, /** @lends jpl.events.BrowserEvent.prototype */ {
        /**
         * @property {string} - browser window has been resized
         * @type {string}
         * @description browser window has been resized
         */
        WINDOW_RESIZED: "browser-event/window-resized",
        /**
         * @property {string} - configuration files have been loaded
         * @type {string}
         * @description configuration files have been loaded
         */
        CONFIG_LOADED: "browser-event/config-loaded",
        /**
         * @property {string} - all browser feature detection is completed
         * @type {string}
         * @description all browser feature detection is completed
         */
        FEAT_DETECT_COMPLETE: "browser-event/feature-detect-complete",
        /**
         * @property {string} - event to display an alert message to the user
         * @type {string}
         * @description event to display an alert message to the user
         */
        SHOW_ALERT: "browser-event/show-alert"
    });
});