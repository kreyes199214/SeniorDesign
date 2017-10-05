define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/parser",
    "dojo/mouse",
    "dojo/on",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/BookmarkCreationMenu.html',
    "xstyle/css!./css/BookmarkCreationMenu.css",
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent",
    "jpl/events/ToolEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/BrowserEvent",
    "jpl/utils/MapUtil",
    "jpl/data/BaseMaps",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/registry",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/MenuSeparator",
    "dijit/PopupMenuItem",
    "dojo/aspect",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    "jpl/controllers/DistanceController",
    "jpl/controllers/STLController",
    "jpl/controllers/SubpointController",
    "jpl/utils/CatalogRastersUtil",
    "jpl/dijit/ui/DistanceModalDialog",
    "jpl/dijit/ui/STLModalDialog",
    "jpl/dijit/ui/STLInputDialog",
    "jpl/dijit/ui/ElevationModalDialog",
    "jpl/dijit/ui/ElevationInputDialog",
    "jpl/dijit/ui/SunAngleModalDialog",
    "jpl/dijit/ui/SubsetModalDialog",
    "jpl/dijit/ui/SubsetInputDialog",
    "jpl/dijit/ui/LightingModalDialog",
    "jpl/dijit/ui/LightingInputDialog",
    "jpl/dijit/ui/SlopeModalDialog",
    "jpl/dijit/ui/SlopeInputDialog",
    "jpl/dijit/ui/EspModalDialog",
    "jpl/dijit/ui/EspInputDialog",
    "jpl/dijit/ui/DistanceInputDialog",
    "jpl/dijit/ui/PolarLatLonBox",
    "jpl/dijit/BookmarkCreationDetailsMenu",
    "jpl/dijit/BookmarkCreationShapeMenu",
    "jpl/dijit/BookmarkCreationAnnotationMenu",
    "dijit/TooltipDialog",
    "dijit/popup",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/graphic",
    "esri/geometry/jsonUtils",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/Color",
    "esri/symbols/Font",
    "esri/symbols/TextSymbol"
], function (declare, lang, query, parser, mouse, on, has, topic, domClass, domAttr, domConstruct, _WidgetBase,
             _TemplatedMixin, template, css, NavigationEvent, MapEvent, ToolEvent, LoadingEvent,
             BrowserEvent, MapUtil, BaseMaps, StackContainer, ContentPane, registry, Menu, MenuItem,
             MenuSeparator, PopupMenuItem, aspect, FeatureDetector, Config, DistanceController,
             STLController, SubpointController, CatalogRastersUtil, DistanceModalDialog, STLModalDialog,
             STLInputDialog, ElevationModalDialog, ElevationInputDialog, SunAngleModalDialog, SubsetModalDialog,
             SubsetInputDialog, LightingModalDialog, LightingInputDialog, SlopeModalDialog, SlopeInputDialog,
             EspModalDialog, EspInputDialog, DistanceInputDialog, PolarLatLonBox, BookmarkCreationDetailsMenu,
             BookmarkCreationShapeMenu, BookmarkCreationAnnotationMenu, TooltipDialog, popup, Draw, Edit, Graphic,
             geometryJsonUtils, Point, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol,
             Color, Font, TextSymbol) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        toolbar: null,
        bookmarkCreationDetailsMenu: null,
        bookmarkCreationShapeMenu: null,
        bookmarkCreationAnnotationMenu: null,

        startup: function () {
            this.setEventHandlers();

            this.createBookmarkDetails();
        },

        setToolbar: function(toolbar){
            this.toolbar = toolbar;
        },

        setEventHandlers: function(){
            on(this.cancelBookmarkBtn, "click", lang.hitch(this, this.cancelThisBookmark));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));
        },

        closeThisSidebar: function(){
            this.toolbar.closeThisSidebar();
        },

        showBookmarkDetailsMenu: function(){
            domClass.add(this.addGraphicDiv, "hidden");
            domClass.remove(this.bookmarkDetailsDiv, "hidden");
        },

        cancelThisBookmark: function(){
            this.toolbar.stopDrawing();
            this.toolbar.closeBookmarkCreationMenu();
            this.toolbar.isCreatingShape = false;
            this.toolbar.isCreatingAnnotation = false;
            this.toolbar.init();
            topic.publish(NavigationEvent.prototype.SHOW_UI_BUTTONS, null);
            topic.publish(NavigationEvent.prototype.ENABLE_CLOSE_SIDEBAR_ON_MAP_CLICK, {"enable":"mapClick"});
        },

        createBookmarkDetails: function(){
            domConstruct.empty(this.bookmarkDetailsDiv);
            this.bookmarkCreationDetailsMenu = new BookmarkCreationDetailsMenu();
            this.bookmarkCreationDetailsMenu.setParentMenu(this);
            this.bookmarkCreationDetailsMenu.startup();
            domConstruct.place(this.bookmarkCreationDetailsMenu.domNode, this.bookmarkDetailsDiv);

        },

        beginShapeDrawing: function(toolLabel){
            this.toolbar.clearBookmarkShape();
            this.creatingBookmarkGraphic = null;

            this.toolbar.isCreatingShape = true;
            var outlineColor = this.graphicOutlineColorSelector.value;
            var fillColor = this.graphicFillColorSelector.value;

            topic.publish(MapEvent.prototype.TOOL_SELECTED, {
                "toolLabel": toolLabel,
                "outlineRgb": this.hexToRgb(outlineColor),
                "fillRgb": this.hexToRgb(fillColor)
            });
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        setLayerIds: function(layerIds){
            this.bookmarkCreationDetailsMenu.setLayerIds(layerIds);
        },

        setLayerTransparencies: function(layerTransparencies){
            this.bookmarkCreationDetailsMenu.setLayerTransparencies(layerTransparencies);
        },

        setExtent: function(extent){
            this.bookmarkCreationDetailsMenu.setExtent(extent);
        },

        setProjection: function(projection){
            this.bookmarkCreationDetailsMenu.setProjection(projection);
        },

        showAddShapeMenu: function(){
            domClass.add(this.bookmarkDetailsDiv, "hidden");

            this.hideCancelBookmarkButton();
            this.createBookmarkShapeMenu();
        },

        showAddAnnotationMenu: function(){
            domClass.add(this.bookmarkDetailsDiv, "hidden");

            this.hideCancelBookmarkButton();
            this.createBookmarkAnnotationMenu();
        },

        createBookmarkShapeMenu: function(){
            domConstruct.empty(this.addGraphicDiv);
            domClass.remove(this.addGraphicDiv, "hidden");

            this.bookmarkCreationShapeMenu = new BookmarkCreationShapeMenu();
            this.bookmarkCreationShapeMenu.setParentMenu(this);
            this.bookmarkCreationShapeMenu.startup();
            domConstruct.place(this.bookmarkCreationShapeMenu.domNode, this.addGraphicDiv);
        },

        createBookmarkAnnotationMenu: function(){
            domConstruct.empty(this.addGraphicDiv);
            domClass.remove(this.addGraphicDiv, "hidden");

            this.bookmarkCreationAnnotationMenu = new BookmarkCreationAnnotationMenu();
            this.bookmarkCreationAnnotationMenu.setParentMenu(this);
            this.bookmarkCreationAnnotationMenu.startup();

            domConstruct.place(this.bookmarkCreationAnnotationMenu.domNode, this.addGraphicDiv);
        },

        showCancelBookmarkButton: function(){
            domClass.remove(this.cancelBookmarkBtn, "hidden");
        },

        hideCancelBookmarkButton: function(){
            domClass.add(this.cancelBookmarkBtn, "hidden");
        },

        listItemRemoveGraphicButtonClicked: function(graphic){
            this.toolbar.removeMapGraphic(graphic);
        },

        setBookmarkAnnotationsColor: function(value){
            this.bookmarkCreationAnnotationMenu.setBookmarkAnnotationsColor(value);
        },

        setControlBarBookmarkAnnotationsColor: function(value){
            this.toolbar.setControlBarBookmarkAnnotationsColor(value);
        }

    });
});
