define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all bookmark events
     * @requires dojo/_base/declare
     * @class jpl.events.BookmarkEvent
     */
    return declare(null, /** @lends jpl.events.BookmarkEvent.prototype */ {
        /**
         * @property {string} - all bookmarks have been loaded
         * @type {string}
         * @description all bookmarks have been loaded
         */
        BOOKMARKS_LOADED: "bookmark-event/bookmarks-loaded",
        /**
         * @property {string} - a bookmark has been added
         * @type {string}
         * @description a bookmark has been added
         */
        BOOKMARK_ADDED: "bookmark-event/bookmark-added",
        /**
         * @property {string} - a bookmark has been removed
         * @type {string}
         * @description a bookmark has been removed
         */
        BOOKMARK_REMOVED: "bookmark-event/bookmark-removed",
        /**
         * @property {string} - layers in bookmark been added
         * @type {string}
         * @description layers in bookmark been added
         */
        BOOKMARK_LAYERS_ADDED: "bookmark-event/bookmark-layers-added",
        /**
         * @property {string} - a bookmark is to be added
         * @type {string}
         * @description a bookmark is to be added
         */
        ADD_BOOKMARK: "bookmark-event/add-bookmark",
        /**
         * @property {string} - a bookmark is to be selected
         * @type {string}
         * @description a bookmark is to be selected
         */
        SELECT_BOOKMARK: "bookmark-event/select-bookmark",
        /**
         * @property {string} - bookmark loading has finished
         * @type {string}
         * @description bookmark loading has finished
         */
        LOADING_FINISHED: "bookmark-event/loading-finished",
        /**
         * @property {string} - a bookmark waypoint is hovered
         * @type {string}
         * @description a bookmark waypoint is hovered
         */
        WAYPOINT_HOVER: "bookmark-event/waypoint-hover",
        /**
         * @property {string} - a mouse leaves bookmark waypoint
         * @type {string}
         * @description a mouse leaves bookmark waypoint
         */
        WAYPOINT_LEAVE: "bookmark-event/waypoint-leave",
        /**
         * @property {string} - a mouse clicks a bookmark waypoint
         * @type {string}
         * @description a mouse clicks a bookmark waypoint
         */
        WAYPOINT_CLICK: "bookmark-event/waypoint-click",
        /**
         * @property {string} - view a bookmark region
         * @type {string}
         * @description view a bookmark region
         */
        VIEW_REGION: "bookmark-event/view-region",
        /**
         * @property {string} - load a bookmark
         * @type {string}
         * @description load a bookmark
         */
        LOAD_BOOKMARK: "bookmark-event/load-bookmark",
        ADD_GRAPHIC_TO_TERRAIN: "bookmark-event/add-graphic-to-terrain",
        REMOVE_GRAPHIC_FROM_TERRAIN: "bookmark-event/remove-graphic-from-terrain",
        HIDE_WAYPOINTS_3D: "bookmark-event/hide-waypoints-3d",
        SHOW_WAYPOINTS_3D: "bookmark-event/show-waypoints-3d"
    });
});