define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all slideshow events
     * @requires dojo/_base/declare
     * @class jpl.events.slideshowEvent
     */
    return declare(null, /** @lends jpl.events.slideshowEvent.prototype */ {
        /**
         * @property {string} - event when all slideshows have been loaded
         * @type {string}
         * @description event when all slideshows have been loaded
         */
        SLIDESHOWS_LOADED: "slideshow-event/slideshows-loaded",
        /**
         * @property {string} - event when a slideshow has been added
         * @type {string}
         * @description event when a slideshow has been added
         */
        SLIDESHOW_ADDED: "slideshow-event/slideshow-added",
        /**
         * @property {string} - event when a slideshow has been removed
         * @type {string}
         * @description event when a slideshow has been removed
         */
        SLIDESHOW_REMOVED: "slideshow-event/slideshow-removed",
        /**
         * @property {string} - event when a slideshow is to be added
         * @type {string}
         * @description event when a slideshow is to be added
         */
        ADD_SLIDESHOW: "slideshow-event/add-slideshow",
        /**
         * @property {string} - event when a slideshow is to be selected
         * @type {string}
         * @description event when a slideshow is to be selected
         */
        SELECT_SLIDESHOW: "slideshow-event/select-slideshow",
        SELECT_SLIDESHOW_CATEGORY: "slideshow-event/select-slideshow-category",
        SELECT_SLIDESHOW_SUBCATEGORY: "slideshow-event/select-slideshow-sub-category",
        SELECT_SLIDESHOW_COLLECTION: "slideshow-event/select-slideshow-collection",
        ADD_SLIDE_SHOW_LOCATION_3D: "slideshow-event/add-slide-show-location-3d",
        REMOVE_SLIDE_SHOW_LOCATION_3D: "slideshow-event/remove-slide-show-location-3d",
        FLY_TO_SLIDE_SHOW_LOCATION_3D: "slideshow-event/fly-to-slide-show-location-3d",

        SLIDESHOW_GALLERY_BACKBUTTON_PRESSED: "slideshow-event/slideshow-gallery-backbutton-pressed",
        LOADING_FINISHED: "slideshow-event/loading-finished",
        WAYPOINT_HOVER: "slideshow-event/waypoint-hover",
        WAYPOINT_LEAVE: "slideshow-event/waypoint-leave",
        WAYPOINT_CLICK: "slideshow-event/waypoint-click"
    });
});
