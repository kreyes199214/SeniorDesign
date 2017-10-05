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
    'dojo/text!./templates/BookmarkCreationAnnotationMenu.html',
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
             Color, Font, TextSymbol) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        parentMenu: null,

        startup: function () {
            this.setEventHandlers();
        },

        setParentMenu: function(menu){
            this.parentMenu = menu;
        },

        setEventHandlers: function(){
            on(this.addPencilButton, "click", lang.hitch(this, this.addPencilButtonClicked));
            on(this.selectButton, "click", lang.hitch(this, this.selectButtonClicked));
            on(this.addingAnnotationNextButton, "click", lang.hitch(this, this.addingAnnotationNextButtonClicked));
            on(this.annotationOutlineColorSelector, "change", lang.hitch(this, this.annotationColorChanged))
        },

        addPencilButtonClicked: function(){
            console.log("add pen freehand");
            this.beginAnnotationDrawing("FREEHAND_POLYLINE");
        },

        selectButtonClicked: function(){
            topic.publish(NavigationEvent.prototype.SHOW_UI_BUTTONS, null);
            this.parentMenu.toolbar.stopDrawing();
        },

        addingAnnotationNextButtonClicked: function(){
            this.parentMenu.toolbar.createBookmarkSaveAnnotation();
            this.parentMenu.toolbar.stopDrawing();
            this.parentMenu.toolbar.isCreatingAnnotation = false;

            this.parentMenu.showBookmarkDetailsMenu();
            this.parentMenu.bookmarkCreationDetailsMenu.validateBookmark();
            topic.publish(NavigationEvent.prototype.SHOW_UI_BUTTONS, null);
            this.parentMenu.showCancelBookmarkButton();
        },

        beginAnnotationDrawing: function(toolLabel){
            this.parentMenu.toolbar.isCreatingAnnotation = true;
            var outlineColor = this.annotationOutlineColorSelector.value;

            topic.publish(MapEvent.prototype.TOOL_SELECTED, {
                "toolLabel": toolLabel,
                "outlineRgb": this.hexToRgb(outlineColor)
            });
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
            topic.publish(NavigationEvent.prototype.HIDE_UI_BUTTONS, null);
            topic.publish(NavigationEvent.prototype.SHOW_BOOKMARK_END_DRAW_UI_BUTTON, null);
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
        },

        setBookmarkAnnotationsColor: function(value){
            this.annotationOutlineColorSelector.value = value;
        },

        annotationColorChanged: function(evt){
            this.parentMenu.setControlBarBookmarkAnnotationsColor(evt.target.value);
        }

    });
});
