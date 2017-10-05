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
], function (declare, lang, query, parser, mouse, on, has, topic, domClass, domAttr, domConstruct, _WidgetBase, _TemplatedMixin, template, css, NavigationEvent, MapEvent, ToolEvent, LoadingEvent, BrowserEvent, MapUtil, BaseMaps, StackContainer, ContentPane, registry, Menu, MenuItem, MenuSeparator, PopupMenuItem, aspect, FeatureDetector, Config, DistanceController, STLController, SubpointController, CatalogRastersUtil, DistanceModalDialog, STLModalDialog, STLInputDialog, ElevationModalDialog, ElevationInputDialog, SunAngleModalDialog, SubsetModalDialog, SubsetInputDialog, LightingModalDialog, LightingInputDialog, SlopeModalDialog, SlopeInputDialog, EspModalDialog, EspInputDialog, DistanceInputDialog, PolarLatLonBox, TooltipDialog, popup, Draw, Edit, Graphic, geometryJsonUtils, Point, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol, Color, Font, TextSymbol) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        toolbar: null,

        startup: function () {
            this.setEventHandlers();
        },

        setToolbar: function(toolbar){
            this.toolbar = toolbar;
        },

        setEventHandlers: function(){
            //on(this.menuSideBarLinkBack, "click", lang.hitch(this, this.backBtnPressed));
            on(this.cancelBookmarkBtn, "click", lang.hitch(this, this.cancelThisBookmark));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));

            on(this.addPointButton, "click", lang.hitch(this, this.addPointButtonClicked));
            on(this.addLineButton, "click", lang.hitch(this, this.addLineButtonClicked));
            on(this.addPolylineButton, "click", lang.hitch(this, this.addPolylineButtonClicked));
            on(this.addFreehandLineButton, "click", lang.hitch(this, this.addFreehandLineButtonClicked));
            on(this.addRectangleButton, "click", lang.hitch(this, this.addRectangleButtonClicked));
            on(this.addCircleButton, "click", lang.hitch(this, this.addCircleButtonClicked));
            //on(this.addArrowButton, "click", lang.hitch(this, this.addArrowButtonClicked));
            //on(this.addDownArrowButton, "click", lang.hitch(this, this.addDownArrowButtonClicked));
            on(this.addEllipseButton, "click", lang.hitch(this, this.addEllipseButtonClicked));
            on(this.addingShapeNextButton, "click", lang.hitch(this, this.addingShapeNextButtonClicked));
            //on(this.addLeftArrowButton, "click", lang.hitch(this, this.addLeftArrowButtonClicked));
            //on(this.addMultiPointButton, "click", lang.hitch(this, this.addMultiPointButtonClicked));
            //on(this.addRightArrowButton, "click", lang.hitch(this, this.addRightArrowButtonClicked));
            //on(this.addTriangleButton, "click", lang.hitch(this, this.addTriangleButtonClicked));
            //on(this.addUpArrowButton, "click", lang.hitch(this, this.addUpArrowButtonClicked));
            on(this.addPencilButton, "click", lang.hitch(this, this.addPencilButtonClicked));
            on(this.selectButton, "click", lang.hitch(this, this.selectButtonClicked));
            on(this.addingAnnotationNextButton, "click", lang.hitch(this, this.addingAnnotationNextButtonClicked));
        },

        closeThisSidebar: function(){
            this.toolbar.closeThisSidebar();
        },

        cancelThisBookmark: function(){
            this.toolbar.stopDrawing();
            this.toolbar.closeBookmarkCreationMenu();
            this.toolbar.isCreatingShape = false;
            this.toolbar.isCreatingAnnotation = false;
            this.toolbar.init();
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

        addArrowButtonClicked: function(){
            console.log("add arrow");
            this.beginShapeDrawing("ARROW");
        },

        addDownArrowButtonClicked: function(){
            console.log("add down arrow");
            this.beginShapeDrawing("DOWN_ARROW");
        },

        addEllipseButtonClicked: function(){
            console.log("add ellipse");
            this.beginShapeDrawing("ELLIPSE");
        },

        addLeftArrowButtonClicked: function(){
            console.log("add left arrow");
            this.beginShapeDrawing("LEFT_ARROW");
        },

        addMultiPointButtonClicked: function(){
            console.log("add multipoint");
            this.beginShapeDrawing("MULTI_POINT");
        },

        addRightArrowButtonClicked: function(){
            console.log("add right arrow");
            this.beginShapeDrawing("RIGHT_ARROW");
        },

        addTriangleButtonClicked: function(){
            console.log("add triangle");
            this.beginShapeDrawing("TRIANGLE");
        },

        addUpArrowButtonClicked: function(){
            console.log("add up arrow");
            this.beginShapeDrawing("UP_ARROW");
        },

        addPencilButtonClicked: function(){
            console.log("add pen freehand");
            this.beginAnnotationDrawing("FREEHAND_POLYLINE");
        },

        selectButtonClicked: function(){
            this.toolbar.stopDrawing();
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

        beginAnnotationDrawing: function(toolLabel){
            this.toolbar.isCreatingAnnotation = true;
            var outlineColor = this.annotationOutlineColorSelector.value;

            topic.publish(MapEvent.prototype.TOOL_SELECTED, {
                "toolLabel": toolLabel,
                "outlineRgb": this.hexToRgb(outlineColor)
            });
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        /*
        setSymbolStyles: function(){
            var color = this.colorSelector.value;
            var rgba = this.hexToRgbA(color, 1);
            console.log("color:" + color + " rgbaString:" + rgba)
            console.log("EX:" + [247,235,14,0.85]);

            this.toolbar.fillSymbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(rgba), 2),
                new Color(rgba)
            );

            this.toolbar.lineSymbol = new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color(rgba),
                5
            );
            console.log("this.toolbar", this.toolbar);

            this.toolbar.toolbar.fillSymbol = this.toolbar.fillSymbol;
            this.toolbar.toolbar.lineSymbol = this.toolbar.lineSymbol;
        },
    */

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

        addingShapeNextButtonClicked: function(){
            this.toolbar.createBookmarkSaveShape();
            this.toolbar.stopDrawing();
            this.toolbar.isCreatingAnnotation = false;
        },

        addingAnnotationNextButtonClicked: function(){
            this.toolbar.createBookmarkSaveAnnotation();
            this.toolbar.stopDrawing();
            this.toolbar.isCreatingAnnotation = false;
        },

        enableNextButton: function(){
            domClass.add(this.addingShapeNextButtonDisabled, "hidden");
            domClass.remove(this.addingShapeNextButton, "hidden");
        },

        disableNextButton: function(){
            domClass.add(this.addingShapeNextButton, "hidden");
            domClass.remove(this.addingShapeNextButtonDisabled, "hidden");
        },

        setType: function(type){
            if(type === "shape"){
                this.showShapeCreationUi();
            }
            if(type === "annotation"){
                this.showAnnotationCreationUi();
            }
        },

        showShapeCreationUi: function(){
            domClass.remove(this.addGraphicMenu, "hidden");
            domClass.add(this.addAnnotationMenu, "hidden");
        },

        showAnnotationCreationUi: function(){
            domClass.add(this.addGraphicMenu, "hidden");
            domClass.remove(this.addAnnotationMenu, "hidden");
        },

        enableAnnotationNextButton: function(){
            domClass.add(this.addingAnnotationNextButtonDisabled, "hidden");
            domClass.remove(this.addingAnnotationNextButton, "hidden");
        },

        disableAnnotationNextButton: function(){
            domClass.add(this.addingAnnotationNextButton, "hidden");
            domClass.remove(this.addingAnnotationNextButtonDisabled, "hidden");
        },

        getTitle: function(){
            return this.titleInput.value;
        },

        getDescription: function(){
            return this.descriptionInput.value;
        }
});
});
