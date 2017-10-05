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
    'dojo/text!./templates/BookmarkCreationShapeMenu.html',
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
    "esri/symbols/TextSymbol",
    "dojo/_base/fx",
    "dojo/fx"
], function (declare, lang, query, parser, mouse, on, has, topic, domClass, domAttr, domConstruct,
             _WidgetBase, _TemplatedMixin, template, NavigationEvent, MapEvent, ToolEvent,
             LoadingEvent, BrowserEvent, MapUtil, BaseMaps, StackContainer, ContentPane, registry,
             Menu, MenuItem, MenuSeparator, PopupMenuItem, aspect, FeatureDetector, Config,
             DistanceController, STLController, SubpointController, CatalogRastersUtil,
             DistanceModalDialog, STLModalDialog, STLInputDialog, ElevationModalDialog,
             ElevationInputDialog, SunAngleModalDialog, SubsetModalDialog, SubsetInputDialog,
             LightingModalDialog, LightingInputDialog, SlopeModalDialog, SlopeInputDialog, EspModalDialog,
             EspInputDialog, DistanceInputDialog, PolarLatLonBox, TooltipDialog, popup, Draw, Edit, Graphic,
             geometryJsonUtils, Point, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol,
             Color, Font, TextSymbol, baseFx, fx) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        parentMenu: null,
        creatingBookmarkGraphic: null,

        startup: function () {
            this.setEventHandlers();
        },

        setParentMenu: function(menu){
            this.parentMenu = menu;
        },

        setEventHandlers: function(){
            on(this.addPointButton, "click", lang.hitch(this, this.addPointButtonClicked));
            on(this.addLineButton, "click", lang.hitch(this, this.addLineButtonClicked));
            on(this.addPolylineButton, "click", lang.hitch(this, this.addPolylineButtonClicked));
            on(this.addFreehandLineButton, "click", lang.hitch(this, this.addFreehandLineButtonClicked));
            on(this.addRectangleButton, "click", lang.hitch(this, this.addRectangleButtonClicked));
            on(this.addCircleButton, "click", lang.hitch(this, this.addCircleButtonClicked));
            on(this.addEllipseButton, "click", lang.hitch(this, this.addEllipseButtonClicked));
            on(this.addingShapeNextButton, "click", lang.hitch(this, this.addingShapeNextButtonClicked));
        },

        addPointButtonClicked: function(){
            console.log("add point");
            this.beginShapeDrawing("POINT");
        },

        addLineButtonClicked: function(){
            console.log("add line");
            this.beginShapeDrawing("LINE");
        },

        addPolylineButtonClicked: function(){
            console.log("add polyline");
            this.beginShapeDrawing("POLYLINE");
        },

        addFreehandLineButtonClicked: function(){
            console.log("add freehand line");
            this.beginShapeDrawing("FREEHAND_POLYLINE");
        },

        addRectangleButtonClicked: function(){
            console.log("add rectangle");
            this.beginShapeDrawing("RECTANGLE");
        },

        addCircleButtonClicked: function(){
            console.log("add circle");
            this.beginShapeDrawing("CIRCLE");
        },

        addEllipseButtonClicked: function(){
            console.log("add ellipse");
            this.beginShapeDrawing("ELLIPSE");
        },

        beginShapeDrawing: function(toolLabel){
            this.parentMenu.toolbar.clearBookmarkShape();
            this.creatingBookmarkGraphic = null;

            this.parentMenu.toolbar.isCreatingShape = true;
            var outlineColor = this.graphicOutlineColorSelector.value;
            var fillColor = this.graphicFillColorSelector.value;

            topic.publish(MapEvent.prototype.TOOL_SELECTED, {
                "toolLabel": toolLabel,
                "outlineRgb": this.hexToRgb(outlineColor),
                "fillRgb": this.hexToRgb(fillColor)
            });
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, {"disable":"mapClicked"});
            topic.publish(NavigationEvent.prototype.HIDE_UI_BUTTONS, null);
        },

        hexToRgb: function(hex){
            var c;
            if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
                c= hex.substring(1).split('');
                if(c.length== 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                //return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
                var color = [];
                color.push((c>>16)&255);
                color.push((c>>8)&255);
                color.push(c&255);

                return color;
            }
        },

        enableNextButton: function(){
            domClass.add(this.addingShapeNextButtonDisabled, "hidden");
            domClass.remove(this.addingShapeNextButton, "hidden");
        },

        disableNextButton: function(){
            domClass.add(this.addingShapeNextButton, "hidden");
            domClass.remove(this.addingShapeNextButtonDisabled, "hidden");
        },

        addingShapeNextButtonClicked: function(){
            this.parentMenu.toolbar.createBookmarkSaveShape();
            this.parentMenu.toolbar.stopDrawing();
            this.parentMenu.toolbar.isCreatingAnnotation = false;
            this.parentMenu.showBookmarkDetailsMenu();
            this.parentMenu.bookmarkCreationDetailsMenu.validateBookmark();
            this.parentMenu.showCancelBookmarkButton();

            topic.publish(NavigationEvent.prototype.ENABLE_CLOSE_SIDEBAR_ON_MAP_CLICK, {"enable":"mapClick"});
        },

        getTitle: function(){
            return this.titleInput.value;
        },

        getDescription: function(){
            return this.descriptionInput.value;
        },

        getMediaUrl: function(){
            return this.mediaUrlInput.value;
        },

        flashNextButton: function(){
            var slideTarget = this.addingShapeNextButton;
            var duration = 400;
            fx.chain([
                baseFx.fadeOut({ node: slideTarget, duration: duration }),
                baseFx.fadeIn({ node: slideTarget, duration: duration }),
                baseFx.fadeOut({ node: slideTarget, duration: duration }),
                baseFx.fadeIn({ node: slideTarget, duration: duration })
            ]).play();
        }

    });
});
