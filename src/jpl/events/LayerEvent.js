define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all bookmark events
     * @requires dojo/_base/declare
     * @class jpl.events.LayerEvent
     */
    return declare(null,  /** @lends jpl.events.LayerEvent.prototype */ {
        /**
         * @property {string} - basemaps have all been loaded
         * @type {string}
         * @description basemaps have all been loaded
         */
        BASEMAPS_LOADED: "layer-event/basemaps-loaded",
        /**
         * @property {string} - selected basemap changes
         * @type {string}
         * @description selected basemap changes
         */
        BASEMAP_CHANGED: "layer-event/basemap-changed",
        /**
         * @property {string} - basemap container widget is shown
         * @type {string}
         * @description basemap container widget is shown
         */
        SHOW_BASEMAP_CONTAINER: "layer-event/show-basemap-container",
        /**
         * @property {string} - basemap container widget is hidden
         * @type {string}
         * @description basemap container widget is hidden
         */
        HIDE_BASEMAP_CONTAINER: "layer-event/hide-basemap-container",
        /**
         * @property {string} - all layers have been loaded
         * @type {string}
         * @description all layers have been loaded
         */
        LAYERS_LOADED: "layer-event/layers-loaded",
        /**
         * @property {string} - a layer control has been loaded
         * @type {string}
         * @description a layer control has been loaded
         */
        LAYER_CONTROL_LOADED: "layer-event/layer-control-loaded",
        /**
         * @property {string} - layers have been changed
         * @type {string}
         * @description layers have been changed
         */
        LAYERS_CHANGED: "layer-event/layers-changed",
        /**
         * @property {string} - layer is added to My Data widget
         * @type {string}
         * @description layer is added to My Data widget
         */
        ADD_TO_MY_DATA: "layer-event/add-to-my-data",
        /**
         * @property {string} - layer is added as static layer
         * @type {string}
         * @description layer is added as static layer
         */
        ADD_TO_STATIC_LAYERS: "layer-event/add-to-static-layers",
        REMOVE_FROM_STATIC_LAYERS: "layer-event/remove-from-static-layers",
        /**
         * @property {string} - all catalog data is loaded
         * @type {string}
         * @description all catalog data is loaded
         */
        SET_UP_CATALOG_DATA: "layer-event/set-up-options-data",
        /**
         * @property {string} - added layers container widget is shown
         * @type {string}
         * @description added layers container widget is shown
         */
        SHOW_ADDED_LAYERS_CONTAINER: "layer-event/show-added-layers-container",
        /**
         * @property {string} - added layers container widget is hidden
         * @type {string}
         * @description added layers container widget is hidden
         */
        HIDE_ADDED_LAYERS_CONTAINER: "layer-event/hide-added-layers-container",
        /**
         * @property {string} - layer is removed from My Data widget
         * @type {string}
         * @description layer is removed from My Data widget
         */
        REMOVE_FROM_MY_DATA: "layer-event/remove-from-my-data",
        /**
         * @property {string} - event to change layer's opacity value
         * @type {string}
         * @description event to change layer's opacity value
         */
        CHANGE_OPACITY: "layer-event/change-opacity",
        /**
         * @property {string} - layer's opacity value is changed
         * @type {string}
         * @description layer's opacity value is changed
         */
        OPACITY_CHANGED: "layer-event/opacity-changed",
        /**
         * @property {string} - event to show a layer
         * @type {string}
         * @description event to show a layer
         */
        SHOW_LAYER: "layer-event/show-layer",
        LAYER_SHOWN: "layer-event/layer-shown",
        /**
         * @property {string} - event to hide a layer
         * @type {string}
         * @description event to hide a layer
         */
        HIDE_LAYER: "layer-event/hide-layer",
        LAYER_HIDDEN: "layer-event/layer-hidden",
        /**
         * @property {string} - event to reorder all layers
         * @type {string}
         * @description event to reorder all layers
         */
        REORDER_LAYERS: "layer-event/reorder-layers",
        REORDER_LAYERS_REQUST: "layer-event/reorder-layers-request",
        /**
         * @property {string} - layer control is removed
         * @type {string}
         * @description layer control is removed
         */
        REMOVE_LAYER_CONTROL: "layer-event/remove-layer-control",
        /**
         * @property {string} - optional layer control is removed
         * @type {string}
         * @description optional layer control is removed
         */
        RESET_LAYER_OPTIONAL_CONTROL: "layer-event/remove-layer-optional-control",
        /**
         * @property {string} - explore container is shown
         * @type {string}
         * @description explore container is shown
         */
        SHOW_EXPLORE_CONTAINER: "layer-event/show-explore-container",
        /**
         * @property {string} - layer's visibility is toggled
         * @type {string}
         * @description layer's visibility is toggled
         */
        TOGGLE_VISIBILITY: "layer-event/toggle-visibility",
        /**
         * @property {string} - explore container is hidden
         * @type {string}
         * @description explore container is hidden
         */
        HIDE_EXPLORE_CONTAINER: "layer-event/hide-explore-container",
        /**
         * @property {string} - layer gallery has been fully initialized
         * @type {string}
         * @description layer gallery has been fully initialized
         */
        LAYER_GALLERY_INITIALIZED: "layer-event/layer-gallery-init",

        ADD_TO_ACTIVE_LAYERS: "layer-event/add-to-active-layers",

        REMOVE_FROM_ACTIVE_LAYERS: "layer-event/remove-from-active-layers",

        ADD_TO_AUTO_LAYERS: "layer-event/add-to-auto-layers",

        REMOVE_FROM_AUTO_LAYERS: "layer-event/remove-from-auto-layers",

        REMOVE_FROM_LAYER_VIEWER: "layer-event/remove-from-layer-viewer",

        TOGGLE_AUTO_LAYERS: "layer-event/toggle-auto-layer",

        TOGGLE_AUTO_LAYER_SECTION: "layer-event/toggle-auto-layer-section",

        TOGGLE_AUTO_LAYER_SECTION_FOOTPRINT: "layer-event/toggle-auto-layer-section-footprint",

        ADD_SECTION_TO_AUTO_LAYERS: "layer-event/add-section-to-auto-layers",

        ADD_SET_TO_ACTIVE_LAYERS: "layer-event/add-set-to-auto-layers",

        REMOVE_SET_FROM_ACTIVE_LAYERS: "layer-event/remove-set-from-auto-layers",

        CREATE_MANAGER_FOR_AUTO_LAYER_SET: "layer-event/create-manager-for-auto-layer-set",

        REMOVE_MANAGER_FOR_AUTO_LAYER_SET: "layer-event/remove-manager-for-auto-layer-set",

        SHOW_ALL_AUTO_LAYERS_IN_SET: "layer-event/show-all-auto-layers-in-set",

        HIDE_ALL_AUTO_LAYERS_IN_SET: "layer-event/hide-all-auto-layers-in-set",

        REMOVE_ALL_AUTO_LAYERS_IN_SET: "layer-event/remove-all-auto-layers-in-set",

        TOGGLE_AUTO_LAYER_VISIBILITY: "layer-event/toggle-auto-layer-visibility",

        REMOVE_FROM_LAYER_SET_VIEWER: "layer-event/remove-from-layer-set-viewer",

        CHANGE_AUTO_LAYER_SECTION_OPACITIES: "layer-event/change-auto-layer-section-opacities",

        AUTO_LAYER_SET_REORDERED: "layer-event/auto-layer-set-reordered",

        CHECK_IF_LAYER_SET_ADDED: "layer-event/check-if-layer-set-added",

        CHECK_IF_LAYER_SET_ADDED_RESPONSE: "layer-event/check-if-layer-set-added-response",

        ADD_LAYER_TO_3D_FOR_MARTIAN: "layer-event/add-layer-to-3d-for-martian"
    });
});