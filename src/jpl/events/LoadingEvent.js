define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all loading events
     * @requires dojo/_base/declare
     * @class jpl.events.LoadingEvent
     */
    return declare(null,  /** @lends jpl.events.LoadingEvent.prototype */ {
        /**
         * @property {string} - loading has been started
         * @type {string}
         * @description loading has been started
         */
        BEGIN_DOWNLOAD: "tool-event/download-event-begin-download",
        /**
         * @property {string} - loading is completed
         * @type {string}
         * @description loading is completed
         */
        END_DOWNLOAD: "tool-event/download-event-end-download",
        /**
         * @property {string} - bookmark loading has been started
         * @type {string}
         * @description bookmark loading has been started
         */
        SHOW_BOOKMARK: "loading-event/show-bookmark"
    });
});