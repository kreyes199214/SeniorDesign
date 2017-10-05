define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all landing site events
     * @requires dojo/_base/declare
     * @class jpl.events.LandingSiteEvent
     */
    return declare(null, /** @lends jpl.events.LandingSiteEvent.prototype */ {
        /**
         * @property {string} - all landing sites have been loaded
         * @type {string}
         * @description all landing sites have been loaded
         */
        LANDING_SITES_LOADED: "landing-site-event/LANDING_SITES-loaded",
        /**
         * @property {string} - a landig site has been added
         * @type {string}
         * @description a landing siite has been added
         */
        LANDING_SITE_ADDED: "landing-site-event/landing-site-added",
        /**
         * @property {string} - a landig site has been removed
         * @type {string}
         * @description a landing site has been removed
         */
        LANDING_SITE_REMOVED: "landing-site-event/landing-site-removed",
        /**
         * @property {string} - a landing site is to be added
         * @type {string}
         * @description a landing site is to be added
         */
        ADD_LANDING_SITE: "landing-site-event/add-landing-site",
        /**
         * @property {string} - a landing site is to be selected
         * @type {string}
         * @description a landing site is to be selected
         */
        SELECT_LANDING_SITE: "landing-site-event/select-landing-site",
        /**
         * @property {string} - landing site loading has finished
         * @type {string}
         * @description landing site loading has finished
         */
        LOADING_FINISHED: "landing-site-event/loading-finished",
        /**
         * @property {string} - a landing site waypoint is hovered
         * @type {string}
         * @description a lan waypoint is hovered
         */
        WAYPOINT_HOVER: "landing-site-event/waypoint-hover",
        /**
         * @property {string} - a mouse leaves landing site waypoint
         * @type {string}
         * @description a mouse leaves landing site waypoint
         */
        WAYPOINT_LEAVE: "landing-site-event/waypoint-leave",
        /**
         * @property {string} - a mouse clicks a landig site waypoint
         * @type {string}
         * @description a mouse clicks a landing site waypoint
         */
        WAYPOINT_CLICK: "landing-site-event/waypoint-click",
        /**
         * @property {string} - view a landing site region
         * @type {string}
         * @description view a landing site region
         */
        VIEW_REGION: "landing-site-event/view-region",
        /**
         * @property {string} - open landing sites gallery in sidebar
         * @type {string}
         * @description open landing sites gallery in sidebar
         */
        LANDING_SITES_OPENED_IN_NAV_BAR: "navigation-event/landing-sites-opened-in-nav-bar",
        /**
         * @property {string} - close landing sites gallery in sidebar
         * @type {string}
         * @description close landing sites gallery in sidebar
         */
        LANDING_SITES_CLOSED_IN_NAV_BAR: "navigation-event/landing-sites-closed-in-nav-bar",
        /**
         * @property {string} - minimize landing site detail
         * @type {string}
         * @description minimize landing site detail
         */
        LANDING_SITE_DETAIL_MINIMIZED: "navigation-event/landing-site-detail-minimized"
    });
});