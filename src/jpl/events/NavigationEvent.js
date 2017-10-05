define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all navigation events
     * @requires dojo/_base/declare
     * @class jpl.events.NavigationEvent
     */
    return declare(null, /** @lends jpl.events.NavigationEvent.prototype */ {
        /**
         * @property {string} - open the navigation sidebar
         * @type {string}
         * @description open the navigation sidebar
         */
        OPEN_SIDEBAR: "navigation-event/open-left-sidebar",
        /**
         * @property {string} - close the navigation sidebar
         * @type {string}
         * @description clsoe the navigation sidebar
         */
        CLOSE_SIDEBAR: "navigation-event/close-left-sidebar",
        /**
         * @property {string} - open the navigation sidebar
         * @type {string}
         * @description open the navigation sidebar
         */
        OPEN_MENU_SIDEBAR: "navigation-event/open-menu-sidebar",
        /**
         * @property {string} - close the navigation sidebar
         * @type {string}
         * @description clsoe the navigation sidebar
         */
        CLOSE_MENU_SIDEBAR: "navigation-event/close-menu-sidebar",
        /**
         * @property {string} - open the navigation sidebar
         * @type {string}
         * @description open the navigation sidebar
         */
        OPEN_TOOL_SIDEBAR: "navigation-event/open-tool-sidebar",
        /**
         * @property {string} - close the navigation sidebar
         * @type {string}
         * @description clsoe the navigation sidebar
         */
        CLOSE_TOOL_SIDEBAR: "navigation-event/close-tool-sidebar",
        /**
         * @property {string} - open the navigation sidebar
         * @type {string}
         * @description open the navigation sidebar
         */
        OPEN_SEARCH_SIDEBAR: "navigation-event/open-search-sidebar",
        /**
         * @property {string} - close the navigation sidebar
         * @type {string}
         * @description clsoe the navigation sidebar
         */
        CLOSE_SEARCH_SIDEBAR: "navigation-event/close-search-sidebar",
        /**
         * @property {string} - check to determine if sidebar should be closed
         * @type {string}
         * @description check to determine if sidebar should be closed
         */
        CHECK_SIDEBAR: "navigation-event/check-sidebar",
        OPEN_TOOL_SIDEBAR: "navigation-event/open-tool-sidebar",
        HIDE_UI_BUTTONS: "navigation-event/hide-ui-buttons",
        SHOW_UI_BUTTONS: "navigation-event/show-ui-buttons",
        SHOW_BOOKMARK_END_DRAW_UI_BUTTON: "navigation-event/show-bookmark-end-draw-ui-button",
        HIDE_BOOKMARK_END_DRAW_UI_BUTTON: "navigation-event/hide-bookmark-end-draw-ui-button",
        ENABLE_CLOSE_SIDEBAR_ON_MAP_CLICK: "navigation-event/enable-close-sidebar-on-map-click"
    });
});