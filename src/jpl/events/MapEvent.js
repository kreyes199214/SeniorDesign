define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Event class to store constants for all map events
     * @requires dojo/_base/declare
     * @class jpl.events.MapEvent
     */
    return declare(null, /** @lends jpl.events.MapEvent.prototype */ {
        /**
         * @property {string} - initial basemap has been loaded
         * @type {string}
         * @description initial basemap has been loaded
         */
        BASEMAP_LOADED: "load",
        /**
         * @property {string} - center the map at [x,y] position
         * @type {string}
         * @description center the map at [x,y] position
         */
        CENTER_MAP_AT: "map-event/center-map-at",
        /**
         * @property {string} - center the map at [x,y] position and zoom to a specific zoom level
         * @type {string}
         * @description center the map at [x,y] position and zoom to a specific zoom level
         */
        CENTER_ZOOM_MAP_AT: "map-event/center-zoom-map-at",
        /**
         * @property {string} - center the map at [x,y] position and zoom to a specific zoom level
         * @type {string}
         * @description centered the map at [x,y] position and zoom to a specific zoom level
         */
        CENTERED_ZOOM_MAP_AT: "map-event/centered-zoom-map-at",
        /**
         * @property {string} - change the map's selected basemap
         * @type {string}
         * @description change the map's selected basemap
         */
        CHANGE_BASEMAP: "map-event/change-basemap",
        /**
         * @property {string} - change the map's projection
         * @type {string}
         * @description change the map's projection.
         */
        CHANGE_PROJECTION: "map-event/change-projection",
        /**
         * @property {string} - change the map's scalebar type
         * @type {string}
         * @description change the map's scalebar type
         */
        CHANGE_SCALEBAR: "map-event/change-scalebar",
        /**
         * @property {string} - close any open map info windows
         * @type {string}
         * @description close any open map info windows
         */
        CLOSE_OVERHEAD_POPUP: "map-event/disable-overhead-popup",
        /**
         * @property {string} - explore widget has been initialized
         * @type {string}
         * @description explore widget has been initialized
         */
        EXPLORE_COMPLETE: "map-event/explore-complete",
        /**
         * @property {string} - map extent has changed
         * @type {string}
         * @description map extent has changed
         */
        EXTENT_CHANGED: "extent-change",
        /**
         * @property {string} - fly the user to terrain (3D) view
         * @type {string}
         * @description fly the user to terrain (3D) view
         */
        FLY_TO_TERRAIN: "map-event/fly-to-terrain",
        /**
         * @property {string} - mouse has moved on 3D globe
         * @type {string}
         * @description mouse has moved on 3D globe
         */
        GLOBE_MOUSE_MOVED: "map-event/globe-mouse-moved",
        /**
         * @property {string} - map scalebars have been initialized
         * @type {string}
         * @description map scalebars have been initialized
         */
        INITIALIZE_SCALEBARS: "map-event/init-scalebars",
        /**
         * @property {string} - a layer has been added to map
         * @type {string}
         * @description a layer has been added to map
         */
        LAYER_ADDED: "map-event/layeradded",
        /**
         * @property {string} - map has been initialized
         * @type {string}
         * @description map has been initialized
         */
        MAP_INITIALIZED: "map-event/map-initialized",
        /**
         * @property {string} - map has been moved
         * @type {string}
         * @description map has been moved
         */
        MAP_MOVED: "map-event/map-moved",
        /**
         * @property {string} - map is ready for use. May be fired multiple times since it is per map (2D or 3D)
         * @type {string}
         * @description map is ready for use. May be fired multiple times since it is per map (2D or 3D)
         */
        MAP_READY: "map-event/map-ready",
        /**
         * @property {string} - enable 2D map view
         * @type {string}
         * @description enable 2D map view
         */
        MAP_VIEW: "map-event/map-view",
        /**
         * @property {string} - move the map
         * @type {string}
         * @description move the map
         */
        MOVE_MAP: "map-event/move-map",
        /**
         * @property {string} - minimap has been clicked
         * @type {string}
         * @description minimap has been clicked
         */
        MINIMAP_CLICKED: "map-event/minimap-clicked",
        /**
         * @property {string} - 2D map mouse coordinate change
         * @type {string}
         * @description 2D map mouse coordinate change
         */
        MOUSE_COORDINATE_CHANGE: "map-event/mouse-coordinate-change",
        /**
         * @property {string} - 2D map mouse move
         * @type {string}
         * @description 2D map mouse move
         */
        MOUSE_MOVED: "mouse-move",
        /**
         * @property {string} - map panning has ended
         * @type {string}
         * @description map panning has ended
         */
        PAN_END: "pan-end",
        /**
         * @property {string} - map panning has started
         * @type {string}
         * @description map panning has started
         */
        PAN_START: "pan-start",
        /**
         * @property {string} - prevent elevation plots to start with scrollbar
         * @type {string}
         * @description prevent elevation plots to start with scrollbar
         */
        PREVENT_ELEVATION_PLOT_SCROLL: "map-prevent-elevation-plot-scroll",
        /**
         * @property {string} - map projection has been changed
         * @type {string}
         * @description map projection has been changed
         */
        PROJECTION_CHANGED: "map-event/projection-changed",
        /**
         * @property {string} - set the map extent
         * @type {string}
         * @description set the map extent
         */
        REGION_LABEL_SELECTED: "map-event/region-label-selected",
        /**
         * @property {string} - set the map extent
         * @type {string}
         * @description set the map extent
        */
        SET_EXTENT: "map-event/set-extent",
        /**
         * @property {string} - show a map info window
         * @type {string}
         * @description show a map info window
         */
        SHOW_INFOWINDOW: "map-event/show-infowindow",
        /**
         * @property {string} - show 3D terrain view
         * @type {string}
         * @description show 3D terrain view
         */
        TERRAIN_VIEW: "map-event/terrain-view",
        /**
         * @property {string} - map tool has been selected
         * @type {string}
         * @description map tool has been selected
         */
        TOOL_SELECTED: "map-event/tool-selected",
        /**
         * @property {string} - zoom in on map
         * @type {string}
         * @description zoom in on map
         */
        ZOOM_IN: "map-event/map-zoom-in",
        /**
         * @property {string} - zoom out on map
         * @type {string}
         * @description zoom out on map
         */
        ZOOM_OUT: "map-event/map-zoom-out",
        /**
         * @property {string} - zooming has ended
         * @type {string}
         * @description zooming has ended
         */
        ZOOM_END: "zoom-end",
        /**
         * @property {string} - set the 3D view extent
         * @type {string}
         * @description set the 3D view extent
         */
        GLOBE_SET_EXTENT: "map-event/globe-set-extent",
        /**
         * @property {string} - set the 3D center coordinate
         * @type {string}
         * @description set the 3D center coordinate
         */
        GLOBE_SET_CENTER: "map-event/globe-set-center",
        /**
         * @property {string} - 3D has been initialized
         * @type {string}
         * @description 3D has been initialized
         */
        GLOBE_INITIALIZED: "map-event/globe-initialized",
        /**
         * @property {string} - 3D zoom in has started
         * @type {string}
         * @description 3d zoom in has started
         */
        GLOBE_ZOOM_IN_START: "map-event/globe-zoom-in-start",
        /**
         * @property {string} - 3D zoom in has ended
         * @type {string}
         * @description 3D zoom in has ended
         */
        GLOBE_ZOOM_IN_END: "map-event/globe-zoom-in-end",
        /**
         * @property {string} - 3D zoom out has started
         * @type {string}
         * @description 3D zoom out has started
         */
        GLOBE_ZOOM_OUT_START: "map-event/globe-zoom-out-start",
        /**
         * @property {string} - 3D zoom out has ended
         * @type {string}
         * @description 3D zoom out has ended
         */
        GLOBE_ZOOM_OUT_END: "map-event/globe-zoom-out-end",
        /**
         * @property {string} - toggle 3D game controls
         * @type {string}
         * @description toggle 3D game controls
         */
        TOGGLE_GAME_CONTROLS: "map-event/toggle-game-controls",
        /**
         * @property {string} - minimize 3D container
         * @type {string}
         * @description minimize 3D container
         */
        MINIMIZE_3D_CONTAINER: "map-event/minimize-3d-container",
        /**
         * @property {string} - maximize 3D container
         * @type {string}
         * @description maximize 3D container
         */
        MAXIMIZE_3D_CONTAINER: "map-event/maximize-3d-container",
        /**
         * @property {string} - view 3D mode
         * @type {string}
         * @description viw 3D mode
         */
        VIEW_3D: "map-event/view-3d",
        /**
         * @property {string} - view 2D mode
         * @type {string}
         * @description view 2D mode
         */
        VIEW_2D: "map-event/view-2d",
        /**
         * @property {string} - begin 3D tour
         * @type {string}
         * @description begin 3D tour
         */
        VIEW_VR: "map-event/view-vr",
        BEGIN_TOUR_3D: "map-event/tour-3d",
        /**
         * @property {string} - end 3D tour
         * @type {string}
         * @description end 3D tour
         */
        EXIT_TOUR_3D: "map-event/exit-tour-3d",
        /**
         * @property {string} - tour info window closed
         * @type {string}
         * @description tour info window closed
         */
        INFO_CLOSED: "map-event/info-closed",
        /**
         * @property {string} - reload map tiles
         * @type {string}
         * @description reload map tiles
         */
        RELOAD_TILES: "map-event/reload-tiles",
        /**
         * @property {string} - map level of depth update
         * @type {string}
         * @description map level of depth update
         */
        LOD_UPDATE: "map-event/lod-update",
        /**
         * @property {string} - map permalink loaded
         * @type {string}
         * @description map permalink loaded
         */
        MAPLINK_LOADED: "map-event/maplink-updated",
        /**
         * @property {string} - 3D tour timeline hidden
         * @type {string}
         * @description 3D tour timeline hidden
         */
        TIMELINE_DOWN: "map-event/timeline-downed",
        /**
         * @property {string} - show 3D tour help
         * @type {string}
         * @description show 3D tour help
         */
        SHOW_FLY_OVER_TOUR_HELP: "map-event/show-fly-over-tour-help",
        CHANGE_TERRAIN_EXAGGERATION: "map-event/terrain-exaggeration-clicked",
        MAP_CLICKED: "map-event/map-clicked",
        FLY_TO_COORDINATE: "map-event/fly-to-coordinate",
        ADD_EXPLORER_HIGH_LIGHT_POLYGON: "map-event/add-explorer-high-light-polygon",
        REMOVE_EXPLORER_HIGH_LIGHT_POLYGON: "map-event/remove-explorer-high-light-polygon",
        REMOVE_ALL_EXPLORER_GRAPHICS: "tool-event/remove-all-explorer-graphics"
    });
});
