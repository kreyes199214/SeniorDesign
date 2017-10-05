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
    'dojo/text!./templates/BookmarkCreationDetailsMenu.html',
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
    "jpl/dijit/BookmarkCreationGraphicListItem",
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
             LoadingEvent, BrowserEvent, MapUtil, BaseMaps, StackContainer, ContentPane,
             registry, Menu, MenuItem, MenuSeparator, PopupMenuItem, aspect, FeatureDetector, Config,
             DistanceController, STLController, SubpointController, CatalogRastersUtil,
             DistanceModalDialog, STLModalDialog, STLInputDialog, ElevationModalDialog,
             ElevationInputDialog, SunAngleModalDialog, SubsetModalDialog, SubsetInputDialog,
             LightingModalDialog, LightingInputDialog, SlopeModalDialog, SlopeInputDialog, EspModalDialog,
             EspInputDialog, DistanceInputDialog, PolarLatLonBox, BookmarkCreationGraphicListItem, TooltipDialog,
             popup, Draw, Edit, Graphic, geometryJsonUtils, Point, SimpleMarkerSymbol, SimpleLineSymbol,
             SimpleFillSymbol, PictureMarkerSymbol, Color, Font, TextSymbol) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        layerIds: null,
        extent: null,
        projection: null,
        bookmarkDetailsMenu: null,
        parentMenu: null,
        visibleShapeGraphicsList: [],
        visibleAnnotationsGraphicsList: [],

        startup: function () {
            this.setEventHandlers();
        },

        setParentMenu: function(menu){
            this.parentMenu = menu;
        },

        setEventHandlers: function(){
            on(this.addShapeButton, "click", lang.hitch(this, this.addShapeButtonClicked));
            on(this.addAnnotationButton, "click", lang.hitch(this, this.addAnnotationButtonClicked));
            on(this.finishButton, "click", lang.hitch(this, this.finishButtonClicked));
            on(this.updateLayersButton, "click", lang.hitch(this, this.updateLayersButtonClicked));
            on(this.updateBoundingBoxButton, "click", lang.hitch(this, this.updateBoundingBoxButtonClicked));

            on(this.titleInput, "change", lang.hitch(this, this.validateBookmark));
            on(this.descriptionInput, "change", lang.hitch(this, this.validateBookmark));
            on(this.titleInput, "keyup", lang.hitch(this, this.validateBookmark));
            on(this.descriptionInput, "keyup", lang.hitch(this, this.validateBookmark));
            on(this.titleInput, "blur", lang.hitch(this, this.validateBookmark));
            on(this.descriptionInput, "blur", lang.hitch(this, this.validateBookmark));

            on(this.finishButtonDisabled, "click", lang.hitch(this, this.validateBookmark));

        },

        setLayerIds: function(layerIds){
            domConstruct.empty(this.layersList);
            this.layerIds = layerIds;

            for(var i=0; i<layerIds.length; i++){
                domConstruct.place('<div>' + layerIds[i] + '</div>', this.layersList, "last");
            }
        },

        setLayerTransparencies: function(layerTransparencies){
            this.layerTransparencies = layerTransparencies;
        },

        setExtent: function(extent){
            domConstruct.empty(this.extentList);
            this.extent = extent;

            domConstruct.place('<div>Left: ' + this.extent.xmin + '</div>', this.extentList, "last");
            domConstruct.place('<div>Bottom: ' + this.extent.ymin + '</div>', this.extentList, "last");
            domConstruct.place('<div>Right: ' + this.extent.xmax + '</div>', this.extentList, "last");
            domConstruct.place('<div>Top: ' + this.extent.ymax + '</div>', this.extentList, "last");
        },

        setProjection: function(projection){
            this.projection = projection;
        },

        addShapeButtonClicked: function(){
            this.parentMenu.showAddShapeMenu();
        },

        addAnnotationButtonClicked: function(){
            this.parentMenu.showAddAnnotationMenu();
        },

        finishButtonClicked: function(){
            this.parentMenu.toolbar.createBookmarkFinish();
        },

        getInputs: function(){
            var title = this.titleInput.value;
            var description = this.descriptionInput.value;
            var mediaUrl = this.mediaUrlInput.value;

            var inputs = {
                "layerIds": this.layerIds,
                "layerTransparencies": this.layerTransparencies,
                "extent": this.extent,
                "title": title,
                "description": description,
                "dataProjection": this.projection,
                "mediaUrl": mediaUrl
            };

            return inputs;
        },

        addGraphicToVisibleList: function(type, graphic){
            var title = "";
            var description = "";
            var mediaUrl = "";
            if(type === "shape"){
                title = graphic.title;
                description = graphic.description;
                mediaUrl = graphic.mediaUrl;
                graphic = graphic.graphic;
            }
            if(type === "annotation"){
                title = "Annotation";
                description = "";
            }
            var bookmarkCreationGraphicListItem = new BookmarkCreationGraphicListItem();
            domConstruct.place(bookmarkCreationGraphicListItem.domNode, this.newBookmarkGraphicList, "last");
            bookmarkCreationGraphicListItem.startup(title, description, graphic);
            bookmarkCreationGraphicListItem.setParentMenu(this);

            if(type === "shape") {
                this.visibleShapeGraphicsList.push(bookmarkCreationGraphicListItem);
            }
            if(type === "annotation"){
                this.visibleAnnotationsGraphicsList.push(bookmarkCreationGraphicListItem);
            }


            domClass.add(this.newBookmarkGraphicList, "newBookmarkGraphicListBorder");
            domClass.remove(this.newBookmarkGraphicListContainer, "hidden");
        },

        removeGraphicFromVisibleList: function(type, graphic){

            if(type === "shape") {
                var indexToDelete = null;
                for (var i = 0; i < this.visibleShapeGraphicsList.length; i++) {
                    if (graphic === this.visibleShapeGraphicsList[i].graphic) {
                        indexToDelete = i;
                    }
                }
                domConstruct.destroy(this.visibleShapeGraphicsList[indexToDelete].id);
                this.visibleShapeGraphicsList.splice(indexToDelete, 1);

                this.updateVisibilityOfList();
            }
            if(type === "annotation"){
                for(var i = 0; i < this.visibleAnnotationsGraphicsList.length; i++){
                    if(this.visibleAnnotationsGraphicsList[i].graphic.length === 0){
                        domConstruct.destroy(this.visibleAnnotationsGraphicsList[i].id);
                        this.visibleAnnotationsGraphicsList.splice(i, 1);
                        i = i + 1;
                    }
                }

                this.updateVisibilityOfList();
            }
        },

        updateLayersButtonClicked: function(){
            this.parentMenu.toolbar.updateBookmarkCreationLayers();
        },

        updateBoundingBoxButtonClicked: function(){
            this.parentMenu.toolbar.updateBookmarkCreationExtent();
        },

        updateVisibilityOfList: function(){
            if(this.visibleShapeGraphicsList.length < 1 &&
                this.visibleAnnotationsGraphicsList.length < 1){
                domClass.remove(this.newBookmarkGraphicList, "newBookmarkGraphicListBorder");
                domClass.add(this.newBookmarkGraphicListContainer, "hidden");
            }
        },

        validateBookmark: function(evt){
            var title = this.titleInput.value;
            var description = this.descriptionInput.value;

            domClass.remove(this.titleInput, "bookmarkDetailFailedValidation");
            domClass.remove(this.descriptionInput, "bookmarkDetailFailedValidation");

            if(title.length < 1 || description.length < 1){
                domClass.add(this.finishButton, "hidden");
                domClass.remove(this.finishButtonDisabled, "hidden");

                if(title.length < 1){
                    domClass.add(this.titleInput, "bookmarkDetailFailedValidation");
                }
                if(description.length < 1){
                    domClass.add(this.descriptionInput, "bookmarkDetailFailedValidation");
                }
            }
            else{
                domClass.remove(this.finishButton, "hidden");
                domClass.add(this.finishButtonDisabled, "hidden");
            }
        },

        listItemRemoveGraphicButtonClicked: function(graphic){
            this.parentMenu.listItemRemoveGraphicButtonClicked(graphic);
        }

    });
});
