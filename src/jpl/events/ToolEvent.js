define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all tool events
     * @requires dojo/_base/declare
     * @class jpl.events.ToolEvent
     */
    return declare(null, /** @lends jpl.events.NavigationEvent.prototype */ {
        /**
         * @property {string} - show elevation plot
         * @type {string}
         * @description show elevation plot
         */
        SHOW_ELEVATION_PLOT: "tool-event/show-elevation-plot",
        /**
         * @property {string} - minimize elevation plot
         * @type {string}
         * @description minimize elevation plot
         */
        MINIMIZE_ELEVATION_PANE: "tool-event/minimize-elevation-plot",/**
         * @property {string} - expand elevation plot
         * @type {string}
         * @description expand elevation plot
         */
        EXPAND_ELEVATION_PANE: "tool-event/expand-elevation-plot",
        /**
         * @property {string} - show sun angle plot
         * @type {string}
         * @description show sun angle plot
         */
        SHOW_SUN_ANGLE_PLOT: "tool-event/show-sun-angle-plot",
        /**
         * @property {string} - show line position indicator when mouse hovered on plot
         * @type {string}
         * @description show line position indicator when mouse hovered on plot
         */
        SHOW_LINE_POSITION_GRAPHIC: "tool-event/show-line-position-graphic",
        /**
         * @property {string} - remove line position indicator when mouse leaves plot
         * @type {string}
         * @description remove line position indicator when mouse leaves plot
         */
        REMOVE_LAST_POLYLINE_GRAPHIC: "tool-event/remove-last_polyline-graphic",
        /**
         * @property {string} - notify when mouse has left elevation plot
         * @type {string}
         * @description notify when mouse has left elevation plot
         */
        MOUSE_MOVED_OFF_ELEVATION_PLOT: "tool-event/mouse-moved-off-elevation-plot",
        /**
         * @property {string} - sun angle dialog submit
         * @type {string}
         * @description sun angle dialog submit
         */
        SUN_ANGLE_DIALOG_RESPONSE: "tool-event/sun-angle-dialog-response",
        /**
         * @property {string} - create terrain view graphic
         * @type {string}
         * @description create terrain view graphic
         */
        CREATE_TERRAIN_VIEW_GRAPHIC: "tool-event/create-terrain-view-graphic",
        /**
         * @property {string} - remove terrain view graphic
         * @type {string}
         * @description remove terrain view graphic
         */
        REMOVE_TERRAIN_VIEW_GRAPHIC: "tool-event/remove-terrain-view-graphic",
        /**
         * @property {string} - show polygon stl
         * @type {string}
         * @description show polygon stl
         */
        SHOW_POLYGON_STL: "tool-event/show-polygon-stl",
        SUBSETING: "tool-event/subseting",
        SURFACE_LIGHTING: "tool-event/surface-lighting",
        SLOPE_TOOL: "tool-event/slope-tool",
        ESP_TOOL: "tool-event/esp-tool",
        LOGIN_TOOL: "tool-event/login-tool"
    });
});
