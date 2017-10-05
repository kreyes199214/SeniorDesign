define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all search events
     * @requires dojo/_base/declare
     * @class jpl.events.SearchEvent
     */
    return declare(null, /** @lends jpl.events.NavigationEvent.prototype */ {
        /**
         * @property {string} - performs a search
         * @type {string}
         * @description performs a serch
         */
        SEARCH: "search-event/search",
        /**
         * @property {string} - show the search results container
         * @type {string}
         * @description show the search results container
         */
        SHOW_SEARCH_CONTAINER: "search-event/show-search-container",
        /**
         * @property {string} - hide the search results container
         * @type {string}
         * @description hide the search results container
         */
        HIDE_SEARCH_CONTAINER: "search-event/hide-search-container",
        /**
         * @property {string} - search nomenclature result has been clicked
         * @type {string}
         * @description search nomenclature has been clicked
         */
        NOMENCLATURE_CLICKED: "search-event/nomenclature-clicked",
        NOMENCLATURE_MORE_BTN_PRESSED: "search-event/nomenclature-more-btn-pressed",
        FEATURE_MORE_BTN_PRESSED: "search-event/feature-more-btn-pressed",
        SLIDESHOW_MORE_BTN_PRESSED: "search-event/slideshow-more-btn-pressed",
        TREE_ITEM_MAP_POPUP_MORE_BTN_PRESSED: "search-event/tree-item-map-popup-more-btn-pressed"
    });
});