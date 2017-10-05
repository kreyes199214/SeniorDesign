define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/window",
    "dojo/has",
    "dojo/on",
    "dojo/topic",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/query",
    "dojo/_base/fx",
    "dojo/request/xhr",
    "dojo/i18n!./nls/textContent",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/ControlBar.html',
    "xstyle/css!./css/ControlBar.css",
    "jpl/config/Config",
    "jpl/dijit/ScaleBar",
    "jpl/dijit/ScaleBarPolar",
    "jpl/events/SearchEvent",
    "jpl/events/MapEvent",
    "jpl/events/BrowserEvent",
    "jpl/events/LayerEvent",
    "jpl/events/NavigationEvent",
    "jpl/events/BookmarkEvent",
    "jpl/dijit/MenuSidebar",
    "jpl/dijit/ToolSidebar",
    "jpl/dijit/SearchSidebar",
    "jpl/dijit/ExplorerSidebar",
    "jpl/dijit/LayersSidebar",
    "jpl/dijit/TreeSidebar",
    "jpl/dijit/NonIndexerLayersSidebar",
    "jpl/utils/MapUtil",
    "jpl/utils/FeatureDetector",
    "jpl/utils/DOMUtil",
    "jpl/dijit/ui/Instagram",
    "jpl/dijit/ui/FBShare",
    "jpl/dijit/ui/TumblrShare",
    "jpl/dijit/ui/TwitterShare",
    "jpl/dijit/ui/ShareModalDialog",
    "jpl/dijit/ui/TerrainExaggerationInputDialog",
    "jpl/utils/IndexerUtil",
    "jpl/dijit/ui/ScreenShot",
    "jpl/data/BaseMaps",
    "jpl/events/LoadingEvent",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "esri/graphic",
    "dojo/NodeList-traverse",
    "dojo/NodeList-dom",
    "bootstrap/Tooltip"
], function (declare, lang, win, has, on, topic, domStyle, domConstruct, domAttr,
             domClass, query, fx, xhr, textContent, registry, _WidgetBase, _TemplatedMixin,
             template, css, Config, ScaleBar, ScaleBarPolar, SearchEvent, MapEvent,
             BrowserEvent, LayerEvent, NavigationEvent, BookmarkEvent, MenuSidebar,
             ToolSidebar, SearchSidebar, ExplorerSidebar, LayersSidebar, TreeSidebar, NonIndexerLayersSidebar,
             MapUtil, FeatureDetector, DOMUtil, Instagram, FBShare, TumblrShare, TwitterShare,
             ShareModalDialog, TerrainExaggerationInputDialog, IndexerUtil, ScreenShot, BaseMaps, LoadingEvent, Point, SimpleMarkerSymbol,
             Color, Graphic) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        activeControlOption: "",
        currentView: "map",
        gameControlsEnabled: false,
        terrainExaggerationValue: 1,
        bookmarkAddedCount: 0,
        isMenuOpen:false,
        isToolMenuOpen: false,
        isSearchMenuOpen: false,
        isTreeMenuOpen: false,
        isExplorerMenuOpen: false,
        isLayersMenuOpen: false,
        isProjectionsMenuOpen: false,
        menuSidebar: null,
        searchSidebar: null,
        treeSidebar: null,
        toolSidebar: null,
        explorerSidebar: null,
        layersSidebar: null,
        projection: null,
        flyToOpen: false,
        shareOpen: false,
        indexerUtil: null,
        mapDijit: null,
        disableCloseSidebarsOnMapClick: false,

        constructor: function () {
        },

        postCreate: function () {
        },

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.basemapsInstance = BaseMaps.getInstance();

            this.setUpUi();

            this.setEventHandlers();
            this.setProjections();
            this.setSubscriptions();

            //setDefaultProjection
            this.projection = this.config.projection.EQUIRECT;

        },

        setUpUi: function(){

            var menuSidebar = new MenuSidebar();
            menuSidebar.placeAt(win.body());
            this.setMenuSidebar(menuSidebar);
            menuSidebar.setControlBar(this);
            menuSidebar.startup();
            on(this.controlItemMenu, "click", lang.hitch(this, this.activateMenu));

            if(this.config.controls.explore){
                var explorerSidebar = new ExplorerSidebar();
                explorerSidebar.placeAt(win.body());
                this.setExplorerSidebar(explorerSidebar);
                explorerSidebar.setControlBar(this);
                explorerSidebar.startup();
                on(this.controlItemExplorer, "click", lang.hitch(this, this.activateExplorer));
            }
            else{
                domClass.add(this.controlItemExplorer, "hidden");
            }

            /*
            if(this.config.controls.layers && !this.config.controls.tree){
                if(this.config.useIndexerLayers) {
                    var layersSidebar = new LayersSidebar();
                    layersSidebar.placeAt(win.body());
                    this.setLayersSidebar(layersSidebar);
                    layersSidebar.setControlBar(this);
                    layersSidebar.startup();
                    on(this.controlItemLayers, "click", lang.hitch(this, this.activateLayers));
                }
                else{
                    var layersSidebar = new NonIndexerLayersSidebar();
                    layersSidebar.placeAt(win.body());
                    this.setLayersSidebar(layersSidebar);
                    layersSidebar.setControlBar(this);
                    layersSidebar.startup();
                    on(this.controlItemLayers, "click", lang.hitch(this, this.activateLayers));
                }
            }
            */
            if(this.config.controls.layers && !this.config.controls.tree){
                var layersSidebar = new LayersSidebar();
                layersSidebar.placeAt(win.body());
                this.setLayersSidebar(layersSidebar);
                layersSidebar.setControlBar(this);
                layersSidebar.startup();
                on(this.controlItemLayers, "click", lang.hitch(this, this.activateLayers));
            }
            else{
                domClass.add(this.controlItemLayers, "hidden");
            }

            if(this.config.controls.search){
                var searchSidebar = new SearchSidebar();
                searchSidebar.placeAt(win.body());
                this.setSearchSidebar(searchSidebar);
                searchSidebar.setControlBar(this);
                searchSidebar.startup();
                on(this.controlItemSearch, "click", lang.hitch(this, this.activateSearch));
            }
            else{
                domClass.add(this.controlItemSearch, "hidden");
            }

            if(this.config.controls.tree){
                var treeSidebar = new TreeSidebar();
                treeSidebar.placeAt(win.body());
                this.setTreeSidebar(treeSidebar);
                treeSidebar.setControlBar(this);
                treeSidebar.startup();
                on(this.controlItemTree, "click", lang.hitch(this, this.activateTree));
            }
            else{
                domClass.add(this.controlItemTree, "hidden");
            }


            if(this.config.controls.tools){
                var toolSidebar = new ToolSidebar();
                toolSidebar.placeAt(win.body());
                this.setToolSidebar(toolSidebar);
                toolSidebar.setControlBar(this);
                toolSidebar.startup();
                on(this.controlItemTools, "click", lang.hitch(this, this.activateTools));
            }
            else{
                domClass.add(this.controlItemTools, "hidden");
            }

            if(this.config.controls.projection){
                on(this.controlItemProjections, "click", lang.hitch(this, this.activateProjections));
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            }
            else{
                domClass.add(this.controlItemProjections, "hidden");
            }

            if(this.config.controls.socialmedia){
                on(this.controlItemShare, "click", lang.hitch(this, this.toggleShareOptions));
                on(this.controlItemScreenShot, "click", lang.hitch(this, this.screenShot));
                on(this.controlItemShareLink, "click", lang.hitch(this, this.shareLink));
            }
            else{
                domClass.add(this.controlItemShare, "hidden");
                domClass.add(this.shareBtnGroup, "hidden");
            }

            if(this.config.controls.flyto){
                on(this.flyToButton, "click", lang.hitch(this, this.openFlyTo));
                on(this.flyToInput, "keyup", lang.hitch(this, this.inputFlyToText));
            }
            else{
                domClass.add(this.flyToButton, "hidden");
            }

            if(this.config.controls.scalebars){
                topic.subscribe(MapEvent.prototype.INITIALIZE_SCALEBARS, lang.hitch(this, this.initScalebars));
            }

            if(this.detectedFeatures.mobileDevice) {
                domClass.add(this.mapDetailsPositionContainer, "hidden");
            }

            if (!this.detectedFeatures.isNightly38()) {
                domClass.add(this.changeProjectionVRBtn, "hidden");
            }

            if(this.config.tools.createBookmarks){
                on(this.controlItemBookmarkEndDrawing, "click", lang.hitch(this, this.endBookmarkDrawing));
                on(this.annotationColorSelector, "change", lang.hitch(this, this.annotationColorSelectorChanged));
            }

            topic.subscribe(LoadingEvent.prototype.END_DOWNLOAD, lang.hitch(this, this.screenShotDone));
            topic.subscribe(NavigationEvent.prototype.ENABLE_CLOSE_SIDEBAR_ON_MAP_CLICK, lang.hitch(this, this.enableCloseSidebarOnMapClick));
        },

        setEventHandlers: function() {
            on(document, ".controls-link:click", this.controlLinkClicked);

            on(this.mapZoomInBtn, "click", lang.hitch(this, this.mapZoomInClicked));
            on(this.mapZoomInBtn, "mousedown", lang.hitch(this, this.mapZoomInHold));
            on(this.mapZoomInBtn, "mouseup", lang.hitch(this, this.mapZoomInRelease));
            on(this.mapZoomInBtn, "mouseout", lang.hitch(this, this.mapZoomInRelease));

            on(this.mapZoomOutBtn, "click", lang.hitch(this, this.mapZoomOutClicked));
            on(this.mapZoomOutBtn, "mousedown", lang.hitch(this, this.mapZoomOutHold));
            on(this.mapZoomOutBtn, "mouseup", lang.hitch(this, this.mapZoomOutRelease));
            on(this.mapZoomOutBtn, "mouseout", lang.hitch(this, this.mapZoomOutRelease));

            //on(this.view3DBtn, "click", lang.hitch(this, this.view3DClicked));
            on(this.changeProjection3DBtn, "click", lang.hitch(this, this.view3DClicked));
            on(this.changeProjection2DBtn, "click", lang.hitch(this, this.view2DClicked));
            on(this.changeProjectionVRBtn, "click", lang.hitch(this, this.viewVRClicked));

            on(this.changeProjectionNorthPoleBtn, "click", lang.hitch(this, this.changeProjection));
            on(this.changeProjectionCylindicalBtn, "click", lang.hitch(this, this.changeProjection));
            on(this.changeProjectionSouthPoleBtn, "click", lang.hitch(this, this.changeProjection));

            if(this.controlItemFacebookLink) {
                on(this.controlItemFacebookLink, "click", lang.hitch(this, this.facebookShare));
            }
            if(this.controlItemInstagramLink) {
                on(this.controlItemInstagramLink, "click", lang.hitch(this, this.instagramShare));
            }
            if(this.controlItemTumblrLink) {
                on(this.controlItemTumblrLink, "click", lang.hitch(this, this.tumblrShare));
            }
            if(this.controlItemTwitterLink) {
                on(this.controlItemTwitterLink, "click", lang.hitch(this, this.twitterShare));
            }

            if(!this.detectedFeatures.mobileDevice && this.detectedFeatures.webGL) {
                on(this.gameControlsContainer, "click", lang.hitch(this, this.gameControlsClicked));
                on(this.terrainExaggerationContainer, "click", lang.hitch(this, this.terrainExaggerationContainerClicked));
                topic.subscribe(MapEvent.prototype.CHANGE_TERRAIN_EXAGGERATION, lang.hitch(this, this.changeTerrainExaggerationText));
            }
        },

        setSubscriptions: function(){
            topic.subscribe(NavigationEvent.prototype.CLOSE_SIDEBAR, lang.hitch(this, this.closeSidebars));

            if(!this.detectedFeatures.mobileDevice) {
                topic.subscribe(MapEvent.prototype.MOUSE_COORDINATE_CHANGE, lang.hitch(this, this.updatePositionLabel));
            }

            topic.subscribe(SearchEvent.prototype.NOMENCLATURE_MORE_BTN_PRESSED, lang.hitch(this, this.showNomenclatureDetailByDbid));
            topic.subscribe(SearchEvent.prototype.SLIDESHOW_MORE_BTN_PRESSED, lang.hitch(this, this.showSlideshowDetailByDbid));
            topic.subscribe(SearchEvent.prototype.FEATURE_MORE_BTN_PRESSED, lang.hitch(this, this.showFeatureDetailByDbid));
            topic.subscribe(SearchEvent.prototype.TREE_ITEM_MAP_POPUP_MORE_BTN_PRESSED, lang.hitch(this, this.showTreeListItemDetailByDbid));
            topic.subscribe(NavigationEvent.prototype.OPEN_TOOL_SIDEBAR, lang.hitch(this, this.openToolbar));
            topic.subscribe(NavigationEvent.prototype.HIDE_UI_BUTTONS, lang.hitch(this, this.hideButtons));
            topic.subscribe(NavigationEvent.prototype.SHOW_UI_BUTTONS, lang.hitch(this, this.showButtons));
            topic.subscribe(NavigationEvent.prototype.SHOW_BOOKMARK_END_DRAW_UI_BUTTON, lang.hitch(this, this.showBookmarkEndDrawButton));
            topic.subscribe(NavigationEvent.prototype.HIDE_BOOKMARK_END_DRAW_UI_BUTTON, lang.hitch(this, this.hideBookmarkEndDrawButton));
            topic.subscribe(MapEvent.prototype.MAP_CLICKED, lang.hitch(this, this.mapClicked));

            topic.subscribe(MapEvent.prototype.VIEW_2D, lang.hitch(this, this.view2DEnabled));
            topic.subscribe(LayerEvent.prototype.BASEMAPS_LOADED, lang.hitch(this, this.baseMapsLoaded));
        },

        checkConfiguration: function() {
            if(!has("config-control-search")) {
                this.controlItemSearch = domConstruct.destroy(this.controlItemSearch);
            }
            if(!has("config-control-login")) {
                this.controlItemLogin = domConstruct.destroy(this.controlItemLogin);
            }
            if(!has("config-control-help")) {
                this.controlItemHelp = domConstruct.destroy(this.controlItemInformation);
            }
            if(!has("config-control-layers")) {
                this.controlItemLayers = domConstruct.destroy(this.controlItemLayers);
            }
            if(!has("config-control-slideshow")) {
                this.controlItemSlideshow = domConstruct.destroy(this.controlItemSlideshows);
            }
            if(!has("config-control-explore")) {
                this.controlItemExplore = domConstruct.destroy(this.controlItemExplore);
            }
            if(!has("config-control-tools")) {
                this.controlItemTools = domConstruct.destroy(this.controlItemTools);
            }
            if(!has("config-control-basemaps")) {
                this.controlItemBasemaps = domConstruct.destroy(this.controlItemBasemaps);
            }
            if(!has("config-control-bookmarks")) {
                this.controlItemBookmarks = domConstruct.destroy(this.controlItemBookmarks);
            }
            if(!has("config-control-mappermalink")) {
                this.controlItemMapPermalink = domConstruct.destroy(this.controlItemMapPermalink);
            }
            if(!has("config-control-projection")) {
                this.controlItemProjection = domConstruct.destroy(this.controlItemProjection);
            }
            if(!has("config-control-socialmedia")) {
                this.controlItemShare = domConstruct.destroy(this.controlItemShare);
            }

            if(this.detectedFeatures.mobileDevice) {
                this.overviewBtn = domConstruct.destroy(this.overviewBtn);
                this.fullscreenBtn = domConstruct.destroy(this.fullscreenBtn);
                this.gameControlsContainer = domConstruct.destroy(this.gameControlsContainer);
                this.mapDetailsContainer = domConstruct.destroy(this.mapDetailsContainer);
            }
        },

        initScalebars: function(evt) {
            //equi scalebar
            new ScaleBar({
                map: evt.maps.equirect,
                scalebarUnit: "metric",
                scalebarStyle: "line"
            }, this.equiMapScalebar).startup();

            //north pole scalebar
            new ScaleBarPolar({
                map: evt.maps.northPole,
                scalebarUnit: "metric",
                scalebarStyle: "line"
            }, this.northPoleMapScalebar).startup();

            //south pole scalebar
            new ScaleBarPolar({
                map: evt.maps.southPole,
                scalebarUnit: "metric",
                scalebarStyle: "line"
            }, this.southPoleMapScalebar).startup();
        },

        mapZoomInClicked: function(evt) {
            topic.publish(MapEvent.prototype.ZOOM_IN);
        },

        mapZoomInHold: function(evt) {
            topic.publish(MapEvent.prototype.GLOBE_ZOOM_IN_START);
        },

        mapZoomInRelease: function(evt) {
            topic.publish(MapEvent.prototype.GLOBE_ZOOM_IN_END);
        },

        mapZoomOutClicked: function(evt) {
            topic.publish(MapEvent.prototype.ZOOM_OUT);
        },

        mapZoomOutHold: function(evt) {
            topic.publish(MapEvent.prototype.GLOBE_ZOOM_OUT_START);
        },

        mapZoomOutRelease: function(evt) {
            topic.publish(MapEvent.prototype.GLOBE_ZOOM_OUT_END);
        },

        baseMapsLoaded: function (){
            if (this.basemapsInstance.northLayerList.length == 0) {
                domClass.add(this.changeProjectionNorthPoleBtn, "hidden");
            }

            if (this.basemapsInstance.southLayerList.length == 0) {
                domClass.add(this.changeProjectionSouthPoleBtn, "hidden");
            }
        },

        activateSearch: function(){
            if(!this.isSearchMenuOpen) {
                this.closeSideBars();
                this.searchSidebar.openSearchSidebar({"selectedOption": "Help"});
                this.isSearchMenuOpen = true;
                domClass.add(query(this.controlItemSearch)[0], "hidden");
            }else{
                this.isSearchMenuOpen = false;
                this.searchSidebar.closeSearchSidebar({"selectedOption": "Help"});
                domClass.remove(query(this.controlItemSearch)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix();
            this.resizeFix();
        },

        activateTree: function(){
            if(!this.isTreeMenuOpen) {
                this.closeSideBars();
                this.treeSidebar.openTreeSidebar({"selectedOption": "Help"});
                this.isTreeMenuOpen = true;
                domClass.add(query(this.controlItemTree)[0], "hidden");
            }else{
                this.isTreeMenuOpen = false;
                this.treeSidebar.closeTreeSidebar({"selectedOption": "Help"});
                domClass.remove(query(this.controlItemTree)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix();
            this.resizeFix();
        },

        activateMenu: function(){
            if(!this.isMenuOpen) {
                this.closeSideBars();
                this.menuSidebar.openMenuSidebar({"selectedOption": "Help"});
                this.isMenuOpen = true;
                domClass.add(query(this.controlItemMenu)[0], "hidden");
            }else{
                this.isMenuOpen = false;
                this.menuSidebar.closeMenuSidebar({"selectedOption": "Help"});
                domClass.remove(query(this.controlItemMenu)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix()
            this.resizeFix();
        },

        activateTools: function(){
            if(!this.isToolMenuOpen) {
                this.closeSideBars();
                this.toolSidebar.openToolSidebar({"selectedOption": "Help"});
                this.isToolMenuOpen = true;
                domClass.add(query(this.controlItemTools)[0], "hidden");
            }else{
                this.isToolMenuOpen = false;
                this.toolSidebar.closeToolSidebar({"selectedOption": "Help"});
                domClass.remove(query(this.controlItemTools)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix();
            this.resizeFix();
        },

        activateExplorer: function(){
            if(!this.isExplorerMenuOpen) {
                this.closeSideBars();
                this.explorerSidebar.setIsOpen(true);
                this.explorerSidebar.openExplorerSidebar({"selectedOption": "Help"});
                this.isExplorerMenuOpen = true;
                //domClass.add(query(this.controlItemTools)[0], "hidden");
            }else{
                this.isExplorerMenuOpen = false;
                this.explorerSidebar.setIsOpen(false);
                this.explorerSidebar.closeExplorerSidebar({"selectedOption": "Help"});
                //domClass.remove(query(this.controlItemTools)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix();
            this.resizeFix();
        },


        resizeFix: function(){

            setTimeout(function() {
                on.emit(window, "resize", {
                    bubbles: true,
                    cancelable: true
                });
            },400);

        },

        activateLayers: function(){
            if(!this.isLayersMenuOpen) {
                this.closeSideBars();
                this.layersSidebar.openLayersSidebar({"selectedOption": "Help"});
                this.isLayersMenuOpen = true;
                domClass.add(query(this.controlItemLayers)[0], "hidden");
            }else{
                this.isLayersMenuOpen = false;
                this.layersSidebar.closeLayersSidebar({"selectedOption": "Help"});
                domClass.remove(query(this.controlItemLayers)[0], "hidden");
            }
            //MapUtil.prototype.resizeFix();
            this.resizeFix();
        },

        toggleShareOptions: function(){
            if(this.shareOpen){
                this.closeShareOptions();
            }
            else {
                this.closeSideBars();
                this.openShareOptions();
            }
        },

        shareLink: function(){
            var shareModalDialog = new ShareModalDialog();
            this.closeShareOptions();
        },

        openShareOptions: function(){
            domClass.remove(this.shareBtnGroup, "hidden");
            domClass.add("controlItemShare", "pointyTopRightCorner");
            document.getElementById("controlItemShare").blur();
            this.shareOpen = true;
        },

        closeShareOptions: function(){
            domClass.add(this.shareBtnGroup, "hidden");
            domClass.remove("controlItemShare", "pointyTopRightCorner");
            document.getElementById("controlItemShare").blur();
            this.shareOpen = false;
        },

        activateProjections: function(){

            if(!this.isProjectionsMenuOpen) {
                this.closeSideBars();
                this.isProjectionsMenuOpen = true;
                domClass.remove(query(this.projectionsPanel)[0], "hidden");
            }else{
                this.isProjectionsMenuOpen = false;
                domClass.add(query(this.projectionsPanel)[0], "hidden");
            }
        },

        closeSideBars: function(evt){
            var allowClosingSidebars = true;
            if(evt){
                if(evt.fromEvent){
                    if(evt.fromEvent == "mapClicked"){
                        if(this.disableCloseSidebarsOnMapClick) {
                            allowClosingSidebars = false;
                        }
                    }
                }
            }
            if(allowClosingSidebars) {
                this.isMenuOpen = false;
                this.isSearchMenuOpen = false;
                this.isTreeMenuOpen = false;
                this.isToolMenuOpen = false;
                this.isExplorerMenuOpen = false;
                this.isLayersMenuOpen = false;
                this.isProjectionsMenuOpen = false;

                if (this.menuSidebar) {
                    this.menuSidebar.closeMenuSidebar({"selectedOption": "Help"});
                    domClass.remove(query(this.controlItemMenu)[0], "hidden");
                }
                if (this.searchSidebar) {
                    this.searchSidebar.closeSearchSidebar({"selectedOption": "Help"});
                    domClass.remove(query(this.controlItemSearch)[0], "hidden");
                }
                if (this.treeSidebar) {
                    this.treeSidebar.closeTreeSidebar({"selectedOption": "Help"});
                    domClass.remove(query(this.controlItemTree)[0], "hidden");
                }
                if (this.toolSidebar) {
                    this.toolSidebar.closeToolSidebar({"selectedOption": "Help"});
                    if (this.currentView == "map")
                        domClass.remove(query(this.controlItemTools)[0], "hidden");
                }
                if (this.explorerSidebar) {
                    this.explorerSidebar.closeExplorerSidebar({"selectedOption": "Help"});
                    //if (this.currentView == "map")
                    //  domClass.remove(query(this.controlItemLayers)[0], "hidden");
                }
                if (this.layersSidebar && !this.config.controls.tree) {
                    this.layersSidebar.closeLayersSidebar({"selectedOption": "Help"});
                    domClass.remove(query(this.controlItemLayers)[0], "hidden");
                    domClass.add(query(this.projectionsPanel)[0], "hidden");
                }

                this.closeShareOptions();
                this.shareOpen = false;
                this.closeFlyTo();
                this.flyToOpen = false;
            }

            if(evt){
                if(evt.disable) {
                    if (evt.disable === "mapClicked") {
                        this.disableCloseSidebarsOnMapClick = true;
                    }
                }
            }

            MapUtil.prototype.resizeFix();
        },

        setMenuSidebar: function(menuSidebar){
            this.menuSidebar = menuSidebar;
        },

        setSearchSidebar: function(searchSidebar){
            this.searchSidebar = searchSidebar;
        },

        setTreeSidebar: function(searchSidebar){
            this.treeSidebar = searchSidebar;
        },

        setToolSidebar: function(toolSidebar){
            this.toolSidebar = toolSidebar;
        },

        setExplorerSidebar: function(explorerSidebar){
            this.explorerSidebar = explorerSidebar;
        },

        setLayersSidebar: function(layersSidebar){
            this.layersSidebar = layersSidebar;
        },

        viewVRClicked: function(evt) {
            topic.publish(MapEvent.prototype.VIEW_VR);
        },

        view3DClicked: function(evt){
            if(this.detectedFeatures.webGL && !this.detectedFeatures.mobileDevice) {
                this.view3DEnabled();
                topic.publish(MapEvent.prototype.VIEW_3D);
            } else {
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                    title: "Your Browser Is Not Supported",
                    content: "Your browser does not support viewing in 3D. A desktop web browser with WebGL is required to " +
                    "experience the 3D visualization. The following browsers are known to support WebGL:" +
                    "<ul><li>Google Chrome 18+</li><li>Mozilla Firefox 40.0+</li><li>Apple Safari 8+</li>" +
                    "</ul>",
                    size: "sm"
                });
            }
            domClass.add(query(this.projectionsPanel)[0], "hidden");
            this.isProjectionsMenuOpen = false;
        },

        view2DClicked: function(evt) {
            this.view2DEnabled();
            topic.publish(MapEvent.prototype.VIEW_2D);
            domClass.add(query(this.projectionsPanel)[0], "hidden");
            this.isProjectionsMenuOpen = false;
        },

        view3DEnabled: function(evt) {
            domClass.remove("3dContainer", "hidden");
            domStyle.set("3dContainer", "opacity", "1");
            domStyle.set("3dContainer", "visibility", "visible");

            //domClass.remove(this.changeProjection2DBtn, "hidden");
            domClass.add(this.changeProjection3DBtn, "hidden");

            domClass.add(this.controlItemShare, "hidden");
            domClass.add(this.controlItemTools, "hidden");

            domClass.remove(this.terrainExaggerationContainer, "hidden");

            topic.publish(MapEvent.prototype.MAXIMIZE_3D_CONTAINER);

            this.currentView = "3d";
            //Store projection for when returning to 2D
            //this.storePreviousProjection();
        },

        view2DEnabled: function(evt) {
            //domClass.add("view2DContainer", "hidden");
            //domClass.remove("view3DContainer", "hidden");

            topic.publish(MapEvent.prototype.MINIMIZE_3D_CONTAINER);
            if(this.detectedFeatures.webGL && !this.detectedFeatures.mobileDevice) {
                //domClass.add("3dContainer", "hidden");
            }

            domStyle.set("3dContainer", "opacity", "0.0");
            domStyle.set("3dContainer", "visibility", "hidden");

            domClass.remove(this.mapScalebarsContainer, "hidden");
            domClass.add(this.terrainExaggerationContainer, "hidden");
            //domStyle.set("mapDetailsContainer", "height", "42px");

            domClass.remove(this.changeProjection3DBtn, "hidden");
            domClass.add(this.changeProjection2DBtn, "hidden");

            domClass.remove(this.controlItemShare, "hidden");
            domClass.remove(this.controlItemTools, "hidden");

            //reset the game controls if they were enabled
            if(this.gameControlsEnabled) {
                domClass.add(this.gameControlsContainer, "btn-default");
                domClass.remove(this.gameControlsContainer, "btn-success");
                domClass.remove(this.gameControlsBtn, "controlSelected");
                this.gameControlsEnabled = false;
                topic.publish(MapEvent.prototype.TOGGLE_GAME_CONTROLS);
            }
            this.currentView = "map";

            //this.setPreviousProjection();
        },

        setProjections: function(){
            domAttr.set(this.changeProjectionNorthPoleBtn, "data-projection", this.config.projection.N_POLE);
            domAttr.set(this.changeProjectionCylindicalBtn, "data-projection", this.config.projection.EQUIRECT);
            domAttr.set(this.changeProjectionSouthPoleBtn, "data-projection", this.config.projection.S_POLE);
        },

        changeProjection: function(evt){
            this.projection = evt.projection;
            console.log("change projection evt", evt);
            //var projectionLabel = evt.srcElement.rel;
            var projectionLabel = evt.target.dataset.projection;
            console.log("proj evt rel", projectionLabel);


            //change to 2D if in 3D mode
            console.log("currentView", this.currentView);
            if(this.currentView !== "map") {
                //topic.publish(MapEvent.prototype.VIEW_2D, null);
                this.view2DEnabled({});
                this.currentView = "map";
            }

            topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {projection: projectionLabel});
            if(this.searchSidebar){
                this.searchSidebar.projectionChanged({"projection":projectionLabel});
            }
            if(this.explorerSidebar){
                this.explorerSidebar.projectionChanged({"projection":projectionLabel});
            }
            domClass.add(query(this.projectionsPanel)[0], "hidden");
            this.isProjectionsMenuOpen = false;
        },

        projectionChanged: function(evt) {
            domClass.add(this.equiMapScalebar, "hidden");
            domClass.add(this.northPoleMapScalebar, "hidden");
            domClass.add(this.southPoleMapScalebar, "hidden");

            if(evt.projection === this.config.projection.EQUIRECT) {
                this.projection = this.config.projection.EQUIRECT;

                this.fadeOut(query(".face.one")[0]);
                this.fadeOut(query(".face.three")[0]);
                this.fadeIn(query(".face.two")[0]);

                domClass.remove(this.equiMapScalebar, "hidden");
            } else if(evt.projection === this.config.projection.N_POLE) {
                this.projection = this.config.projection.N_POLE;

                this.fadeOut(query(".face.one")[0]);
                this.fadeOut(query(".face.two")[0]);
                this.fadeIn(query(".face.three")[0]);

                domClass.remove(this.northPoleMapScalebar, "hidden");
            } else if(evt.projection === this.config.projection.S_POLE) {
                this.projection = this.config.projection.S_POLE;

                this.fadeOut(query(".face.three")[0]);
                this.fadeOut(query(".face.two")[0]);
                this.fadeIn(query(".face.one")[0]);

                domClass.remove(this.southPoleMapScalebar, "hidden");
            }

            if(this.searchSidebar){
                //this.searchSidebar.clearViewerContainerContent();
                //this.searchSidebar.projectionChanged({"projection":evt.projection});
            }
            if(this.explorerSidebar){
                this.explorerSidebar.projectionChanged({"projection":evt.projection});
            }
        },

        gameControlsClicked: function(evt) {
            if(this.gameControlsEnabled) {
                domClass.add(this.gameControlsContainer, "btn-default");
                domClass.remove(this.gameControlsContainer, "btn-success");
                domClass.remove(this.gameControlIcon, "controlSelected");
                this.gameControlsEnabled = false;
            } else {
                domClass.remove(this.gameControlsContainer, "btn-default");
                domClass.add(this.gameControlsContainer, "btn-success");
                domClass.add(this.gameControlIcon, "controlSelected");
                this.gameControlsEnabled = true;
            }

            topic.publish(MapEvent.prototype.TOGGLE_GAME_CONTROLS);
        },

        terrainExaggerationContainerClicked: function(evt){
            var terrainExaggerationInputModal = new TerrainExaggerationInputDialog();
            terrainExaggerationInputModal.setValue(this.terrainExaggerationValue);
            terrainExaggerationInputModal.startup();
        },

        changeTerrainExaggerationText: function(evt){
            this.terrainExaggerationValue = evt.terrainExaggerationValue;
            this.terrainExaggerationText.innerHTML = "Terrain Exaggeration: " + evt.terrainExaggerationValue;
        },

        updatePositionLabel: function(evt) {
            var xCoordinate = MapUtil.prototype.formatCoordinate(evt.x, "x");
            var yCoordinate = MapUtil.prototype.formatCoordinate(evt.y, "y");
            var label = "";

            if(xCoordinate !== '-' && yCoordinate !== '-') {
                //label = xCoordinate + "&deg;, " + yCoordinate + "&deg;";
                label = "Lat: " + yCoordinate  + "&deg;, " + "Lon: " + xCoordinate+ "&deg;";
            }

            this.mapMousePosition.innerHTML = label;
        },

        mapClicked: function(){
            this.closeSidebars({"fromEvent":"mapClicked"});
        },

        closeSidebars: function(evt){
            this.closeSideBars(evt);
        },

        showNomenclatureDetailByDbid: function(evt){
            this.isSearchMenuOpen = false;
            this.activateSearch();
            this.searchSidebar.showDetailByDbid(evt.fid, "nomenclature", evt.layer);
        },

        showSlideshowDetailByDbid: function(evt) {
            this.isSearchMenuOpen = false;
            this.activateSearch();
            this.searchSidebar.showDetailByDbid(evt.fid, "slideshow", evt.layer);
        },

        showFeatureDetailByDbid: function(evt) {
            this.isSearchMenuOpen = false;
            this.activateSearch();
            this.searchSidebar.showDetailByDbid(evt.fid, "feature", evt.layer);
        },

        showTreeListItemDetailByDbid: function(evt){
            this.isSearchMenuOpen = false;
            this.activateSearch();
            this.searchSidebar.showDetailByUuid(evt.item_uuid, "treeListItem");
        },

        showDoc: function(doc){
            this.isSearchMenuOpen = false;
            this.activateSearch();
            this.searchSidebar.showDoc(doc);
        },

        facebookShare: function(evt){
          var self = this;
          console.log(self.map);

          console.log('facebookShare');
          console.log(evt);
          self.fbpopup = new FBShare();
          self.fbpopup.placeAt("facebookPopup");
          self.fbpopup.startup();
          //self.fbpopup.print(self.map);

/*
                //alert("PrintTemplate");
                var template = new PrintTemplate();
                template.format = "PDF";
                template.layout = "A4 Landscape";
                template.layoutOptions = {
                        "titleText": "this is my map title",
                        "scalebarUnit": "Kilometers",
                        "copyrightText": "",
                        "showAttribution": false
                }
                template.preserveScale = true;

                //alert("PrintParameters");
                var params = new PrintParameters();
                params.map = self.map;
                params.template = template;

     //var printUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
     var printUrl = "http://gisapps.fortsmithar.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

                var printTask = new PrintTask(printUrl);
                //console.log("printing");
                //alert("printing");
                printTask.execute(params, self.printResult, self.printError);
*/
        },

        printResult: function(result) {
                window.open(result.url, "_blank")
        },

        printError: function(error) {
                //alert(error);
        },

        instagramShare: function(evt){
          console.log('instagramShare');
          var ss = new Instagram();
          ss.startup();
        },

        tumblrShare: function(evt){
          console.log('tumblrShare');
          var tlr = new TumblrShare();
          tlr.startup();
        },

        twitterShare: function(evt){
          console.log('twitterShare');
          var tlr = new TwitterShare();
          tlr.startup();
        },

        openFlyTo: function(evt){
            if(this.flyToOpen){
                if(this.currentView === "map"){
                    var map = this.getMap();
                    var configExtent;
                    if(this.projection === this.config.projection.EQUIRECT) {
                        configExtent = this.config.data.extents.equirect;
                    } else if(this.projection === this.config.projection.N_POLE) {
                        configExtent = this.config.data.extents.northpole;
                    } else if(this.projection === this.config.projection.S_POLE) {
                        configExtent = this.config.data.extents.southpole;
                    }

                    var extent = {
                        "xmin": configExtent.xmin,
                        "ymin": configExtent.ymin,
                        "xmax": configExtent.xmax,
                        "ymax": configExtent.ymax,
                        "projection": this.projection
                    };

                    topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});
                }
                if(this.currentView === "3d"){
                    topic.publish(MapEvent.prototype.FLY_TO_COORDINATE, {"lat":0,"lon":0,"zoom":10000000});
                }
                this.flyToOpen = false;
                this.closeFlyTo();
            }
            else {
                this.closeSideBars();
                domClass.remove(this.flyToInput, "hidden");
                domClass.remove(this.flyToButtonIcon, "fa-plane");
                domClass.add(this.flyToButtonIcon, "fa-home");

                domClass.remove(this.flyToInputValidation, "has-success");
                domClass.remove(this.flyToInputValidation, "has-error");

                var input = document.getElementById('flyToInput');
                input.value = "";
                input.focus();
                input.select();
                this.flyToOpen = true;
            }

        },

        closeFlyTo: function(evt){
            domClass.add(this.flyToInput, "hidden");
            domClass.remove(this.flyToButtonIcon, "fa-home");
            domClass.add(this.flyToButtonIcon, "fa-plane");
            domClass.add("flyToNomenclatureResults", "hidden");
        },

        inputFlyToText: function(evt){
            if(evt.key === "Enter"){
                var validatedText = this.validateFlyToInputText(evt.target.value, true);
                if(validatedText !== null) {
                    if(this.currentView === "map"){
                        this.panMap(validatedText.lat,validatedText.lon);
                    }
                    if(this.currentView === "3d"){
                        topic.publish(MapEvent.prototype.FLY_TO_COORDINATE, validatedText);
                    }

                    this.closeFlyTo({});
                    this.flyToOpen = false;
                }
            }
            else{
                this.validateFlyToInputText(evt.target.value, false);
            }
        },

        validateFlyToInputText: function(input, isEntered){
            var isValid = false;
            var lat,lon,zoom;

            if (input.indexOf(',') > -1) {//if is coordinates
                if (this.currentView === "map") {
                    var splitted = input.split(",");
                    if (splitted.length === 2) {
                        var latString = splitted[0];
                        var lonString = splitted[1];

                        if (!isNaN(latString) && !isNaN(lonString) && latString !== "" && lonString !== "") {
                            lat = parseFloat(latString);
                            lon = parseFloat(lonString);
                            isValid = true;
                        } else {
                            isValid = false;
                        }
                    } else {
                        isValid = false;
                    }
                }
                if (this.currentView === "3d") {
                    var splitted = input.split(",");
                    if (splitted.length === 2) {
                        var latString = splitted[0];
                        var lonString = splitted[1];

                        if (!isNaN(latString) && !isNaN(lonString) && latString !== "" && lonString !== "") {
                            lat = parseFloat(latString);
                            lon = parseFloat(lonString);
                            zoom = undefined;
                            isValid = true;
                        } else {
                            isValid = false;
                        }
                    }
                    else if (splitted.length === 3) {
                        var latString = splitted[0];
                        var lonString = splitted[1];
                        var zoomString = splitted[2];

                        if (!isNaN(latString) && !isNaN(lonString) && !isNaN(zoomString) &&
                            latString !== "" && lonString !== "" && zoomString !== "") {
                            lat = parseFloat(latString);
                            lon = parseFloat(lonString);
                            zoom = parseFloat(zoomString);
                            isValid = true;
                        } else {
                            isValid = false;
                        }
                    } else {
                        isValid = false;
                    }
                }

                if (lat < -90 || 90 < lat ||
                    lon < -180 || 180 < lon) {
                    isValid = false;
                }

                if(isValid){
                    domClass.add(this.flyToInputValidation, "has-success");
                    domClass.remove(this.flyToInputValidation, "has-error");
                    if(this.currentView === "map"){
                        return {"lat":lat,"lon":lon};
                    }
                    if(this.currentView === "3d"){
                        return {"lat":lat,"lon":lon,"zoom":zoom};
                    }
                }else{
                    domClass.remove(this.flyToInputValidation, "has-success");
                    domClass.add(this.flyToInputValidation, "has-error");
                    return null;
                }
            }
            else{//If word not coordinates
                if(input.length > 0) {
                    var projection = this.projection;
                    if(this.currentView === "3d"){
                        projection = this.config.projection.EQUIRECT;
                    }
                    var facetKeys = "itemType";
                    var facetValues = "nomenclature";
                    var searchUrl = this.indexerUtil.createGetSearchItemsUrl({
                        key: input,
                        start: "0",
                        rows: 5,
                        facetKeys: facetKeys,
                        facetValues: facetValues,
                        projection: projection
                    });

                    var self = this;
                    xhr(searchUrl, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(function (data) {
                        domConstruct.empty(this.flyToNomenclatureResults);

                        var docs = data.response.docs;
                        if (docs.length > 0) {
                            domClass.remove("flyToNomenclatureResults", "hidden");
                        }
                        else{
                            domClass.add("flyToNomenclatureResults", "hidden");
                        }

                        if(docs.length === 1 && isEntered){
                            var bbox = docs[0].bbox;
                            self.zoomToNomenclature(bbox);
                            self.closeFlyTo({});
                            self.flyToOpen = false;
                        }
                        else {
                            for (var i = 0; i < docs.length; i++) {
                                var linkDom = self.createFlyToLink(docs[i]);
                                var facetBtnItemNode = domConstruct.place(linkDom, self.flyToNomenclatureResults);

                                on(facetBtnItemNode, "click", function (evt) {
                                    domClass.add("flyToNomenclatureResults", "hidden");

                                    var bbox = evt.target.dataset.bbox;
                                    self.zoomToNomenclature(bbox);

                                    self.closeFlyTo({});
                                    self.flyToOpen = false;
                                });
                            }
                        }
                    });

                    isValid = true;
                }
                else{
                    domClass.add("flyToNomenclatureResults", "hidden");
                }

                if(isValid){
                    domClass.add(this.flyToInputValidation, "has-success");
                    domClass.remove(this.flyToInputValidation, "has-error");
                }else{
                    domClass.remove(this.flyToInputValidation, "has-success");
                    domClass.add(this.flyToInputValidation, "has-error");
                }

                return null;
            }
        },

        createFlyToLink: function(doc){
            var link = '<li data-bbox="' + doc.bbox + '"><a data-bbox="' + doc.bbox + '" class="flyToLinkResult">' + doc.productLabel + '</a></li>';
            return link;
        },

        panMap: function(lat, lon){
            var map = this.getMap();
            var switchToEquirect = false;

            var x=lon, y=lat;
            if(this.projection === this.config.projection.N_POLE) {
                var degObj = MapUtil.prototype.convertLatLonToNorthPolarMeters(x,y);
                x = degObj.x;
                y = degObj.y;

                //TEMPORARY: Need a way to know what extent of images are covered by np or sp (not just black screen).
                if(lat < 54){
                    switchToEquirect = true;
                }
            } else if(this.projection === this.config.projection.S_POLE) {
                var degObj = MapUtil.prototype.convertLatLonToSouthPolarMeters(x,y);
                x = degObj.x;
                y = degObj.y;

                //TEMPORARY: Need a way to know what extent of images are covered by np or sp (not just black screen).
                if(lat > -54){
                    switchToEquirect = true;
                }
            } else {
            }

            if(switchToEquirect){
                var dataset = {"projection": this.config.projection.EQUIRECT};
                var target = {"dataset": dataset};
                var evt = {"target": target};
                this.changeProjection(evt);

                map = this.getMap();
                var pt = new Point(lon,lat,map.spatialReference);
                map.centerAt(pt);
            }else{
                var pt = new Point(x,y,map.spatialReference);
                map.centerAt(pt);
            }
        },

        getMap: function(){
            var mapDijit = registry.byId("mainSearchMap");

            var map;
            if(this.projection === this.config.projection.EQUIRECT) {
                map = mapDijit.equirectMap;
            } else if(this.projection === this.config.projection.N_POLE) {
                map = mapDijit.northPoleMap;
            } else if(this.projection === this.config.projection.S_POLE) {
                map = mapDijit.southPoleMap;
            }

            if(this.currentView === "3d"){
                map = mapDijit.equirectMap;
            }

            return map;
        },

        zoomToNomenclature: function(bbox){
            if(this.currentView === "map"){
                var splitExtent = bbox.split(",");

                //TEMPORARY: Need a better way to determine how to set extent around a feature.
                var modAlpha = 0;
                if(this.projection === this.config.projection.EQUIRECT) {
                    modAlpha = 3;
                } else if(this.projection === this.config.projection.N_POLE) {
                    modAlpha = 100000;
                } else if(this.projection === this.config.projection.S_POLE) {
                    modAlpha = 100000;
                }

                var moddedExtent =
                    (parseFloat(splitExtent[0]) - modAlpha) + "," +
                    (parseFloat(splitExtent[1]) - modAlpha) + "," +
                    (parseFloat(splitExtent[2]) + modAlpha) + "," +
                    (parseFloat(splitExtent[3]) + modAlpha) + ",";
                splitExtent = moddedExtent.split(",");

                var map = this.getMap();

                var extent = {
                    "xmin": splitExtent[0],
                    "ymin": splitExtent[1],
                    "xmax": splitExtent[2],
                    "ymax": splitExtent[3],
                    "projection": this.projection
                };

                topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});
            }
            if(this.currentView === "3d"){
                var lon = parseFloat(bbox.split(",")[0]);
                var lat = parseFloat(bbox.split(",")[1]);
                topic.publish(MapEvent.prototype.FLY_TO_COORDINATE, {"lat":lat,"lon":lon,"zoom":1000000});
            }
        },

        getCurrentMap: function()
        {
          var map;

          if (this.projection === this.config.data.projections.northpole) {
            this.projection = this.config.data.projections.northpole;
            map = this.mapDijit.northPoleMap;
          } else if (this.projection === this.config.data.projections.southpole) {
            this.projection = this.config.data.projections.southpole;
            map = this.mapDijit.southPoleMap;
          } else {
            this.projection = this.config.data.projections.equirect;
              map = this.mapDijit.equirectMap;
          }
          return map;
        },

        screenShot: function(evt){
          this.closeShareOptions();
          //console.log('screenShot');

          var productLabel = "nomenclature_eq";
          var map = this.getCurrentMap();
          //console.log("map", map);
          //console.log("map", map._layersDiv);
          //console.log("map", map._container);
          //console.log("map", map.root);
          //console.log("document.body", document.body);
          //console.log("this.mapDijit", this.mapDijit);
          //var div = map.root;
          //console.log("div", div);

          //northPoleMapContainer
          //southPoleMapContainer
          //mapContainer
          
          var w = window,
              d = document,
              e = d.documentElement,
              g = d.getElementsByTagName('body')[0],
              x = w.innerWidth || e.clientWidth || g.clientWidth,
              y = w.innerHeight|| e.clientHeight|| g.clientHeight;
          //console.log(w.innerWidth + ' x ' + w.innerHeight);
          //console.log(e.clientWidth + ' x ' + e.clientHeight);
          //console.log(g.clientWidth + ' x ' + g.clientHeight);

          var map1 = this.mapDijit.northPoleMap;
          var map2 = this.mapDijit.southPoleMap;
          var map0 = this.mapDijit.equirectMap;
          //console.log("map1", map1);
          //console.log("map2", map2);
          //console.log("map0", map0);
          var div1 = map1.container;
          var div2 = map2.container;
          var div0 = map0.container;
          //console.log("div1", div1);
          //console.log("div2", div2);
          //console.log("div0", div0);
          //console.log("div1.style.display = ", div1.style.display);
          //console.log("div2.style.display = ", div2.style.display);
          //console.log("div0.style.display = ", div0.style.display);

          if (this.projection === this.config.data.projections.northpole) 
          {
            //console.log('getSnapshotDiv() - this.projection = northpole');
            div2.style.display = 'none';
            div0.style.display = 'none';
            //div2.style.visibility = 'hidden';
            //div0.style.visibility = 'hidden';
            productLabel = "nomenclature_nq";
          } 
          else if (this.projection === this.config.data.projections.southpole) 
          {
            //console.log('getSnapshotDiv() - this.projection = southpole');
            //div1.style.display = 'none';
            //div0.style.display = 'none';
            //div1.style.visibility = 'hidden';
            //div0.style.visibility = 'hidden';
            productLabel = "nomenclature_sq";
          } 
          else 
          {
            //console.log('getSnapshotDiv() - this.projection = equalreq');
            //div1.style.display = 'none';
            //div2.style.display = 'none';
            //div1.style.visibility = 'hidden';
            //div2.style.visibility = 'hidden';
            productLabel = "nomenclature_eq";
          }

          //console.log("map", map.container);
          //var div = map.container;
          var div = map._layersDiv;
          div.style.backgroundColor = 'black';
          //console.log("screenShot():: div", div);
          var ss = new ScreenShot();
          ss.startup(div, map, productLabel);
        },

        screenShotDone: function(evt){
          //console.log("screenShotDone");
          var map1 = this.mapDijit.northPoleMap;
          var map2 = this.mapDijit.southPoleMap;
          var map0 = this.mapDijit.equirectMap;
          var div1 = map1.container;
          var div2 = map2.container;
          var div0 = map0.container;
          div1.style.display = 'block';
          div2.style.display = 'block';
          div0.style.display = 'block';
          //div1.style.visibility = 'visible';
          //div2.style.visibility = 'visible';
          //div0.style.visibility = 'visible';
        },

        fadeOut: function(domNode){
            domStyle.set(domNode, "opacity", "1");
            var fadeArgs = {
                node: domNode,
                duration: 1000
            };
            fx.fadeOut(fadeArgs).play();
        },

        fadeIn: function(domNode){
            domStyle.set(domNode, "opacity", "0");
            var fadeArgs = {
                node: domNode,
                duration: 1000
            };
            fx.fadeIn(fadeArgs).play();
        },

        openToolbar: function(evt){
            if(this.config.controls.tools){
                this.activateTools();
            }
        },

        enableCloseSidebarOnMapClick: function(evt){
            if(evt){
                if(evt.enable){
                    if(evt.enable === "mapClick"){
                        this.disableCloseSidebarsOnMapClick = false;
                    }
                }
            }
        },

        hideButtons: function(){
            if(this.controlItemMenu){
                domClass.add(this.controlItemMenu, "controlBarHide");
            }

            if(this.config.controls.explore){
                domClass.add(this.controlItemExplorer, "controlBarHide");
            }

            if(this.config.controls.layers && !this.config.controls.tree){
                domClass.add(this.controlItemLayers, "controlBarHide");
            }

            if(this.config.controls.search){
                domClass.add(this.controlItemSearch, "controlBarHide");
            }

            if(this.config.controls.tree){
                domClass.add(this.controlItemTree, "controlBarHide");
            }

            if(this.config.controls.projection){
                domClass.add(this.controlItemProjections, "controlBarHide");
            }

            if(this.config.controls.socialmedia){
                domClass.add(this.controlItemShare, "controlBarHide");
            }

            if(this.config.controls.flyto){
                domClass.add(this.flyToButton, "controlBarHide");
            }

            if(this.config.controls.tools){
                domClass.add(this.controlItemTools, "controlBarHide");
            }
        },

        hideButtonsFor3D: function(){
            if(this.controlItemMenu){
                domClass.add(this.controlItemMenu, "controlBarHide");
            }

            if(this.config.controls.explore){
                domClass.add(this.controlItemExplorer, "controlBarHide");
            }

            if(this.config.controls.layers && !this.config.controls.tree){
                domClass.add(this.controlItemLayers, "controlBarHide");
            }

            if(this.config.controls.search){
                domClass.add(this.controlItemSearch, "controlBarHide");
            }

            if(this.config.controls.tree){
                domClass.add(this.controlItemTree, "controlBarHide");
            }

            if(this.config.controls.projection){
                domClass.add(this.controlItemProjections, "controlBarHide");
            }

            if(this.config.controls.socialmedia){
                domClass.add(this.controlItemShare, "controlBarHide");
            }

            if(this.config.controls.flyto){
                domClass.add(this.flyToButton, "controlBarHide");
            }

            if(this.config.controls.tools){
                domClass.add(this.controlItemTools, "controlBarHide");
            }

            var controlBarLeft = query("#controlBarLeft");
            if(controlBarLeft.length > 0){
                domClass.add(controlBarLeft[0], "controlBarHide");
            }

            var controlBarLeft = query("#controlBarBottomInfo");
            if(controlBarLeft.length > 0){
                domClass.add(controlBarLeft[0], "controlBarHide");
            }
        },

        showButtons: function(){
            if(this.controlItemMenu){
                domClass.remove(this.controlItemMenu, "controlBarHide");
            }

            if(this.config.controls.explore){
                domClass.remove(this.controlItemExplorer, "controlBarHide");
            }

            if(this.config.controls.layers && !this.config.controls.tree){
                domClass.remove(this.controlItemLayers, "controlBarHide");
            }

            if(this.config.controls.search){
                domClass.remove(this.controlItemSearch, "controlBarHide");
            }

            if(this.config.controls.tree){
                domClass.remove(this.controlItemTree, "controlBarHide");
            }

            if(this.config.controls.projection){
                domClass.remove(this.controlItemProjections, "controlBarHide");
            }

            if(this.config.controls.socialmedia){
                domClass.remove(this.controlItemShare, "controlBarHide");
            }

            if(this.config.controls.flyto){
                domClass.remove(this.flyToButton, "controlBarHide");
            }

            if(this.config.controls.tools){
                domClass.remove(this.controlItemTools, "controlBarHide");
            }
        },

        showButtonsFor3D: function(){
            if(this.controlItemMenu){
                domClass.remove(this.controlItemMenu, "controlBarHide");
            }

            if(this.config.controls.explore){
                domClass.remove(this.controlItemExplorer, "controlBarHide");
            }

            if(this.config.controls.layers && !this.config.controls.tree){
                domClass.remove(this.controlItemLayers, "controlBarHide");
            }

            if(this.config.controls.search){
                domClass.remove(this.controlItemSearch, "controlBarHide");
            }

            if(this.config.controls.tree){
                domClass.remove(this.controlItemTree, "controlBarHide");
            }

            if(this.config.controls.projection){
                domClass.remove(this.controlItemProjections, "controlBarHide");
            }

            if(this.config.controls.socialmedia){
                domClass.remove(this.controlItemShare, "controlBarHide");
            }

            if(this.config.controls.flyto){
                domClass.remove(this.flyToButton, "controlBarHide");
            }

            if(this.config.controls.tools){
                domClass.remove(this.controlItemTools, "controlBarHide");
            }

            var controlBarLeft = query("#controlBarLeft");
            if(controlBarLeft.length > 0){
                domClass.remove(controlBarLeft[0], "controlBarHide");
            }

            var controlBarLeft = query("#controlBarBottomInfo");
            if(controlBarLeft.length > 0){
                domClass.remove(controlBarLeft[0], "controlBarHide");
            }
        },

        showBookmarkEndDrawButton: function(){
            domClass.remove(this.controlItemBookmarkEndDrawing, "controlBarHide");
            domClass.remove(this.bookmarkDrawingMenu, "hidden");
        },

        hideBookmarkEndDrawButton: function(){
            domClass.add(this.controlItemBookmarkEndDrawing, "controlBarHide");
            domClass.add(this.bookmarkDrawingMenu, "hidden");
        },

        endBookmarkDrawing: function(){
            this.hideBookmarkEndDrawButton();
            topic.publish(NavigationEvent.prototype.OPEN_TOOL_SIDEBAR);
        },

        annotationColorSelectorChanged: function(evt){
            this.toolSidebar.setBookmarkAnnotationsColor(evt.target.value);
            this.toolSidebar.bookmarkCreationMenu.bookmarkCreationAnnotationMenu.addPencilButtonClicked();
        },

        setControlBarBookmarkAnnotationsColor: function(value){
            this.annotationColorSelector.value = value;
        }

    });
});
