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
    "dojo/request/xhr",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/ToolSidebar.html',
    "xstyle/css!./css/ToolSidebar.css",
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
    "jpl/dijit/ui/BookmarkModalDialog",
    "jpl/dijit/ui/CraterModalDialog",
    "jpl/dijit/ui/CraterInputDialog",
    "jpl/dijit/ui/RockModalDialog",
    "jpl/dijit/ui/RockInputDialog",
    "jpl/dijit/ui/SlopeDemoModalDialog",
    "jpl/dijit/ui/SlopeDemoInputDialog",
    "jpl/dijit/ui/ContourDemoModalDialog",
    "jpl/dijit/ui/ContourDemoInputDialog",
    "dijit/TooltipDialog",
    "dijit/popup",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/graphic",
    "esri/geometry/jsonUtils",
    "esri/geometry/Point",
    "esri/geometry/Geometry",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/Color",
    "esri/symbols/Font",
    "esri/symbols/TextSymbol",
    "jpl/dijit/BookmarkCreationMenu",
    "jpl/utils/WKTUtil"
], function (declare, lang, query, parser, mouse, on, has, topic, domClass, domAttr, domConstruct, xhr,
             _WidgetBase, _TemplatedMixin, template, css, NavigationEvent, MapEvent, ToolEvent,
             LoadingEvent, BrowserEvent, MapUtil, BaseMaps, StackContainer, ContentPane, registry,
             Menu, MenuItem, MenuSeparator, PopupMenuItem, aspect, FeatureDetector, Config,
             DistanceController, STLController, SubpointController, CatalogRastersUtil, DistanceModalDialog,
             STLModalDialog, STLInputDialog, ElevationModalDialog, ElevationInputDialog, SunAngleModalDialog,
             SubsetModalDialog, SubsetInputDialog, LightingModalDialog, LightingInputDialog, SlopeModalDialog,
             SlopeInputDialog, EspModalDialog, EspInputDialog, DistanceInputDialog, PolarLatLonBox, BookmarkModalDialog, CraterModalDialog, CraterInputDialog,RockModalDialog, RockInputDialog,
             SlopeDemoModalDialog, SlopeDemoInputDialog, ContourDemoModalDialog, ContourDemoInputDialog,
             TooltipDialog, popup, Draw, Edit, Graphic, geometryJsonUtils, Point, Geometry, SimpleMarkerSymbol, SimpleLineSymbol,
             SimpleFillSymbol, PictureMarkerSymbol, Color, Font, TextSymbol, BookmarkCreationMenu, WKTUtil) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        initialized: false,
        subpointInstance: [],
        graphicContextMenuHandler: null,
        isDrawing: false,
        isEditing: false,
        currentView: "2d",
        currentToolSelected: "",
        dialog: null,
        bookmarkDialog: null,
        CraterDialog: null,
        RockDialog: null,
        lineB: null,
        polylineB: null,
        freehandB: null,
        rectangleB: null,
        pointB: null,
        totalDistance: null,
        graphic: null,
        editTip: null,
        isInMarker: false,
        lastPlotGraphic: null,
        currentPlotGraphic: null,
        email: null,
        passToken: null,
        isLogin: null,
        username: null,
        passwd: null,
        bookmarkCreationMenu: null,
        isCreatingShape: false,
        isCreatingAnnotation: false,
        bookmarkShape: null,
        bookmarkAnnotation: [],
        bookmarkShapes: [],
        bookmarkAnnotations: [],
        wktUtil: null,

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.mapDijit = registry.byId("mainSearchMap");
            this.basemapSingleton = BaseMaps.getInstance();
            this.wktUtil = new WKTUtil();

            this.initStackContainer();
            //this.setUpSubpointTools();
            this.setEventHandlers();
            this.setSubscriptions();

            this.editTip = new TooltipDialog({
              content: "Click outside the box to finish"
            });
 
            this.email = '';
            this.passToken= '';
            this.isLogin= false;
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;",
                id: "toolsidebarStackContainer"
            }, "toolscontainer");
        },

        addStackContainerItem: function(item, title, id) {
            //alert('addStackContainerItem()');
            this.sidebarStackContainer.addChild(
                new ContentPane({
                    title: title,
                    content: item,
                    id: id
                })
            );
        },

        setEventHandlers: function(){
            //on(this.menuSideBarLinkBack, "click", lang.hitch(this, this.backBtnPressed));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));

            //for beta
            //on(this.toolsListBtn, "click", lang.hitch(this, this.openToolList));
            //on(this.runningJobsBtn, "click", lang.hitch(this, this.openRunningJobsList));

            //on(this.hazardLink, "click", lang.hitch(this, this.activateHazardTool));
            on(this.surfaceLightingLink, "click", lang.hitch(this, this.activateSurfaceLightingTool));
            //on(this.generateStlLink, "click", lang.hitch(this, this.activateGenerateStlTool));
            on(this.calculateDistanceLink, "click", lang.hitch(this, this.activateCalculateDistanceTool));
            on(this.calculateElevationProfileLink, "click", lang.hitch(this, this.activatecalculateElevationProfileTool));
            on(this.calculateSunAngleLink, "click", lang.hitch(this, this.activatecalculateSunAngleTool));
            on(this.calculateSubsetLink, "click", lang.hitch(this, this.activatecalculateSubsetTool));
            on(this.calculateSlopeLink, "click", lang.hitch(this, this.activatecalculateSlopeTool));


            if(this.config.tools.generateSTL) {
                on(this.generateStlLink, "click", lang.hitch(this, this.activateGenerateStlTool));
            }else{
                domConstruct.destroy(this.generateStlLink);
            }
            if(this.config.tools.createBookmarks){
                on(this.createBookmarkLink, "click", lang.hitch(this, this.openBookmarkCreationMenu));
            }else{
                domConstruct.destroy(this.createBookmarkLink);
            }

            if(this.config.data.tools.detectCrater){
                on(this.detectCraterLink, "click", lang.hitch(this, this.activateDetectCraterProcess));
            }else{
                domConstruct.destroy(this.detectCraterLink);
            }

            if(this.config.data.tools.detectRock){
                on(this.detectRockLink, "click", lang.hitch(this, this.activateDetectRockProcess));
            }else{
                domConstruct.destroy(this.detectRockLink);
            }

            if (this.config.data.services.espService) {
                on(this.calculateEspLink, "click", lang.hitch(this, this.activatecalculateEspTool));
            }else{
                domConstruct.destroy(this.calculateEspLink);
            }

            //
            // if(this.config.data.tools.generateSlope){
            //     on(this.generateSlopeLink, "click", lang.hitch(this, this.activateGenerateSlopeProcess));
            //     on(this.generateContourLink, "click", lang.hitch(this, this.activateGenerateContourProcess));
            // }else{
            //     domConstruct.destroy(this.generateSlopeLink);
            //     domConstruct.destroy(this.generateContourLink);
            // }
        },

        setSubscriptions: function(){
            topic.subscribe(MapEvent.prototype.TOOL_SELECTED, lang.hitch(this, this.toolSelected));
            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            topic.subscribe(ToolEvent.prototype.SHOW_LINE_POSITION_GRAPHIC,  lang.hitch(this, this.showLinePositionGraphic));
            topic.subscribe(ToolEvent.prototype.MOUSE_MOVED_OFF_ELEVATION_PLOT,  lang.hitch(this, this.removePolylineGraphicPoints));
            topic.subscribe(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, lang.hitch(this, this.removeMapGraphic));
            topic.subscribe(ToolEvent.prototype.SHOW_POLYGON_STL, lang.hitch(this, this.showSTL));
            topic.subscribe(ToolEvent.prototype.SUBSETING, lang.hitch(this, this.doSubseting));
            topic.subscribe(ToolEvent.prototype.SURFACE_LIGHTING, lang.hitch(this, this.doSurfaceLighting));
            topic.subscribe(ToolEvent.prototype.SLOPE_TOOL, lang.hitch(this, this.doSlope));
            topic.subscribe(ToolEvent.prototype.ESP_TOOL, lang.hitch(this, this.doEsp));

            topic.subscribe(ToolEvent.prototype.LOGIN_TOOL, lang.hitch(this, this.handleLogin));

            topic.subscribe(MapEvent.prototype.VIEW_3D, lang.hitch(this, this.view3DEnabled));
            //topic.subscribe(MapEvent.prototype.VIEW_2D, lang.hitch(this, this.projectionChanged));
        },

        openToolSidebar: function(evt) {
            domClass.add(document.body, "tool-sidebar-open");

            //MapUtil.prototype.resizeFix();
        },

        closeToolSidebar: function(evt) {
            domClass.remove(document.body, "tool-sidebar-open");

            //MapUtil.prototype.resizeFix();
        },

        closeThisSidebar: function(){
            this.controlBar.activateTools();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        openToolList: function(){
            domClass.add(query(this.runningJobsList)[0], "hidden");
            domClass.remove(query(this.toolsList)[0], "hidden");
        },

        openRunningJobsList: function(){
            domClass.remove(query(this.runningJobsList)[0], "hidden");
            domClass.add(query(this.toolsList)[0], "hidden");
        },

        toolSelected: function(evt) {
            //console.log('toolSelected()::');
            //console.log('toolSelected() this.currentView = ' + this.currentView );
            //change to 2D if in 3D mode
            if(this.currentView === "3d") {
              this.currentView = "2d";
              topic.publish(MapEvent.prototype.VIEW_2D, null);
              //topic.publish(MapEvent.prototype.VIEW_2D, {projection: this.config.projection.EQUIRECT});
            }

            if (!this.initialized) {
                this.init();
                this.initialized = true;
            }

            console.log("evt.toollabel", evt.toolLabel);
            if(this.isCreatingShape || this.isCreatingAnnotation){
                this.setCreateBookmarkSymbolStyles(evt);
            }
            else{
                this.setSymbolStyles();
            }

            this.toolbar.deactivate();
            console.log("draw", Draw);
            this.toolbar.activate(Draw[evt.toolLabel]);
            this.isDrawing = true;

            if(this.isCreatingShape || this.isCreatingAnnotation){
                var labels = query(".map .tooltip");
                for(var i = 0; i < labels.length; i++){
                    labels[i].innerHTML = "Drawing graphic";
                }
            }
        },

        init: function() {
            //bug with tools that requires a resize to refresh the tool position
            MapUtil.prototype.resizeFix();

            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                this.map = this.mapDijit.northPoleMap;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                this.map = this.mapDijit.southPoleMap;
            } else {
                //default to equirect for all others
                this.map = this.mapDijit.equirectMap;
            }

            this.toolbar = new Draw(this.map);
            this.editToolbar = new Edit(this.map);

            this.setSymbolStyles();

            //add graphics to the map when the draw is complete
            on(this.toolbar, "draw-end", lang.hitch(this, this.addToMap));
            //deactivate the toolbar when you click outside a graphic
            on(this.map, "click", lang.hitch(this, this.deactivateEditToolbar));
            on(this.map, "mouse-move", lang.hitch(this, this.showEditingMessage));

            this.map.graphics.on("mouse-over", lang.hitch(this, this.graphicMouseOver));
            this.map.graphics.on("mouse-out", lang.hitch(this, this.graphicMouseOut));
            //this.map.graphics.on("click", lang.hitch(this, this.graphicsClicked));
        },

        showEditingMessage: function(evt)
        {
          //console.log('showEditingMessage():: isInMarker = ' + this.isInMarker);
          if (this.isInMarker)
          {
            //var self = this;
            popup.close(this.editTool);
            //popup.close(self.editTool);
            return;
          }

          if (this.isEditing)
          {
            //console.log('showEditingMessage():: isEditing = ' + this.isEditing);
            //console.log(evt);

            popup.open({
              popup:this.editTip,
              orient:"R",
              x:evt.x,
              y:evt.y
            });

          }
        },

        showLinePositionGraphic: function(x, y){
            if(this.lastPlotGraphic !== null){
                this.currentPlotGraphic = this.addPolylineGraphicPoint(x, y);
                this.removeLastPolylineGraphicPoint(this.lastPlotGraphic);
                this.lastPlotGraphic = this.currentPlotGraphic;
            }
            else{
                this.lastPlotGraphic = this.addPolylineGraphicPoint(x, y);
            }

        },

        activateHazardTool: function(){
            ////var toolLabel = "RECTANGLE";
	    ////this.currentToolSelected = "Hazard";  //define at constant later
            ////topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
            ////topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        activateSurfaceLightingTool: function()
        {
          //console.log('activateSurfaceLightingTool()::');
          dojo.disconnect(this.rectangleB);
          this.rectangleB = null;

          this.dialog = new LightingModalDialog();
          
          this.rectangleB = this.dialog.getModalButton('Rectangle');
          dojo.connect(this.rectangleB, 'click', this, this.generateSurfaceLighting);
        },

        generateStl: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateStl():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateSTL";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateDistance: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateDistance():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "CalculateDistance";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateElevation: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateElevation():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "CalculateElevationProfile";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateSunAngle: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateSunAngle():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateSunAngle";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateSlope: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateSlope():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateSlope";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateCrater: function(evt)
        {
            var self = this;

            var toolLabel = evt.target.value;
            //console.log('in generateSlope():: toolLabel = ' + toolLabel);

            self.currentToolSelected = "GenerateCrater";  //define at constant later
            topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateRock: function(evt)
        {
            var self = this;

            var toolLabel = evt.target.value;
            //console.log('in generateSlope():: toolLabel = ' + toolLabel);

            self.currentToolSelected = "GenerateRock";  //define at constant later
            topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateContourDemo: function(evt)
        {
            var self = this;

            var toolLabel = evt.target.value;
            //console.log('in generateSlope():: toolLabel = ' + toolLabel);

            self.currentToolSelected = "GenerateContourDemo";  //define at constant later
            topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateSlopeDemo: function(evt)
        {
            var self = this;

            var toolLabel = evt.target.value;
            //console.log('in generateSlope():: toolLabel = ' + toolLabel);

            self.currentToolSelected = "GenerateSlopeDemo";  //define at constant later
            topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
            topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateEsp: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateSlope():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateEsp";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateSubset: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          //console.log('in generateSubset():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateSubset";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        generateSurfaceLighting: function(evt)
        {
          var self = this;

          var toolLabel = evt.target.value;
          console.log('in generateSurfaceLighting():: toolLabel = ' + toolLabel);

          self.currentToolSelected = "GenerateSurfaceLighting";  //define at constant later
          topic.publish(MapEvent.prototype.TOOL_SELECTED, {toolLabel: toolLabel});
          topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, null);
        },

        activatecalculateSlopeTool: function(){
          console.log('activatecalculateSlopeTool()::');

          dojo.disconnect(this.rectangleB);
          this.rectangleB = null;

          this.dialog = new SlopeModalDialog();

          this.rectangleB = this.dialog.getModalButton('Rectangle');
          dojo.connect(this.rectangleB, 'click', this, this.generateSlope);
        },

        activatecalculateEspTool: function(){
          console.log('activatecalculateEspTool()::');

          dojo.disconnect(this.rectangleB);
          this.rectangleB = null;
          
          this.dialog = new EspModalDialog();
          
          this.rectangleB = this.dialog.getModalButton('Rectangle');
          dojo.connect(this.rectangleB, 'click', this, this.generateEsp);
        },

        activatecalculateSubsetTool: function(){
          console.log('activatecalculateSubsetTool()::');

          dojo.disconnect(this.rectangleB);
          this.rectangleB = null;
          
          this.dialog = new SubsetModalDialog();

          this.rectangleB = this.dialog.getModalButton('Rectangle');
          dojo.connect(this.rectangleB, 'click', this, this.generateSubset);
        },

        activateGenerateStlTool: function(){
          console.log('activateGenerateStlTool()::');

          dojo.disconnect(this.rectangleB);
          this.rectangleB = null;

          this.dialog = new STLModalDialog();

          this.rectangleB = this.dialog.getModalButton('Rectangle');
          dojo.connect(this.rectangleB, 'click', this, this.generateStl);
        },

        activateCalculateDistanceTool: function(){
          console.log('activateCalculateDistanceTool()::');
          
          dojo.disconnect(this.lineB);
          dojo.disconnect(this.polylineB);
          dojo.disconnect(this.freehandB);
          this.lineB = null;
          this.polylineB = null;
          this.freehandB = null;

          this.dialog = new DistanceModalDialog();

          this.lineB = this.dialog.getModalButton('Line');
          dojo.connect(this.lineB, 'click', this, this.generateDistance);
          this.polylineB = this.dialog.getModalButton('Polyline');
          dojo.connect(this.polylineB, 'click', this, this.generateDistance);
          this.freehandB = this.dialog.getModalButton('Freehand');
          dojo.connect(this.freehandB, 'click', this, this.generateDistance);
        },

        activatecalculateElevationProfileTool: function(){
          console.log('activatecalculateElevationProfileTool()::');

          dojo.disconnect(this.lineB);
          dojo.disconnect(this.polylineB);
          dojo.disconnect(this.freehandB);
          this.lineB = null;
          this.polylineB = null;
          this.freehandB = null;

          this.dialog = new ElevationModalDialog();
          //this.dialog.show();

          this.lineB = this.dialog.getModalButton('Line');
          dojo.connect(this.lineB, 'click', this, this.generateElevation);
          this.polylineB = this.dialog.getModalButton('Polyline');
          dojo.connect(this.polylineB, 'click', this, this.generateElevation);
          this.freehandB = this.dialog.getModalButton('Freehand');
          dojo.connect(this.freehandB, 'click', this, this.generateElevation);
        },

        activatecalculateSunAngleTool: function(){
          console.log('activatecalculateSunAngleTool()::');
          
          dojo.disconnect(this.pointB);
          this.pointB = null;

          this.dialog = new SunAngleModalDialog();
          
          this.pointB = this.dialog.getModalButton('Point');
          dojo.connect(this.pointB, 'click', this, this.generateSunAngle);
        },

        setSymbolStyles: function() {
            this.fillSymbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([247,235,14, 0.85]), 2),
                new Color([255,255,0,0.10])
            );

            this.lineSymbol = new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([247,235,14, 0.85]),
                5
            );

            this.markerSymbol = new PictureMarkerSymbol({
                "angle":0,"xoffset":0,"yoffset":13,"type":"esriPMS",
                "url":"./jpl/assets/images/pin-marker.png",
                "contentType":"image/png","width":32,"height":32
            });

            this.toolbar.fillSymbol = this.fillSymbol;
            this.toolbar.lineSymbol = this.lineSymbol;
            this.toolbar.markerSymbol = this.markerSymbol;
        },

        setCreateBookmarkSymbolStyles: function(evt){
            var rgb = evt.outlineRgb;
            var rgbFill = evt.outlineRgb.slice(0);
            if(evt.fillRgb){
                rgbFill = evt.fillRgb;
            }
            else{
                rgbFill = [0,0,0,255];
            }

            if(evt.toolLabel === "RECTANGLE" ||
                evt.toolLabel === "CIRCLE" ||
                evt.toolLabel === "ARROW" ||
                evt.toolLabel === "DOWN_ARROW" ||
                evt.toolLabel === "ELLIPSE" ||
                evt.toolLabel === "LEFT_ARROW" ||
                evt.toolLabel === "RIGHT_ARROW" ||
                evt.toolLabel === "TRIANGLE" ||
                evt.toolLabel === "UP_ARROW"){

                rgb.push(0.85);
                rgbFill.push(0.10);

                this.fillSymbol = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(rgb), 2),
                    new Color(rgbFill)
                );

                this.lineSymbol = new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color(rgb),
                    5
                );
            }
            else{

                rgb.push(1);
                rgbFill.push(1);

                this.fillSymbol = new SimpleMarkerSymbol({
                    "color": new Color(rgbFill),
                    "size": 12,
                    "angle": -30,
                    "xoffset": 0,
                    "yoffset": 0,
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "outline": {
                        "color": new Color(rgb),
                        "width": 1,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    }
                });

                this.lineSymbol = new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color(rgb),
                    5
                );

                this.markerSymbol = new SimpleMarkerSymbol({
                    "color": new Color(rgbFill),
                    "size": 12,
                    "angle": -30,
                    "xoffset": 0,
                    "yoffset": 0,
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "outline": {
                        "color": new Color(rgb),
                        "width": 1,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    }
                })
            }

            this.toolbar.fillSymbol = this.fillSymbol;
            this.toolbar.lineSymbol = this.lineSymbol;
            this.toolbar.markerSymbol = this.markerSymbol;
        },

        projectionChanged: function(evt) {
          
           this.currentView = "2d";

            console.log('projectionChanged() evt.projection = ' + evt.projection);
            if(this.toolbar) {
                this.toolbar.deactivate();
            }

            if(this.isEditing){
                this.deactivateEditToolbar();
            }

            if(this.initialized) {
                //reinit for each projection change
                this.init();
            }

            this.handleRestrictedToolsOnProjectionChange(evt.projection);
        },

        graphicMouseOver: function(evt) {

            this.isInMarker = true;

            if(!this.isDrawing && !this.isEditing) 
            {
                if(evt.graphic.attributes) {
                    if (evt.graphic.attributes["graphicType"] === "bookmarkShape" ||
                        evt.graphic.attributes["graphicType"] === "bookmarkAnnotation") {

                        this.selectedGraphic = evt.graphic;

                        this.createBookmarkGraphicsMenu(evt.graphic);

                        //bind to the graphic underneath the mouse cursor
                        this.ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());

                        popup.close(this.editTip);
                        this.map.setMapCursor("pointer");
                    }
                }
                else {
                    if ((evt.graphic.symbol.type === "picturemarkersymbol" && evt.graphic.symbol.url === "./jpl/assets/images/pin-marker.png") ||
                        evt.graphic.symbol.type !== "picturemarkersymbol" && evt.graphic.symbol.type !== "simplemarkersymbol") {

                        this.selectedGraphic = evt.graphic;

                        this.createGraphicsMenu(evt.graphic);

                        //bind to the graphic underneath the mouse cursor
                        this.ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());

                        popup.close(this.editTip);
                        this.map.setMapCursor("pointer");
                    }
                }
            }
        },

        graphicMouseOut: function(evt) {
            this.isInMarker = false;
            if(!this.isDrawing && !this.isEditing) {
                if ((evt.graphic.symbol.type === "picturemarkersymbol" && evt.graphic.symbol.url === "./jpl/assets/images/pin-marker.png") ||
                    evt.graphic.symbol.type !== "picturemarkersymbol") {

                    this.ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());

                    this.map.setMapCursor("default");
                }
            }
        },

        deactivateEditToolbar: function(evt) {
            console.log('deactivateEditToolbar():: evt = ' + evt);
            console.log(evt);
            console.log('deactivateEditToolbar():: this.graphic = ' + this.graphic);
            console.log(this.graphic);
            this.preventElevationPlotScrollOnMovement();
            this.editToolbar.deactivate();

            popup.close(this.editTip);
            this.isEditing = false;

            if(this.isCreatingShape){
                this.verifyBookmarkShape(this.graphic)
            }

            if(this.isCreatingAnnotation){
                this.updateAnnotationGraphic(this.graphic);
                this.verifyBookmarkAnnotation(this.graphic);
            }
        },

        addToMap: function(evt) {
            console.log('ToolSidebar::addToMap():: evt = ' + evt);
            console.log(evt);

            var symbol;

            console.log("addingtomap geomtype", evt.geometry.type);
            if(this.isCreatingShape || this.isCreatingAnnotation){
                topic.publish(NavigationEvent.prototype.SHOW_UI_BUTTONS, null);

                switch (evt.geometry.type) {
                    case "point":
                        symbol = this.fillSymbol;
                        break;
                    case "multipoint":
                        symbol = this.fillSymbol;
                        break;
                    case "polyline":
                        symbol = this.lineSymbol;
                        break;
                    default:
                        symbol = this.fillSymbol;
                        break;
                }

                console.log("geometrytype", symbol);
            }
            else {
                this.toolbar.deactivate();
                this.isDrawing = false;

                switch (evt.geometry.type) {
                    case "point":
                        symbol = this.markerSymbol;
                        break;
                    case "multipoint":
                        symbol = this.markerSymbol;
                        break;
                    case "polyline":
                        symbol = this.lineSymbol;
                        break;
                    default:
                        symbol = this.fillSymbol;
                        break;
                }
            }

            var graphic = new Graphic(evt.geometry, symbol);
            if(this.isCreatingShape){
                graphic.setAttributes({"graphicType":"bookmarkShape"});
            }
            if(this.isCreatingAnnotation){
                graphic.setAttributes({"graphicType":"bookmarkAnnotation"});
            }

            //if pole, convert rectangle
            if (this.basemapSingleton.currentMapProjection == this.config.projection.N_POLE ||
                this.basemapSingleton.currentMapProjection == this.config.projection.S_POLE)
            {
              if (evt.geometry.type == "polygon")
              {
                var g = evt.geometry;
                //var symbol = new SimpleFillSymbol();

                var rr = g.rings;

                var p1 = rr[0][1];
                var x = p1[0];
                var y = p1[1];
                var urp = new Point(x, y);

                var p3 = rr[0][3];
                x = p3[0];
                y = p3[1];
                var llp = new Point(x, y);

                var geometry = new PolarLatLonBox(urp, llp, true);  //searchMap.spatialReference);
                geometry.startup();
       
                var r = geometry.rings;
                var p = r[0];
                console.log('addToMap():: p = ' + p);
                console.log(p);
                var x = p.x;
                var y = p.y;

                var coor = [];
                for (var i=0; i<p.length; i++)
                {
                  var b = p[i];
                  var a = [ b.x, b.y ];
                  coor.push(a);
                }

                g.rings[0] = coor;
                graphic = new Graphic(g, symbol);
                graphic.eqExtent = geometry.eqExtent;
                graphic.polarExtent = {};
                graphic.polarExtent.topbc = urp.y;
                graphic.polarExtent.bottombc = llp.y;
                graphic.polarExtent.leftbc = llp.x;
                graphic.polarExtent.rightbc = urp.x;

                if(this.isCreatingShape){
                  graphic.setAttributes({"GraphicType":"bookmarkShape"});
                }
                if(this.isCreatingAnnotation){
                  graphic.setAttributes({"GraphicType":"bookmarkAnnotation"});
                }

                this.verifyBookmarkShape(graphic);

                if(this.isCreatingAnnotation) {
                  this.bookmarkAnnotation.push(graphic);
                  this.verifyBookmarkAnnotation(graphic);
                }
                this.map.graphics.add(graphic);
              } //not polygon
              else //not polygon
              {
                  this.verifyBookmarkShape(graphic);

                  if(this.isCreatingAnnotation) {
                      this.bookmarkAnnotation.push(graphic);
                      this.verifyBookmarkAnnotation(graphic);
                  }
                this.map.graphics.add(graphic);
              }
            }
            else //EQUIRECT
            {
                this.verifyBookmarkShape(graphic);

                if(this.isCreatingAnnotation) {
                    this.bookmarkAnnotation.push(graphic);
                    this.verifyBookmarkAnnotation(graphic);
                }
              this.map.graphics.add(graphic);
            }

            //save which tool was selected in infoTemplate
            graphic.infoTemplate = this.currentToolSelected;
   
            this.graphic = graphic;
            this.isEditing = true;
            var self = this;

            if(this.isCreatingShape || this.isCreatingAnnotation){
                if(this.isCreatingShape){
                    this.setContinueShapeUi();
                }
                if(this.isCreatingAnnotation){
                    this.setContinueAnnotationUi();
                }
                this.toolbar.deactivate();
                this.isDrawing = false;
                this.isEditing = false;
            }
            else {
                if (self.currentToolSelected == "CalculateElevationProfile") {
                    var dial = new ElevationInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "CalculateDistance") {
                    var dial = new DistanceInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateSurfaceLighting") {
                    var dial = new LightingInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateSTL") {
                    var dial = new STLInputDialog();
                    dial.startup(self, 'STL');
                }
                else if (self.currentToolSelected == "GenerateSunAngle") {
                    //TODO - this should not be hardcoded here. make it as config
                    var ltd = this.config.services.sunAngleInput;
                    var alt = 0;
                    topic.publish(ToolEvent.prototype.SHOW_SUN_ANGLE_PLOT, {
                        parent: this,
                        editToolbar: this.editToolbar,
                        graphic: graphic,
                        projection: this.basemapSingleton.currentMapProjection,
                        endpoint: this.config.services.sunAngleService,
                        ltd: ltd,
                        alt: alt
                    });
                }
                else if (self.currentToolSelected == "GenerateSubset") {
                    //console.log('ToolSidebar::addToMap() this.passToken = ' + this.passToken);
                    var dial = new SubsetInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateSlope") {
                    var dial = new SlopeInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateEsp") {
                    var dial = new EspInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateCrater") {
                    var dial = new CraterInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateRock") {
                    var dial = new RockInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateSlopeDemo") {
                    var dial = new SlopeDemoInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
                else if (self.currentToolSelected == "GenerateContourDemo") {
                    var dial = new ContourDemoInputDialog();
                    dial.startup(this, this.editToolbar, graphic);
                }
            }

            console.log("this.isCreatingAnnotation", this.isCreatingAnnotation);
            if(this.isCreatingAnnotation) {
                console.log("repeat drawing evt", evt);
                this.bookmarkCreationMenu.bookmarkCreationAnnotationMenu.beginAnnotationDrawing("FREEHAND_POLYLINE");
            }

        },

        createGraphicsMenu: function(graphic) {
            var type = graphic.geometry.type;
            //var selected = this.selectedGraphic;
            var selected = graphic;

            this.ctxMenuForGraphics = new Menu({});
            this.ctxMenuForGraphics.leftClickToOpen = true;

            //var currentToolSelected = this.selectedGraphic.infoTemplate;
            var currentToolSelected = selected.infoTemplate;

            if (type === "point") {

                this.ctxMenuForGraphics.addChild(new MenuItem({
                    label: "Move",
                    onClick: lang.hitch(this, function () {
                        this.editToolbar.activate(Edit.MOVE, this.selectedGraphic);
                        this.isEditing = true;
                    })
                }));

                if (this.config.services.sunAngleService !== "") {
                    var ltd = this.config.services.sunAngleInput;
                    var alt = 0;
                    this.ctxMenuForGraphics.addChild(new MenuItem({
                        label: "Sun Angle Caculation",
                        onClick: lang.hitch(this, function () {
                            topic.publish(ToolEvent.prototype.SHOW_SUN_ANGLE_PLOT, {
                                parent: this,
                                editToolbar: this.editToolbar,
                                graphic: selected,
                                projection: this.basemapSingleton.currentMapProjection,
                                endpoint: this.config.services.sunAngleService,
                                ltd: ltd,
                                alt: alt
                            });
                        })
                    }));

                }

            }
            else if (type === "polyline") {

                this.ctxMenuForGraphics.addChild(new MenuItem({
                    label: "Move/Resize Shape",
                    onClick: lang.hitch(this, function () {
                        if (this.selectedGraphic.geometry.type !== "point") {
                            this.editToolbar.activate(Edit.SCALE | Edit.MOVE, this.selectedGraphic);
                            this.isEditing = true;
                        }
                    })
                }));

                this.ctxMenuForGraphics.addChild(new MenuItem({
                    //disabled: true,
                    label: "Distance Calculation",
                    onClick: lang.hitch(this, function () {
                        var dial = new DistanceInputDialog();
                        dial.startup(this, this.editToolbar, this.selectedGraphic);
                    })
                }));

                if (this.config.services.elevationService.equirect !== "") {
                    this.ctxMenuForGraphics.addChild(new MenuItem({
                        //disabled: true,
                        label: "Elevation Profile Calculation",
                        onClick: lang.hitch(this, function () {
                            var dial = new ElevationInputDialog();
                            dial.startup(this, this.editToolbar, graphic);
                        })
                    }));
                }

                /*
                 if (currentToolSelected == "CalculateElevationProfile")
                 {
                 if (this.config.services.elevationService.equirect !== "")
                 {
                 this.ctxMenuForGraphics.addChild(new MenuItem({
                 //disabled: true,
                 label: "Elevation Profile Calculation",
                 onClick: lang.hitch(this, function () {
                 var dial = new ElevationInputDialog();
                 dial.startup(this, this.editToolbar, graphic);
                 })
                 }));
                 }
                 }
                 else if (currentToolSelected == "CalculateDistance")
                 {
                 this.ctxMenuForGraphics.addChild(new MenuItem({
                 //disabled: true,
                 label: "Distance Calculation",
                 onClick: lang.hitch(this, function () {
                 var dial = new DistanceInputDialog();
                 dial.startup(this, this.editToolbar, this.selectedGraphic);
                 })
                 }));
                 }
                 */

            } else {
                //anything here is a polygon

                this.ctxMenuForGraphics.addChild(new MenuItem({
                    label: "Move/Resize Shape",
                    onClick: lang.hitch(this, function () {
                        if (this.selectedGraphic.geometry.type !== "point") {
                            this.editToolbar.activate(Edit.SCALE | Edit.MOVE, this.selectedGraphic);
                            this.isEditing = true;
                        }
                    })
                }));

                var self = this;
                if (this.config.stlServiceURL !== "") {

                    var stlSubMenu = new Menu();
                    stlSubMenu.addChild(new MenuItem({
                        label: " STL",
                        onClick: lang.hitch(this, function () {
                            var dial = new STLInputDialog();
                            dial.startup(self, 'STL');
                        })
                    }));
                    stlSubMenu.addChild(new MenuItem({
                        label: " OBJ",
                        onClick: lang.hitch(this, function () {
                            var dial = new STLInputDialog();
                            dial.startup(self, 'OBJ');
                        })
                    }));

                    this.ctxMenuForGraphics.addChild(new PopupMenuItem({
                        label: "Generate 3D Print",
                        popup: stlSubMenu
                        /*
                         label: "STL Calculation",
                         onClick: lang.hitch(this, function() {
                         //topic.publish(ToolEvent.prototype.SHOW_POLYGON_STL, selected);
                         var dial = new STLInputDialog();
                         dial.startup(self);
                         })
                         */
                    }));
                }

                if (this.isLogin) {
                    //hack for now.  should make this configurable

                    // this.ctxMenuForGraphics.addChild(new MenuItem({
                    //   label: "Surface Lighting Calculation",
                    //   onClick: lang.hitch(this, function() {
                    //     //topic.publish(ToolEvent.prototype.SURFACE_LIGHTING, selected);
                    //     var dial = new LightingInputDialog();
                    //     dial.startup(this, this.editToolbar, graphic);
                    //   })
                    // }));

                    this.ctxMenuForGraphics.addChild(new MenuItem({
                        label: "Subsetting",
                        onClick: lang.hitch(this, function () {
                            //topic.publish(ToolEvent.prototype.SUBSETING, selected);
                            var dial = new SubsetInputDialog();
                            dial.startup(this, this.editToolbar, graphic);
                        })
                    }));

                    this.ctxMenuForGraphics.addChild(new MenuItem({
                        label: "Slope",
                        onClick: lang.hitch(this, function () {
                            var dial = new SlopeInputDialog();
                            dial.startup(this, this.editToolbar, graphic);
                        })
                    }));

                    if (this.config.data.tools.detectCrater) {
                        this.ctxMenuForGraphics.addChild(new MenuItem({
                            label: "Detect Crater",
                            onClick: lang.hitch(this, function () {
                                //topic.publish(ToolEvent.prototype.SUBSETING, selected);
                                var dial = new CraterInputDialog();
                                dial.startup(this, this.editToolbar, graphic);
                            })
                        }));
                    }

                    if (this.config.data.tools.detectRock) {
                        this.ctxMenuForGraphics.addChild(new MenuItem({
                            label: "Detect Rock",
                            onClick: lang.hitch(this, function () {
                                //topic.publish(ToolEvent.prototype.SUBSETING, selected);
                                var dial = new RockInputDialog();
                                dial.startup(this, this.editToolbar, graphic);
                            })
                        }));
                    }

                    if (this.config.data.tools.esp) {
                        this.ctxMenuForGraphics.addChild(new MenuItem({
                            label: "Esp Calculate",
                            onClick: lang.hitch(this, function () {
                                var dial = new EspInputDialog();
                                dial.startup(this, this.editToolbar, graphic);
                            })
                        }));
                    }

                }
            }

            this.ctxMenuForGraphics.addChild(new MenuSeparator());

            this.ctxMenuForGraphics.addChild(new MenuItem({
                label: "Remove Marker",
                onClick: lang.hitch(this, function () {
                    topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.selectedGraphic);
                })
            }));

            this.ctxMenuForGraphics.startup();
        },

        createBookmarkGraphicsMenu: function(graphic){
            var type = graphic.geometry.type;
            var selected = graphic;

            this.ctxMenuForGraphics = new Menu({});
            this.ctxMenuForGraphics.leftClickToOpen = true;

            var currentToolSelected = selected.infoTemplate;

            //this.ctxMenuForGraphics.addChild(new MenuSeparator());

            this.ctxMenuForGraphics.addChild(new MenuItem({
                label: "Remove Marker",
                onClick: lang.hitch(this, function() {
                    topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.selectedGraphic);
                })
            }));

            this.ctxMenuForGraphics.startup();

        },

        removeMapGraphic: function(graphic){
            if(graphic.attributes != undefined) {
                if(graphic.attributes["graphicType"] === "bookmarkAnnotation"){
                    this.removeAnnotationGraphicFromAnnotation(graphic);
                }
                if(graphic.attributes["graphicType"] === "bookmarkShape"){
                    this.removeShapeFromCreateBookmarkShapes(graphic);
                }
            }
            this.map.graphics.remove(graphic);
            this.preventElevationPlotScrollOnRemove(graphic);
        },

        showSTL: function(graphic, resolution)
        {
          STLController.prototype.generateSTL(
            this.config.services.stlService,
            this.getGlobalDEMEndpoint(),
            graphic.geometry._extent.xmin,
            graphic.geometry._extent.ymin,
            graphic.geometry._extent.xmax,
            graphic.geometry._extent.ymax,
            resolution,
            resolution
          );
        },

        showOBJ: function(graphic, resolution, endPoint)
        {
          STLController.prototype.generateOBJ(
            this.config.services.objService,
            endPoint,
            this.getGlobalDEMEndpoint(),
            graphic.geometry._extent.xmin,
            graphic.geometry._extent.ymin,
            graphic.geometry._extent.xmax,
            graphic.geometry._extent.ymax,
            resolution,
            resolution
          );
        },

        getElevationDEMEndpoint: function(mapProjection) {
            var endpoint;

            if(mapProjection === this.config.projection.N_POLE) {
                endpoint = this.config.services.elevationDEMEndpoints.northpole;
            } else if(mapProjection === this.config.projection.S_POLE) {
                endpoint = this.config.services.elevationDEMEndpoints.southpole;
            } else {
                //default to equirect for all others
                endpoint = this.config.services.elevationDEMEndpoints.equirect;
            }

            return endpoint;
        },

        getGlobalDEMEndpoint: function() {
            var endpoint;
            var mapProjection = this.basemapSingleton.currentMapProjection;

            if(mapProjection === this.config.projection.N_POLE) {
                endpoint = this.config.services.globalDEMService.northpole;
            } else if(mapProjection === this.config.projection.S_POLE) {
                endpoint = this.config.services.globalDEMService.southpole;
            } else {
                //default to equirect for all others
                endpoint = this.config.services.globalDEMService.equirect;
            }

            return endpoint;
        },

        getOBJDEMEndpoint: function(uuid)
        {
        },

        addPolylineGraphicPoint: function(x, y){
            var symbol = new SimpleMarkerSymbol({
                "color": [255,255,0,200],
                "size": 12,
                "angle": -30,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "outline": {
                    "color": [0,0,0,255],
                    "width": 1,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                }
            });

            var point = new Point(x, y, this.map.spatialReference),
                graphic = new Graphic(point, symbol);

            this.map.graphics.add(graphic);

            return graphic;
        },

        removeLastPolylineGraphicPoint: function(graphic){
            this.map.graphics.remove(graphic);
        },

        removePolylineGraphicPoints: function(){
            this.removeLastPolylineGraphicPoint(this.lastPlotGraphic);
            this.lastPlotGraphic = null;
        },

        //Prevent showing points on map when scrolling over elevation plot after movement
        preventElevationPlotScrollOnMovement: function(){
            if(this.isEditing === true){
                if(this.editToolbar.getCurrentState().graphic.geometry.type.trim() === "polyline"){
                    if(this.editToolbar.getCurrentState().isModified === true){
                        topic.publish(MapEvent.prototype.PREVENT_ELEVATION_PLOT_SCROLL, {
                            graphic: this.editToolbar.getCurrentState().graphic
                        });
                    }
                }
            }
        },

        //Prevent showing points on map when scrolling over elevation plot after deletion
        preventElevationPlotScrollOnRemove: function(graphic){
            if(graphic.geometry.type.trim() === "polyline"){
                topic.publish(MapEvent.prototype.PREVENT_ELEVATION_PLOT_SCROLL, {
                    graphic: graphic
                });
                this.removePolylineGraphicPoints();
            }
        },

        setUpSubpointTools: function(){
            if(this.config.tools.overHeadOrbiters) {

                for(var i=0;i<this.config.services.subpoints.length;i++){
                    var subpoint = this.config.services.subpoints[i];
                    var html = '<li data-type="' + subpoint.type + '">' +
                            '<a id="' + subpoint.type.toLowerCase() + 'SubpointTool" title="Toggle overhead ' + subpoint.type.toLowerCase() + ' position" alt="Toggle overhead ' + subpoint.type.toLowerCase() + ' position" data-type="' + subpoint.type + '">' +
                                '<span id="' + subpoint.type.toLowerCase() + 'SubpointToolIcon" class="fa fa-toggle-off subpoint-option orbiterSwitch" data-type="' + subpoint.type + '"></span>' +
                                '<span data-dojo-attach-point="' + subpoint.type.toLowerCase() + 'OverHeadToolLabel" class="orbiterSwitchLabel" data-type="' + subpoint.type + '">' + subpoint.title + '</span>' +
                                '<span class="tool-description" data-type="' + subpoint.type + '"></span>' +
                            '</a>' +
                        '</li>';
                    
                    var subpointItemNode = domConstruct.place(html, this.orbiterList);

                    var self = this;
                    on(subpointItemNode, "click", function (e) {
                        self.initSubpointTool(e);
                    });

                }
                on(this.locateOrbitersBtn, "click", lang.hitch(this, this.openLocateOrbiters));

            }else{
                domConstruct.destroy(this.locateOrbiters);
            }

            if(this.config.tools.overHeadSunEarth) {
                //on(this.locateSunEarth, "click", lang.hitch(this, this.openLocateSunEarth));
            }else{
                domConstruct.destroy(this.locateSunEarth);
            }
        },

        openLocateOrbiters: function(){
            domClass.toggle(this.locateOrbitersListDiv, "hidden");
        },

        initSubpointTool: function(evt) {
            //change to 2D if in 3D mode
            if(this.currentView === "3d") {
                topic.publish(MapEvent.prototype.VIEW_2D);
            }

            var icon = evt.target.dataset.type.toLowerCase() + "SubpointToolIcon";
            var type = evt.target.dataset.type.toUpperCase();

            var map = this.mapDijit.equirectMap,
                instance,
                instanceIndex;

            for(var s = 0; s < this.subpointInstance.length; s++) {
                if(this.subpointInstance[s].type === type) {
                    instance = this.subpointInstance[s].instance;
                    instanceIndex = s;
                    break;
                }
            }

            if(!instance) {
                instance = new SubpointController(type, map);

                aspect.before(instance, "parseResults", lang.hitch(this, function(){
                    instance.setIsCurrentlyActive(true);
                }));
                aspect.after(instance, "parseResults", lang.hitch(this, function(){
                    domClass.remove(icon, "subpoint-option-loading");
                    domClass.add(icon, "subpoint-option-checked");

                    for(var i = 0; i < this.subpointInstance.length; i++) {
                        if(i !== s){
                            this.subpointInstance[i].instance.setIsCurrentlyActive(false);
                        }
                    }
                }));

                aspect.after(instance, "notifyToolsGallery", lang.hitch(this, function(type){
                    for(var i = 0; i < this.subpointInstance.length; i++) {
                        if(this.subpointInstance[i].type.toLowerCase() === type.toLowerCase()){
                            this.subpointInstance[i].instance.setIsCurrentlyActive(true);
                        }
                        else{
                            this.subpointInstance[i].instance.setIsCurrentlyActive(false);
                        }
                    }
                }), true);

                instance.startSubpointService();
                domClass.remove(icon, "fa-toggle-off");
                domClass.add(icon, "fa-toggle-on");
                domClass.add(icon, "subpoint-option-loading");
                this.subpointInstance.push({
                    type: type,
                    instance: instance,
                    isRunning: true
                });
            } else {
                if(!instance.isDownloading){
                    if(this.subpointInstance[instanceIndex].isRunning) {
                        domClass.remove(icon, "fa-toggle-on");
                        domClass.remove(icon, "subpoint-option-checked");
                        domClass.add(icon, "fa-toggle-off");

                        instance.stopSubpointDisplay();
                        instance.stopCallInterval();
                        this.subpointInstance[s].isRunning = false;
                    } else {
                        domClass.remove(icon, "fa-toggle-off");
                        domClass.add(icon, "fa-toggle-on");
                        domClass.add(icon, "subpoint-option-loading");

                        instance.startSubpointService();
                        this.subpointInstance[s].isRunning = true;
                    }
                }
            }
        },

        stlPrint: function() {
            var content = '<div style=max-width:550px;text-align:center;margin:auto;><p style=text-align:left;>A 3D model of Vesta is available for use with most 3D printers. The files below are varying resolutions of an "East" and "West" half of Vesta. Once each is printed, put them together to have a full model!</p></div>' +
                '<div style=text-align:center><div style=display:inline-block><img src=jpl/assets/images/3d-west.png class=img-rounded><h3>West Half</h3><ul style=text-align:left>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-west-259198.stl target=_blank>Low resolution - 259,000 polygons/13 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-west-518398.stl target=_blank>Medium resolution - 518,000 polygons/26 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-west-950000.stl target=_blank>High resolution - 950,000 polygons/48 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-west-2073601.stl target=_blank>Very high resolution - 4 million polygons/207 MB</a></li>' +

                '</ul></div><div style=display:inline-block;><img src=jpl/assets/images/3d-east.png class=img-rounded style=margin-left:10px><h3>East Half</h3><ul style=text-align:left>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-east-259198.stl target=_blank>Low resolution - 259,000 polygons/13 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-east-518398.stl target=_blank>Medium resolution - 518,000 polygons/26 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-east-950000.stl target=_blank>High resolution -  950,000 polygons/48 MB</a></li>' +
                '<li><a style=color:#87AFE2 href=jpl/assets/stl/vestaglobe-east-2073602.stl target=_blank>Very high resolution - 2 million polygons/104 MB</a></li>' +
                '</ul></div></div>';

            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: "Vesta 3D Model",
                content: content,
                size: "lg"
            });
        },

        doSlope: function(graphic)
        {
          console.log('ToolSidebar::doSlope() - graphic = ' + graphic);
          console.log(graphic);

          console.log('ToolSidebar::doSlope() - this.map = ' + this.map);
          var dial = new SlopeInputDialog();
          dial.startup(this, this.editToolbar, graphic);
        },

        doEsp: function(graphic)
        {
          console.log('ToolSidebar::doEsp() - graphic = ' + graphic);
          console.log(graphic);

          console.log('ToolSidebar::doEsp() - this.map = ' + this.map);
          var dial = new EspInputDialog();
          dial.startup(this, this.editToolbar, graphic);
        },

        doSubseting: function(graphic)
        {
          //console.log('ToolSidebar::doSubseting() - graphic = ' + graphic);
          //console.log(graphic);
          var dial = new SubsetInputDialog();
          dial.startup(this, graphic, this.editToolbar, this.selectedGraphic);
        },

        doSurfaceLighting: function(graphic)
        {
          console.log('ToolSidebar::doSurfaceLighting() - graphic = ' + graphic);
          console.log(graphic);

          var dial = new LightingInputDialog();
          //console.log('ToolSidebar::doSurfaceLighting() - this.map = ' + this.map);
          //console.log('ToolSidebar::doSurfaceLighting() -  = ' + this.basemapSingleton.currentMapProjection);
          //console.log('ToolSidebar::doSurfaceLighting() -  = ' + this.config.projection.N_POLE);
          //console.log('ToolSidebar::doSurfaceLighting() -  = ' + this.config.projection.EQUIRECT);
          //console.log('ToolSidebar::doSurfaceLighting() -  = ' + this.config.projection.S_POLE);
          //dial.startup(this, this.map, graphic, this.basemapSingleton.currentMapProjection, this.editToolbar, this.selectedGraphic);
          dial.startup(this, graphic, this.basemapSingleton.currentMapProjection, this.editToolbar, this.selectedGraphic);
        },

        editMarker: function(graphic, option)
        {
          //this.graphic = graphic;
          console.log('ToolSidebar::editMarker() graphic = ' + graphic);
          console.log(graphic);
          console.log('ToolSidebar:editMarkereditMove() option = ' + option);
          console.log(option);
          this.editToolbar.activate(option, graphic);
        },

        view3DEnabled: function() {
          this.currentView = "3d";
        },

        handleLogin: function(token, uname, passwd)
        {
            this.passToken = token;
            this.username  = uname;
            this.passwd    = passwd;

            if(this.isLoggedIn(token)){
                this.isLogin = true;
                this.showRestrictedTools();
            }
            else{
                this.isLogin = false;
                this.hideRestrictedTools();
            }
        },

        isLoggedIn: function(token){
            return token != null
        },

        showRestrictedTools: function(){
            if(this.isProjectionEquirect()){
                this.enableToolsEquirect();
            }
        },

        hideRestrictedTools: function(){
            this.disableTools();
        },

        isProjectionEquirect: function(){
            return this.basemapSingleton.currentMapProjection === this.config.projection.EQUIRECT;
        },

        enableToolsEquirect: function(){
            this.enableAndShowToolLink('calculateSubsetLink');
            this.enableAndShowToolLink('calculateSlopeLink');
            this.enableAndShowToolLink('detectCraterLink');
            this.enableAndShowToolLink('detectRockLink');

            if(this.username === "lmmpadmin") {
                this.enableAndShowToolLink('createBookmarkLink');
            }
        },

        disableTools: function(){
            this.disableAndHideToolLink('calculateSubsetLink');
            this.disableAndHideToolLink('calculateSlopeLink');
            this.disableAndHideToolLink('detectCraterLink');
            this.disableAndHideToolLink('detectRockLink');
            this.disableAndHideToolLink('createBookmarkLink');
        },

        handleRestrictedToolsOnProjectionChange: function(projection){
            if(projection === this.config.projection.EQUIRECT) {
                if (!this.isLogin) {
                    this.disableTools();
                }
                else{
                    this.enableToolsEquirect();
                }
            }
            else{
                //N_POLE && S_POLE
                this.disableTools();
            }
        },

        enableAndShowToolLink: function(linkId){
            var domObject = query("#" + linkId)[0];
            if(domObject != null){
                domObject.disabled = false;
                domClass.remove(domObject, "hidden");
            }
        },

        disableAndHideToolLink: function(linkId){
            var domObject = query("#" + linkId)[0];
            if(domObject != null){
                domObject.disabled = true;
                domClass.add(domObject, "hidden");
            }
        },

        getRastersUrl: function(){
            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                return this.config.services.catalogRastersService.northpole;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                return this.config.services.catalogRastersService.southpole;
            } else {
                //default to equirect for all others
                return this.config.services.catalogRastersService.equirect;
            }
        },

        openBookmarkCreationMenu: function(){
            this.destroyLastBookmarkCreationMenu();
            domConstruct.empty(this.createBookmarkMenuDiv);

            /*this.bookmarkCreationMenu = new BookmarkCreationMenu();
            this.bookmarkCreationMenu.setToolbar(this);*/
            this.bookmarkCreationMenu = this.createBookmarkCreationMenu();
            domConstruct.place(this.bookmarkCreationMenu.domNode, this.createBookmarkMenuDiv);
            domClass.add(this.toolsMenu, "hidden");
            domClass.remove(this.createBookmarkMenuDiv, "hidden");

            //this.bookmarkCreationMenu.setType(type);
        },

        createBookmarkCreationMenu: function(){
            var map = this.getMap();
            var layers = map.layerIds;
            var extent = map.extent;

            var layerTransparencies = [];
            for(var i=0; i<layers.length; i++){
                layerTransparencies.push(map.getLayer(layers[i]).opacity);
            }

            var bookmarkCreationMenu = new BookmarkCreationMenu();
            bookmarkCreationMenu.setToolbar(this);
            bookmarkCreationMenu.startup();
            bookmarkCreationMenu.setLayerIds(layers);
            bookmarkCreationMenu.setLayerTransparencies(layerTransparencies);
            bookmarkCreationMenu.setExtent(extent);
            bookmarkCreationMenu.setProjection(this.basemapSingleton.currentMapProjection);

            return bookmarkCreationMenu;
        },

        updateBookmarkCreationExtent: function(){
            var map = this.getMap();
            var extent = map.extent;

            this.bookmarkCreationMenu.setExtent(extent);
        },

        updateBookmarkCreationLayers: function(){
            var map = this.getMap();
            var layers = map.layerIds;
            var layerTransparencies = [];
            for(var i=0; i<layers.length; i++){
                layerTransparencies.push(map.getLayer(layers[i]).opacity);
            }
            this.bookmarkCreationMenu.setLayerIds(layers);
            this.bookmarkCreationMenu.setLayerTransparencies(layerTransparencies);
        },

        closeBookmarkCreationMenu: function(){
            domClass.remove(this.toolsMenu, "hidden");
            domClass.add(this.createBookmarkMenuDiv, "hidden");
            domConstruct.empty(this.createBookmarkMenuDiv);

            this.clearMapOfBookmarkGraphics();

            this.bookmarkCreationMenu = null;
            this.bookmarkShape = null;
            this.bookmarkAnnotation = [];
        },

        destroyLastBookmarkCreationMenu: function(){
            if(this.bookmarkCreationMenu !== null){
                domConstruct.destroy(this.bookmarkCreationMenu);
                this.bookmarkCreationMenu = null;
            }
        },

        activateDetectCraterProcess: function () {
            dojo.disconnect(this.rectangleB);
            this.rectangleB = null;

            this.dialog = new CraterModalDialog();

            this.rectangleB = this.dialog.getModalButton('Rectangle');
            dojo.connect(this.rectangleB, 'click', this, this.generateCrater);
        },

        activateDetectRockProcess: function () {
            dojo.disconnect(this.rectangleB);
            this.rectangleB = null;

            this.dialog = new RockModalDialog();

            this.rectangleB = this.dialog.getModalButton('Rectangle');
            dojo.connect(this.rectangleB, 'click', this, this.generateRock);
        },

        activateGenerateContourProcess: function() {
            dojo.disconnect(this.rectangleB);
            this.rectangleB = null;

            this.dialog = new ContourDemoModalDialog();

            this.rectangleB = this.dialog.getModalButton('Rectangle');
            dojo.connect(this.rectangleB, 'click', this, this.generateContourDemo);
        },

        activateGenerateSlopeProcess: function() {
            dojo.disconnect(this.rectangleB);
            this.rectangleB = null;

            this.dialog = new SlopeDemoModalDialog();

            this.rectangleB = this.dialog.getModalButton('Rectangle');
            dojo.connect(this.rectangleB, 'click', this, this.generateSlopeDemo);
        },

        createBookmarkAddShape: function(){
            this.openBookmarkCreationMenu("shape");
        },

        createBookmarkAddAnnotation: function(){
            this.openBookmarkCreationMenu("annotation");
        },

        createBookmarkFinish: function(){
            var inputs = this.bookmarkCreationMenu.bookmarkCreationDetailsMenu.getInputs();
            console.log("finishBookmark input", inputs);
            console.log("finish bookmark graphics", this.bookmarkShapes);
            console.log("finish bookmark annotations", this.bookmarkAnnotations);


            //CONVERT BOOKMARK TO JSON
            var parentUuid = this.genUUID();
            var collectionProductLabel = inputs.title + "_bookmark";
            var collectionItem_DBID = "";
            var collectionTitle = inputs.title;
            var collectionItemType = "bookmark";
            var collectionBbox = inputs.extent.xmin + "," +
                inputs.extent.ymin + "," +
                inputs.extent.xmax + "," +
                inputs.extent.ymax;
            var collectionDescription = inputs.description;
            var collectionDataProjection = inputs.dataProjection;
            var collectionMediaUrl = inputs.mediaUrl;
            var collectionMediaType = "image";

            var layerString = "[";
            for(var i=0; i < inputs.layerIds.length ; i++){
                if(i === inputs.layerIds.length - 1){
                    layerString = layerString + '{"' + inputs.layerIds[i] + '",' + inputs.layerTransparencies[i] + "}";
                }
                else{
                    layerString = layerString + '{"' + inputs.layerIds[i] + '",' + inputs.layerTransparencies[i] + "},";
                }
            }
            layerString = layerString + "]";
            //"layers":"[{\"productLabel\":\"lro\", \"transparency\":0.4},{\"productLabel\":\"lro2\", \"transparency\":0.4}]"

            var collectionExtentWkt = this.wktUtil.convertExtentToWkt(inputs.extent);

            var bookmark = {
                "item_UUID": parentUuid,
                "productLabel": collectionProductLabel,
                "item_DBID": collectionItem_DBID,
                "title": collectionTitle,
                "itemType": collectionItemType,
                "shape": collectionExtentWkt,
                "bbox": collectionBbox,
                "description": collectionDescription,
                "dataProjection": collectionDataProjection,
                "mediaURL": collectionMediaUrl,
                "mediaType": collectionMediaType,
                "sortPriority": 1,
                "layers": layerString
            };

            var collection = [];
            collection.push(bookmark);

            //CONVERT ALL GRAPHICS
            var features = [];
            for(var i=0; i < this.bookmarkShapes.length; i++){

                var featureItem_UUID = this.genUUID();
                var featureProductLabel = this.bookmarkShapes[i].title + "_BOOKMARK_FEATURE";
                var featureItem_DBID = "";
                var featureTitle = this.bookmarkShapes[i].title;
                var featureItemType = "feature";
                var featureGraphicType = "shape";
                var featureBbox = inputs.extent.xmin + "," +
                    inputs.extent.ymin + "," +
                    inputs.extent.xmax + "," +
                    inputs.extent.ymax;
                var featureDescription = this.bookmarkShapes[i].description;
                var featureMediaUrl = this.bookmarkShapes[i].mediaUrl;
                var featureMediaType = "image";

                var components = this.wktUtil.convertGeometryToComponents(this.bookmarkShapes[i].graphic.geometry);
                var featureShape = this.wktUtil.convertComponentsToWkt(components);

                var featureFillColor = this.bookmarkShapes[i].graphic.symbol.color;
                var featureBorderColor = this.bookmarkShapes[i].graphic.symbol.color;
                if(this.bookmarkShapes[i].graphic.symbol.outline){
                    featureBorderColor = this.bookmarkShapes[i].graphic.symbol.outline.color;
                }
                else{
                    featureBorderColor = featureFillColor;
                }
                featureFillColor = this.convertColorToString(featureFillColor);
                featureBorderColor = this.convertColorToString(featureBorderColor);

                var feature = [{
                    "item_UUID": featureItem_UUID,
                    "productLabel": featureProductLabel,
                    "item_DBID": featureItem_DBID,
                    "itemType": featureItemType,
                    "graphicType": featureGraphicType,
                    "collectionParent": [parentUuid],
                    "title": featureTitle,
                    "shape": featureShape,
                    "bbox": featureBbox,
                    "borderColor": featureBorderColor,
                    "fillColor": featureFillColor,
                    "description": featureDescription,
                    "mediaUrl": featureMediaUrl,
                    "mediaType": featureMediaType,
                    "order": i
                }];

                features.push(JSON.stringify(feature));
            }

            //CONVERT ANNOTATIONS INTO JSON
            var annotations = [];
            for(var i = 0; i < this.bookmarkAnnotations.length; i++) {
                var geometry = null;
                for (var j = 0; j < this.bookmarkAnnotations[i].length; j++) {
                    if (j === 0) {
                        geometry = this.bookmarkAnnotations[i][j].geometry;
                    }
                    else {
                        geometry.paths.push(this.bookmarkAnnotations[i][j].geometry.paths[0]);
                    }
                }

                var components = this.wktUtil.convertGeometryToComponents(geometry);
                var annotationWktString = this.wktUtil.convertComponentsToWkt(components);

                var annotationItem_UUID = this.genUUID();
                var annotationProductLabel = collectionProductLabel + "_ANNOTATION_FEATURE";
                var annotationItem_DBID = "";
                var annotationItemType = "feature";
                var annotationGraphicType = "annotation";
                var annotationMediaUrl = "";
                var annotationMediaType = "image";

                var annotationFillColor = this.bookmarkAnnotations[i][0].symbol.color;
                var annotationBorderColor = this.bookmarkAnnotations[i][0].symbol.color;
                if(this.bookmarkAnnotations[i][0].symbol.outline){
                    annotationBorderColor = this.bookmarkAnnotations[i][0].symbol.outline.color;
                }
                else{
                    annotationBorderColor = annotationFillColor;
                }
                annotationFillColor = this.convertColorToString(annotationFillColor);
                annotationBorderColor = this.convertColorToString(annotationBorderColor);

                var annotation = [{
                    "item_UUID": annotationItem_UUID,
                    "productLabel": annotationProductLabel,
                    "item_DBID": annotationItem_DBID,
                    "itemType": annotationItemType,
                    "graphicType": annotationGraphicType,
                    "collectionParent": [parentUuid],
                    "shape": annotationWktString,
                    "bbox": collectionBbox,
                    "borderColor": annotationBorderColor,
                    "fillColor": annotationFillColor,
                    "mediaUrl": "",
                    "mediaType": "",
                    "order": i
                }];

                annotations.push(JSON.stringify(annotation));
            }

            var collectionJson = JSON.stringify(collection);

            console.log("collectionJson", collectionJson);
            console.log("features", features);
            console.log("annotations", annotations);

            var url = this.createBookmarkUploadUrl(collectionDataProjection);

            this.uploadBookmarkItem(collectionJson, url);

            for(var i = 0; i < features.length; i++){
                this.uploadBookmarkItem(features[i], url);
            }

            for(var i = 0; i < annotations.length; i++){
                this.uploadBookmarkItem(annotations[i], url);
            }

            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: "Bookmark Saved",
                content: '<div style="text-align:center;">Your bookmark has been saved. You can now find it in search bar results.</div>',
                size: "lg"
            });

            this.cleanupBookmarkCreation();

        },

        uploadBookmarkItem: function(json, url){
            console.log("UPLOADING json", json);
            console.log("TO url:", url);
            xhr(url, {
                handleAs: "json",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": null
                },
                data: json,
                method: "POST"
            }).then(lang.hitch(this, function(data) {
                console.log("then", data);
            }), function(err) {
                console.log("error uploading bookmark:" + err);
            });
        },

        createBookmarkUploadUrl: function(projection){
            var url = this.config.bookmarkServiceUpdateUrl;
            if(projection === this.config.data.projections.northpole){
                url = url.replace("PROJECTION", "polar");
            }
            if(projection === this.config.data.projections.southpole){
                url = url.replace("PROJECTION", "polar");
            }
            if(projection === this.config.data.projections.equirect){
                url = url.replace("PROJECTION", "eq");
            }
            return url;
        },

        getMap: function(){
            var map = null;
            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            } else {
                //default to equirect for all others
                map = this.mapDijit.equirectMap;
            }

            return map;
        },


        cleanupBookmarkCreation: function(){
            this.clearMapOfBookmarkGraphics();
            this.bookmarkCreationMenu.cancelThisBookmark();
        },

        clearMapOfBookmarkGraphics: function(){
            this.clearBookmarkShape();
            this.clearBookmarkShapes();
            this.clearBookmarkAnnotation();
            this.clearBookmarkAnnotations();
        },

        clearBookmarkShape: function(){
            if(this.bookmarkShape){
                //topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.bookmarkShape);
                this.map.graphics.remove(this.bookmarkShape);
            }
        },

        clearBookmarkShapes: function(){
            for(var i = 0; i < this.bookmarkShapes.length; i++){
                //topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.bookmarkShapes[i].graphic);
                this.map.graphics.remove(this.bookmarkShapes[i].graphic);
            }
            this.bookmarkShapes = [];
        },

        clearBookmarkAnnotation: function(){
            if(this.bookmarkAnnotation){
                for(var i = 0; i < this.bookmarkAnnotation.length; i++) {
                    //topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.bookmarkAnnotation[i]);
                    this.map.graphics.remove(this.bookmarkAnnotation[i]);
                }
            }
        },

        clearBookmarkAnnotations: function(){
            for(var i = 0; i < this.bookmarkAnnotations.length; i++) {
                for (var j = 0; j < this.bookmarkAnnotations[i].length; j++) {
                    //topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.bookmarkAnnotations[i][j]);
                    this.map.graphics.remove(this.bookmarkAnnotations[i][j]);
                }
            }
            this.bookmarkAnnotations = [];
        },

        removeShapeFromCreateBookmarkShapes: function(graphic){
            if(this.bookmarkShape === graphic){
                this.bookmarkShape = null;
            }

            var indexToDelete = null;
            for(var i = 0; i < this.bookmarkShapes.length; i++){
                if(graphic === this.bookmarkShapes[i].graphic){
                    indexToDelete = i;
                }
            }
            this.bookmarkShapes.splice(indexToDelete, 1);
            this.bookmarkCreationMenu.bookmarkCreationDetailsMenu.removeGraphicFromVisibleList("shape", graphic);

            this.verifyBookmarkShape(this.bookmarkShape);
        },

        removeAnnotationGraphicFromAnnotation: function(graphic){
            if(this.bookmarkAnnotation){
                for(var i = 0; i < this.bookmarkAnnotation.length; i++){
                    if(this.bookmarkAnnotation[i] === graphic){
                        this.bookmarkAnnotation.splice(i,1);
                    }
                }
            }

            var indexToDeleteI = null;
            var indexToDeleteJ = null;
            for(var i = 0; i < this.bookmarkAnnotations.length; i++){
                for(var j = 0; j < this.bookmarkAnnotations[i].length; j++){
                    if(graphic === this.bookmarkAnnotations[i][j]){
                        indexToDeleteI = i;
                        indexToDeleteJ = j;
                    }
                }
            }
            this.bookmarkAnnotations[indexToDeleteI].splice(indexToDeleteJ, 1);
            this.bookmarkCreationMenu.bookmarkCreationDetailsMenu.removeGraphicFromVisibleList("annotation", graphic);
            if(this.bookmarkAnnotations[indexToDeleteI].length === 0){
                this.bookmarkAnnotations.splice(indexToDeleteI, 1);
            }

            this.verifyBookmarkAnnotation();
        },

        verifyBookmarkShape: function(graphic){

            if(this.isCreatingShape) {
                this.bookmarkShape = graphic;

                if (this.bookmarkShape) {
                    this.bookmarkCreationMenu.bookmarkCreationShapeMenu.enableNextButton();
                }
                else {
                    this.bookmarkCreationMenu.bookmarkCreationShapeMenu.disableNextButton();
                }
            }
        },

        updateAnnotationGraphic: function(){

        },

        verifyBookmarkAnnotation: function(){
            if(this.bookmarkAnnotation){
                if(this.bookmarkAnnotation.length > 0){
                    this.bookmarkCreationMenu.bookmarkCreationAnnotationMenu.enableAnnotationNextButton();
                }
                else{
                    this.bookmarkCreationMenu.bookmarkCreationAnnotationMenu.disableAnnotationNextButton();
                }
            }
            else{
                this.bookmarkCreationMenu.bookmarkCreationAnnotationMenu.disableAnnotationNextButton();
            }

        },

        createBookmarkSaveShape: function(){
            console.log("save graphic to bookmark", this.bookmarkShape);
            var boomarkGraphicItem = {
                "title": this.bookmarkCreationMenu.bookmarkCreationShapeMenu.getTitle(),
                "description": this.bookmarkCreationMenu.bookmarkCreationShapeMenu.getDescription(),
                "mediaUrl": this.bookmarkCreationMenu.bookmarkCreationShapeMenu.getMediaUrl(),
                "graphic": this.bookmarkShape
            };
            this.bookmarkShapes.push(boomarkGraphicItem);
            this.bookmarkCreationMenu.bookmarkCreationDetailsMenu.addGraphicToVisibleList("shape", boomarkGraphicItem);
            console.log("save graphic to bookmark Full", this.bookmarkShapes);

            this.bookmarkShape = null;
        },

        createBookmarkSaveAnnotation: function(){
            console.log("save annotation to bookmark", this.bookmarkAnnotation);
            var bookmarkAnnotationClone = this.bookmarkAnnotation.splice(0);
            this.bookmarkAnnotations.push(bookmarkAnnotationClone);
            this.bookmarkAnnotation = [];
            this.bookmarkCreationMenu.bookmarkCreationDetailsMenu.addGraphicToVisibleList("annotation", bookmarkAnnotationClone);
            console.log("save annotation to bookmark full", this.bookmarkAnnotations);

            this.bookmarkShape = null;
        },

        stopDrawing: function(){
            if(this.toolbar) {
                this.toolbar.deactivate();
            }
            this.isDrawing = false;
            this.isEditing = false;
        },

        convertColorToString: function(color){
            var colorString = color.r;
            colorString = colorString + "," + color.g;
            colorString = colorString + "," + color.b;
            colorString = colorString + "," + color.a;
            return colorString
        },

        genUUID: function(){
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },

        s4: function(){
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        },

        setContinueShapeUi: function(){
            topic.publish(NavigationEvent.prototype.OPEN_TOOL_SIDEBAR);
            this.bookmarkCreationMenu.bookmarkCreationShapeMenu.flashNextButton();
        },

        setContinueAnnotationUi: function(){
            //highlight tool sidebar button
        },

        setBookmarkAnnotationsColor: function(value){
            this.bookmarkCreationMenu.setBookmarkAnnotationsColor(value);
        },

        setControlBarBookmarkAnnotationsColor: function(value){
            this.controlBar.setControlBarBookmarkAnnotationsColor(value);
        }

    });
});
