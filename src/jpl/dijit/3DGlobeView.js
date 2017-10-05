/**
 * 3D Globe functionality
 *
 * @module jpl/dijit/3DGlobeView
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/i18n!./nls/textContent",
    "dojo/keys",
    "dojo/query",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/mouse",
    "dojo/dom-construct",
    "dojo/topic",
    "dojo/request/xhr",
    "dojo/aspect",
    "dojo/cookie",
    "bootstrap-tour/Tour",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/3DGlobeView.html',
    "xstyle/css!./css/3DGlobeView.css",
    "jpl/utils/WebGLDetector",
    "jpl/utils/MapUtil",
    "jpl/data/Layers",
    "jpl/data/BaseMaps",
    "jpl/data/Projection",
    "jpl/config/Config",
    "jpl/events/MapEvent",
    "jpl/events/LayerEvent",
    "jpl/events/BookmarkEvent",
    "jpl/events/ToolEvent",
    "jpl/events/SlideshowEvent",
    "jpl/gamePad/TrekController",
    "jpl/plugins/cesium/ArcGisMapServerTileImageryProvider",
    "jpl/utils/FeatureDetector",
    "jpl/dijit/ui/InfoWindow",
    "jpl/dijit/ui/FlyoverModal",
    "jpl/dijit/ui/ContextMenu",
    "cesium/Core/Clock",
    "cesium/Core/ClockRange",
    "cesium/Core/JulianDate",
    "cesium/Core/ScreenSpaceEventHandler",
    "cesium/Core/ScreenSpaceEventType",
    "cesium/Widgets/Viewer/Viewer",
    "jpl/plugins/cesium/Timeline",
    "cesium/Core/Math",
    "cesium/Core/Cartesian2",
    "cesium/Core/Cartesian3",
    "cesium/Core/Ellipsoid",
    "cesium/Scene/Sun",
    "cesium/Scene/Globe",
    "cesium/Scene/WebMapServiceImageryProvider",
    //"cesium/Scene/WebMapTileServiceImageryProvider",
    "jpl/plugins/cesium/TrekWebMapTileServiceImageryProvider",
    "cesium/Scene/LabelCollection",
    "cesium/Scene/ArcGisMapServerImageryProvider",
    "cesium/Scene/SingleTileImageryProvider",
    "cesium/Scene/Model",
    "cesium/Scene/SceneTransforms",
    "cesium/Core/CesiumTerrainProvider",
    "cesium/Core/DefaultProxy",
    "cesium/Core/Rectangle",
    "cesium/Core/Color",
    "cesium/Core/BingMapsApi",
    "cesium/Core/NearFarScalar",
    "cesium/Core/TimeInterval",
    "cesium/Core/TimeIntervalCollection",
    "cesium/Core/PinBuilder",
    "cesium/DataSources/EntityCollection",
    "cesium/DataSources/GeoJsonDataSource",
    "cesium/Scene/ImageryLayerCollection",
    "cesium/Core/GeographicTilingScheme",
    "cesium/DataSources/SampledPositionProperty",
    "cesium/DataSources/VelocityOrientationProperty",
    "cesium/Scene/VerticalOrigin",
    "cesium/Scene/HorizontalOrigin",
    "cesium/Scene/HeightReference",
    "cesium/Core/Cartographic",
    "cesium/DataSources/ConstantProperty",
    "cesium/Core/definedNotNull",
    "cesium/Core/LagrangePolynomialApproximation",
    "cesium/DataSources/LabelGraphics",
    "cesium/Core/PolygonHierarchy",
    //"cesium/scene/LabelStyle",//Test label
    "cesium/Scene/GroundPrimitive",
    "cesium/Core/GeometryInstance",
    "cesium/Core/CorridorGeometry",
    "cesium/Core/CornerType",
    "cesium/Core/VertexFormat",
    "cesium/Core/ColorGeometryInstanceAttribute",
    "jpl/utils/IndexerUtil",//test label
    "jpl/utils/WKTUtil"//test label
], function (declare, lang, on, textContent, keys, query, dom, domClass, domStyle, domAttr, mouse, domConstruct, topic, xhr, aspect, cookie, Tour, _WidgetBase, _TemplatedMixin,
     template, css, WebGLDetector, MapUtil, Layers, BaseMaps, Projection, Config, MapEvent, LayerEvent, BookmarkEvent, ToolEvent, SlideshowEvent, TrekController, ArcGisMapServerTileImageryProvider,
     FeatureDetector, InfoWindow, FlyoverModal, ContextMenu, Clock, ClockRange, JulianDate, ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Timeline, CesiumMath, Cartesian2,
     Cartesian3, Ellipsoid, Sun, Globe, WebMapServiceImageryProvider, TrekWebMapTileServiceImageryProvider, LabelCollection, ArcGisMapServerImageryProvider, SingleTileImageryProvider,
     Model, SceneTransforms, CesiumTerrainProvider, DefaultProxy, Rectangle, Color, BingMapsApi, NearFarScalar, TimeInterval, TimeIntervalCollection, PinBuilder, EntityCollection, GeoJsonDataSource, ImageryLayerCollection, GeographicTilingScheme,
     SampledPositionProperty, VelocityOrientationProperty, VerticalOrigin, HorizontalOrigin, HeightReference, Cartographic, ConstantProperty, definedNotNull, LagrangePolynomialApproximation, LabelGraphics, PolygonHierarchy,
     //LabelStyle,
     GroundPrimitive, GeometryInstance, CorridorGeometry, CornerType, VertexFormat, ColorGeometryInstanceAttribute, IndexerUtil, WKTUtil) {
    return declare([_WidgetBase, _TemplatedMixin], {
            controller: new TrekController(),
            templateString: template,
            widgetsInTemplate: true,
            activeControl: "mouse",
            controlsHandler: null,
            clock: null,
            addedLayers: [],
            visible: false,
            MAX_ZOOM_DISTANCE: 10000000.0,
            CENTER_DEFAULT_ALTITUDE: 400000.0,
            minimapIsGlobal: false,
            _zoomInInterval: "",
            _zoomOutInterval: "",
            currentExtent: {
                xmin: 0,
                ymin: 0,
                xmax: 0,
                ymax: 0
            },
            currentCenterPt: {},
            detectedFeatures: FeatureDetector.getInstance(),
            containerHasFocus: false,
            pinBuilder: null,
            pins: null,
            selectedEntity: null,
            hoverEntity: null,
            SELECTED_PIN: null,
            HOVER_PIN: null,
            NONHOVER_PIN: null,
            SUN_PIN: null,
            infoWindow: null,
            roverEntity: null,
            path: null,
            tourOn: false,
            tourControlKUListener: undefined,
            removeTickHandler: undefined,

            customEntities: null,
            contextMenu: null,
            hasCloseListener: false,
            hasTourPlayed: false,
            previousName: "",
            normal3DPoint:  {
                pixelSize : 15,
                color : Color.ORANGE,
                outlineColor : Color.BLACK, // default: BLACK
                outlineWidth : 2,
                verticalOrigin: VerticalOrigin.BOTTOM
            },
            selected3DPoint:  {
                pixelSize : 17,
                color : Color.YELLOW,
                outlineColor : Color.BLACK, // default: BLACK
                outlineWidth : 3,
                verticalOrigin: VerticalOrigin.BOTTOM
            },
            hover3DPoint:  {
                pixelSize : 15,
                color : Color.KHAKI,
                outlineColor : Color.AZURE, // default: BLACK
                outlineWidth : 4,
                verticalOrigin: VerticalOrigin.BOTTOM
            },
            slideShowEntity: null,
            tickNumber: 0,
            explorerHighlightPolygon: null,
            nomenclatureLabelEntities: [],
            bookmarkEntities: [],

            constructor: function () {
            },

            postCreate: function () {
            },

            startup: function () {
                this.config = Config.getInstance();
                this.indexerUtil = new IndexerUtil();
                this.wktUtil = new WKTUtil();

                topic.subscribe(MapEvent.prototype.MAP_INITIALIZED, lang.hitch(this, this.initialize));
            },

            initialize: function() {
                this.layersInstance = Layers.getInstance();
                this.basemapsInstance = BaseMaps.getInstance();

                //remove the webgl error message
                domConstruct.destroy("webGLErrorMessage");

                //add the event handlers for the 3d globe
                topic.subscribe(LayerEvent.prototype.BASEMAP_CHANGED, lang.hitch(this, this.changeBasemap));
                //topic.subscribe(LayerEvent.prototype.ADD_TO_MY_DATA, lang.hitch(this, this.addLayer));
                topic.subscribe(LayerEvent.prototype.ADD_LAYER_TO_3D_FOR_MARTIAN, lang.hitch(this, this.addActiveLayer));
                topic.subscribe(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, lang.hitch(this, this.addActiveLayer));
                topic.subscribe(LayerEvent.prototype.ADD_TO_STATIC_LAYERS, lang.hitch(this, this.addActiveLayer));
                topic.subscribe(LayerEvent.prototype.ADD_TO_AUTO_LAYERS, lang.hitch(this, this.addAutoLayers));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_AUTO_LAYERS, lang.hitch(this, this.removeAutoLayer));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_STATIC_LAYERS, lang.hitch(this, this.getAndRemoveLayer));
                //topic.subscribe(LayerEvent.prototype.REMOVE_FROM_MY_DATA, lang.hitch(this, this.getAndRemoveLayer));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, lang.hitch(this, this.getAndRemoveLayer));
                topic.subscribe(LayerEvent.prototype.OPACITY_CHANGED, lang.hitch(this, this.changeLayerOpacity));
                topic.subscribe(LayerEvent.prototype.SHOW_LAYER, lang.hitch(this, this.getAndShowLayer));
                topic.subscribe(LayerEvent.prototype.HIDE_LAYER, lang.hitch(this, this.getAndHideLayer));
                topic.subscribe(LayerEvent.prototype.REORDER_LAYERS, lang.hitch(this, this.reorderLayers));
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
                topic.subscribe(MapEvent.prototype.FLY_TO_TERRAIN, lang.hitch(this, this.flyToTerrain));
                topic.subscribe(MapEvent.prototype.FLY_TO_COORDINATE, lang.hitch(this, this.flyToCoordinate));
                topic.subscribe(MapEvent.prototype.GLOBE_SET_EXTENT, lang.hitch(this, this.flyToExtent));
                topic.subscribe(MapEvent.prototype.GLOBE_SET_CENTER, lang.hitch(this, this.updateCenterPoint));
                topic.subscribe(MapEvent.prototype.GLOBE_ZOOM_IN_START, lang.hitch(this, this.zoomIn));
                topic.subscribe(MapEvent.prototype.GLOBE_ZOOM_IN_END, lang.hitch(this, this.stopZoom));
                topic.subscribe(MapEvent.prototype.GLOBE_ZOOM_OUT_START, lang.hitch(this, this.zoomOut));
                topic.subscribe(MapEvent.prototype.GLOBE_ZOOM_OUT_END, lang.hitch(this, this.stopZoom));
                topic.subscribe(MapEvent.prototype.MAXIMIZE_3D_CONTAINER, lang.hitch(this, this.maximize3DContainer));
                topic.subscribe(MapEvent.prototype.MINIMIZE_3D_CONTAINER, lang.hitch(this, this.minimize3DContainer));
                topic.subscribe(MapEvent.prototype.VIEW_3D, lang.hitch(this, this.view3DEnabled));
                topic.subscribe(MapEvent.prototype.VIEW_2D, lang.hitch(this, this.view2DEnabled));
                topic.subscribe(MapEvent.prototype.BEGIN_TOUR_3D, lang.hitch(this, this.centerTour));
                topic.subscribe(MapEvent.prototype.EXIT_TOUR_3D, lang.hitch(this, this.exitTour));
                topic.subscribe(MapEvent.prototype.SHOW_FLY_OVER_TOUR_HELP, lang.hitch(this, this.showFlyOverTourHelp));
                topic.subscribe(MapEvent.prototype.INFO_CLOSED, lang.hitch(this, this.clearSelectedEntity));
                topic.subscribe(BookmarkEvent.prototype.WAYPOINT_HOVER, lang.hitch(this, this.featureHighlight));
                topic.subscribe(BookmarkEvent.prototype.WAYPOINT_LEAVE, lang.hitch(this, this.featureUnHighlight));
                topic.subscribe(BookmarkEvent.prototype.WAYPOINT_CLICK, lang.hitch(this, this.selectEntityByName));
                topic.subscribe(BookmarkEvent.prototype.SHOW_WAYPOINTS_3D, lang.hitch(this, this.showWaypoints));
                topic.subscribe(BookmarkEvent.prototype.HIDE_WAYPOINTS_3D, lang.hitch(this, this.hideWaypoints));
                //topic.subscribe(BookmarkEvent.prototype.BOOKMARK_ADDED, lang.hitch(this, this.addWaypoints3D));
                topic.subscribe(BookmarkEvent.prototype.BOOKMARK_REMOVED, lang.hitch(this, this.removeWaypoints3D));
                //topic.subscribe(BookmarkEvent.prototype.VIEW_REGION, lang.hitch(this, this.viewRegionInfo));
                //topic.subscribe(ToolEvent.prototype.CREATE_TERRAIN_VIEW_GRAPHIC, lang.hitch(this, this.addGraphic));
                //topic.subscribe(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, lang.hitch(this, this.removeGraphic));
                topic.subscribe(SlideshowEvent.prototype.ADD_SLIDE_SHOW_LOCATION_3D, lang.hitch(this, this.addSlideShowPoint));
                topic.subscribe(SlideshowEvent.prototype.REMOVE_SLIDE_SHOW_LOCATION_3D, lang.hitch(this, this.removeSlideShowPoint));
                topic.subscribe(SlideshowEvent.prototype.FLY_TO_SLIDE_SHOW_LOCATION_3D, lang.hitch(this, this.flyToSlideShowLocation));
                topic.subscribe(MapEvent.prototype.CHANGE_TERRAIN_EXAGGERATION, lang.hitch(this, this.changeTerrainExaggeration));
                topic.subscribe(MapEvent.prototype.ADD_EXPLORER_HIGH_LIGHT_POLYGON, lang.hitch(this, this.addExplorerHighLightPolygon));
                topic.subscribe(MapEvent.prototype.REMOVE_EXPLORER_HIGH_LIGHT_POLYGON, lang.hitch(this, this.removeExplorerHighLightPolygon));
                topic.subscribe(BookmarkEvent.prototype.ADD_GRAPHIC_TO_TERRAIN, lang.hitch(this, this.addBookmarkGraphicToTerrain));
                topic.subscribe(BookmarkEvent.prototype.REMOVE_GRAPHIC_FROM_TERRAIN, lang.hitch(this, this.removeBookmarkGraphicsFromTerrain));

                //remove the bing maps key that is preloaded with cesium
                BingMapsApi.defaultKey = "";

                this.setupClock();
                this.setupGlobe();
                this.setupSun();
                this.setupMoon();
                this.setupPinBuilder();
                this.setupCameraListener();
                this.customEntities = new EntityCollection();
                // 3D InfoWindow. ESRI lookalike
                this.infoWindow = new InfoWindow();
                this.infoWindow.placeAt("InfoWindow");
                // 3D Flyover Control
                this.flyoverInfo = new FlyoverModal(this.clock);
                this.flyoverInfo.placeAt("TourInfo");
                this.flyoverInfo.startup();
                // Custom Entity Context Menu
                this.contextMenu = new ContextMenu();
                this.contextMenu.placeAt("ContextMenu");
                this.contextMenu.startup();
                this.path = null;
                this.tourOn = false;

                if(this.detectedFeatures.mobileDevice) {
                    this.minimize3DContainerBtn = domConstruct.destroy(this.minimize3DContainerBtn);
                    this.cesiumExpandContainer = domConstruct.destroy(this.cesiumExpandContainer);
                } else {
                    topic.subscribe(MapEvent.prototype.TOGGLE_GAME_CONTROLS, lang.hitch(this, this.toggleControls));
                    topic.subscribe(MapEvent.prototype.MINIMAP_CLICKED, lang.hitch(this, this.minimize3DContainer));
                    topic.subscribe(MapEvent.prototype.MAP_MOVED, lang.hitch(this, this.updateViewPosition));

                    on(this.cesiumExpandContainer, "click", lang.hitch(this, this.maximize3DContainer));
                    on(this.minimize3DContainerBtn, "click", lang.hitch(this, this.minimize3DContainer));
                    on(this.cesiumContainer, mouse.enter, lang.hitch(this, this.enter3DContainer));
                    on(this.cesiumContainer, mouse.leave, lang.hitch(this, this.leave3DContainer));
                }

                this.setupGlobalMouseEvents();

                //this.setupNomenclature();

                this.changeBasemap({
                    "productLabel": this.basemapsInstance.centerLayerList[0].productLabel,
                    "projection": this.config.projection.EQUIRECT,
                    "type": "basemap"
                });

                this.addTerrainProvider();
                domStyle.set(this.cesiumWidget.timeline.container, "visibility", "hidden");

                //Create id for timeline container so that the help function can find it
                domAttr.set(this.cesiumWidget.timeline.container.childNodes[0].childNodes[0], "id", "timelineContainer");

                var self = this;
                this.cesiumWidget.scene.camera.moveEnd.addEventListener(function () {
                    self.updateSearchMapExtent();
                }, this);

                console.log('globe initialized');
                topic.publish(MapEvent.prototype.GLOBE_INITIALIZED, {eType: MapEvent.prototype.GLOBE_INITIALIZED});
            },

            setupClock: function() {
                this.clock = new Clock({
                    startTime : JulianDate.fromIso8601("2014-09-24T04:38Z"),
                    currentTime : JulianDate.fromIso8601("2014-09-24T04:38Z"),
                    stopTime : JulianDate.fromIso8601("2014-09-25T08:38Z"),
                    clockRange : ClockRange.CLAMPED,
                    clockStep : 1
                });
            },
            setupCameraListener: function() {
                var me = this;
                this.cesiumWidget.scene.camera.moveEnd.addEventListener(lang.hitch(this, function(camera) {
                    var point = me.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(me.cesiumWidget.scene.camera.position);

                    //workaround for some part of path hidden under the ground

                    var pLon = CesiumMath.toDegrees(point.longitude);
                    var pLat = CesiumMath.toDegrees(point.latitude);

                    if ((pLon > -30.471 && pLon < 0 && pLat > 0 && pLat < 32.52) ||
                        (pLon > 0 && pLon < 16.0 && pLat > -4.31 && pLat < 4)) {
                        //this is where martian data is
                        if (point.height > 80000.0)
                            me.cesiumWidget.scene.globe.depthTestAgainstTerrain = false;
                        else
                            me.cesiumWidget.scene.globe.depthTestAgainstTerrain = true;

                    } else {
                        if (point.height > 8000.0)
                            me.cesiumWidget.scene.globe.depthTestAgainstTerrain = false;
                        else
                            me.cesiumWidget.scene.globe.depthTestAgainstTerrain = true;
                    }

                }));
            },
            setupGlobe: function() {
                this.cesiumWidget = new Viewer('cesiumContainer', {
                    timeline: true,
                    selectionIndicator: false,
                    animation: false,
                    sceneModePicker: false,
                    homeButton: false,
                    infoBox: false,
                    navigationHelpButton: false,
                    navigationInstructionsInitiallyVisible: false,
                    geocoder: false,
                    fullscreenButton: false,
                    baseLayerPicker: false,
                    clock: this.clock,
                    shouldAnimate: false,
                    contextOptions: {
                        alpha: true
                    }
                    // ,
                    // scene3DOnly: true,


                    //initialize an empty layer so Cesium doesn't load bing maps
                    //imageryProvider: new WebMapServiceImageryProvider({url: "", layers: 0})
                });
                this.controller.cesiumWidget = this.cesiumWidget;

                //this.cesiumWidget.scene.screenSpaceCameraController.enableZoom = false;
                //
                //var viewer = this.cesiumWidget;
                //this.cesiumWidget.screenSpaceEventHandler.setInputAction(function(amount){
                //    amount = CesiumMath.sign(amount) * viewer.scene.camera.positionCartographic.height / Math.log(viewer.scene.camera.positionCartographic.height);
                //    var h = viewer.scene.camera.positionCartographic.height;
                //    console.log("zoom = " + h);
                //    viewer.scene.camera.zoomIn(amount);
                //}, Cesium.ScreenSpaceEventType.WHEEL);
                //
                //var rightDragging = false;
                //this.cesiumWidget.screenSpaceEventHandler.setInputAction(function(){
                //    rightDragging = true;
                //}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
                //
                //this.cesiumWidget.screenSpaceEventHandler.setInputAction(function(){
                //    rightDragging = false;
                //}, Cesium.ScreenSpaceEventType.RIGHT_UP);
                //
                //this.cesiumWidget.screenSpaceEventHandler.setInputAction(function(movement){
                //    if(rightDragging) {
                //        var zn = (viewer.scene.camera.positionCartographic.height * (movement.endPosition.y - movement.startPosition.y)) / (Math.log(viewer.scene.camera.positionCartographic.height) * 4);
                //        console.log("move = " + zn);
                //        if (zn > 0.0)
                //            viewer.scene.camera.zoomIn(zn);
                //    }
                //}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                this.cesiumWidget.scene.globe.depthTestAgainstTerrain = false;
                this.cesiumWidget.timeline.removeExtraHandlers();
                // Add camera event handler for every time the view is changed
                //this.cesiumWidget.camera.moveEnd.addEventListener(lang.hitch(this, this.updateEntityHeights));
                //this.cesiumWidget.camera.moveStart.addEventListener(lang.hitch(this, this.updateEntityHeights));

                //change the maximum distance we can move from the globe
                this.cesiumWidget.scene.screenSpaceCameraController.maximumZoomDistance = this.MAX_ZOOM_DISTANCE;

                this.cesiumWidget.scene.fog.enabled = this.config.data.enableFog;
                if (this.config.data.skyAtmosphere == false)
                    //remove the atmosphere
                    this.cesiumWidget.scene.skyAtmosphere = undefined;

                //set the layer collection
                this.layers = this.cesiumWidget.scene.globe.imageryLayers;
                //remove all preloaded earth layers
                this.layers.removeAll();

            },

            setupPinBuilder: function() {
                this.pinBuilder = new PinBuilder();
                this.pins = new EntityCollection();
                this.selectedEntity = null;
                this.hoverEntity = null;
                this.HOVER_PIN = this.pinBuilder.fromColor(Color.YELLOW, 30).toDataURL();
                this.NONHOVER_PIN = this.pinBuilder.fromColor(Color.ORANGE, 30).toDataURL();
                this.SELECTED_PIN = this.pinBuilder.fromColor(Color.RED, 30).toDataURL();
                this.ROVER_PIN = this.pinBuilder.fromMakiIconId('car', Color.ORANGE, 48);
                this.SUN_PIN = this.pinBuilder.fromMakiIconId('circle-stroked', Color.YELLOW, 35);
            },

            clearSelectedEntity: function () {
                if (this.selectedEntity)
                    this.set3DPoint(this.selectedEntity, this.normal3DPoint);
                this.selectedEntity = null;
            },

            setupGlobalMouseEvents: function() {
                var handler = new ScreenSpaceEventHandler(this.cesiumWidget.scene.canvas);
                handler.setInputAction(lang.hitch(this, function(movement) {
                    if(this.visible) {
                        if(!this.detectedFeatures.mobileDevice) {
                            this.showMouseCoordinates(movement);
                            // Reset the selection of the pin
                            $("html, body").css("cursor", "default");
                            if (this.hoverEntity) {
                                if (this.hoverEntity === this.selectedEntity)
                                    this.set3DPoint(this.hoverEntity, this.selected3DPoint);
                                else
                                    this.set3DPoint(this.hoverEntity, this.normal3DPoint);
                                this.hoverEntity = null;
                            }

                            var pickedObject = this.cesiumWidget.scene.pick(movement.endPosition);
                            // Check to see if an object has been picked and if it's a pin
                            if (pickedObject) {
                                if (this.pins.contains(pickedObject.id)) {
                                    // Check to see if any updating even needs to occur
                                    if (this.hoverEntity === pickedObject.id){
                                        return;
                                    }
                                    // pickedObject.id is an Entity object
                                    this.hoverEntity = this.pins.getById(pickedObject.id.id);
                                    this.set3DPoint(this.hoverEntity, this.hover3DPoint);
                                    //this.hoverEntity.billboard.image = this.HOVER_PIN;

                                    $("html, body").css("cursor", "pointer");
                                }
                                else if (pickedObject && this.customEntities.contains(pickedObject.id))
                                    $("html, body").css("cursor", "pointer");
                            }
                        }
                    }
                }), ScreenSpaceEventType.MOUSE_MOVE);

                handler.setInputAction(lang.hitch(this, function(click) {
                    // Determine if a waypoint pin has been highlighted. If so then select it
                    if (this.hoverEntity !== null){
                        this.infoWindow.userSelected = true;
                        this.infoWindow.newWindow(this.hoverEntity.name, this.hoverEntity.description.getValue());
                        if(name !== this.hoverEntity.id){
                            this.infoWindow.contentNode.scrollTop = 0;
                            this.previousName = this.hoverEntity.id;
                        }

                        if (this.selectedEntity !== null)
                            this.set3DPoint(this.selectedEntity,this.normal3DPoint);

                        this.selectedEntity = this.hoverEntity;
                        this.hoverEntity = null;
                        this.set3DPoint(this.selectedEntity, this.selected3DPoint);
                    }

                    /* Check to see if any entities lie beneath the mouse cursor. If it is a valid entity
                     * that is contained in customEntities, then display a context menu that is synchronized with
                     * ToolsGallery. Most of the calculations will just be reused.*/
                    this.pickedObject = this.cesiumWidget.scene.pick(click.position);
                    if (this.pickedObject) {
                        if (this.customEntities.contains(this.pickedObject.id)) {
                            if (this.contextMenu.removeCameraChange)
                                this.contextMenu.removeCameraChange();
                            if (this.pickedObject.id.type === "point") {
                                // Context menu follows a single point at the end of camera movement.
                                var cart2 = SceneTransforms.wgs84ToWindowCoordinates(this.cesiumWidget.scene, this.pickedObject.id.position.getValue(this.clock.currentTime));
                                this.contextMenu.removeCameraChange = this.cesiumWidget.camera.moveEnd.addEventListener(lang.hitch(this, function() {
                                    var cart2 = SceneTransforms.wgs84ToWindowCoordinates(this.cesiumWidget.scene, this.pickedObject.id.position.getValue(this.clock.currentTime));
                                    this.contextMenu.updateLocation(cart2);
                                }));
                                this.contextMenu.show(this.pickedObject.id, cart2);
                            }
                            else {
                                // Close the context menu if the camera is moved.
                                // It is hard to determine where the line has moved to.
                                this.mouseCart3 = this.cesiumWidget.scene.camera.pickEllipsoid(click.position, this.cesiumWidget.scene.globe.ellipsoid);
                                this.contextMenu.removeCameraChange = this.cesiumWidget.camera.moveStart.addEventListener(lang.hitch(this, function() {
                                    this.contextMenu.close();
                                    this.contextMenu.removeCameraChange();
                                }));
                                this.contextMenu.show(this.pickedObject.id, click.position);
                            }
                        }
                    }
                    else if (this.contextMenu.removeCameraChange) {
                        this.contextMenu.close();
                    }
                }), ScreenSpaceEventType.LEFT_CLICK);

                this.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            },

            updateEntityHeights: function(){
                for (var i=0; i < this.cesiumWidget.entities.values.length; i++) {
                    var id = this.cesiumWidget.entities.values[i].id,
                        entity = this.cesiumWidget.entities.getById(id);

                    if (entity.position && entity.productLabel) {
                        var cartesian = entity.position.getValue(this.clock.currentTime),
                            cartographic = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(cartesian),
                            height = this.cesiumWidget.scene.globe.getHeight(cartographic);

                        entity.position = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
                    }
                    else if (entity.polyline) {
                        var positions = entity.polyline.positions.getValue(this.clock.currentTime);
                        var updatedPositions = [];
                        for (var j=0; j < positions.length; j++) {
                            var cartesian = positions[j],
                                cartographic = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(cartesian),
                                height = this.cesiumWidget.scene.globe.getHeight(cartographic);

                            updatedPositions.push(Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height));
                        }
                        entity.polyline.positions = updatedPositions;
                    }
                    else if (entity.rectangle) {
                        var west = entity.rectangle._coordinates._value.west,
                            north = entity.rectangle._coordinates._value.north,
                            east = entity.rectangle._coordinates._value.east,
                            south = entity.rectangle._coordinates._value.south,
                            heights = [
                                this.cesiumWidget.scene.globe.getHeight(new Cartographic(west, north)),
                                this.cesiumWidget.scene.globe.getHeight(new Cartographic(west, south)),
                                this.cesiumWidget.scene.globe.getHeight(new Cartographic(east, north)),
                                this.cesiumWidget.scene.globe.getHeight(new Cartographic(east, south))
                            ],
                            height = Math.max(heights[0], heights[1], heights[2], heights[3]);

                        entity.height = height;
                    }
                    else if (entity.id === "rover-entity") {
                        // Find polyline with the position values
                        var polylineEntity = this.cesiumWidget.entities.getById(entity.currentTour + "-polyline");
                        var newTimePosition = new SampledPositionProperty();
                        newTimePosition.addSamples(polylineEntity.timeArray, polylineEntity.polyline.positions.getValue());

                        entity.position = newTimePosition;
                    }
                }
            },

            showMouseCoordinates: function(movement) {
                var pickRay = this.cesiumWidget.scene.camera.getPickRay(movement.endPosition);
                var cartesian = this.cesiumWidget.scene.globe.pick(pickRay, this.cesiumWidget.scene);

                if (cartesian) {
                    var cartographic = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
                    topic.publish(MapEvent.prototype.MOUSE_COORDINATE_CHANGE, {
                        "x": CesiumMath.toDegrees(cartographic.longitude),
                        "y": CesiumMath.toDegrees(cartographic.latitude)
                    });
                } else {
                    topic.publish(MapEvent.prototype.MOUSE_COORDINATE_CHANGE, {
                        "x": "-",
                        "y": "-"
                    });
                }
            },

            updateSearchMapExtent: function(){
                if(this.visible && !this.detectedFeatures.mobileDevice) {

                    var margin = 100;
                    var leftTop = this.findCoordinate(new Cartesian2(0+margin, 0+margin), new Cartesian2(this.cesiumWidget.scene.canvas.width-margin, this.cesiumWidget.scene.canvas.height-margin));
                    if (leftTop) {
                        var con = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(leftTop);
                        leftTop = {"x": CesiumMath.toDegrees(con.longitude), "y": CesiumMath.toDegrees(con.latitude)};
                    }
                    var rightTop = this.findCoordinate(new Cartesian2(this.cesiumWidget.scene.canvas.width-margin, 0+margin), new Cartesian2(0, this.cesiumWidget.scene.canvas.height-margin));
                    if (rightTop) {
                        var con = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(rightTop);
                        rightTop = {"x": CesiumMath.toDegrees(con.longitude), "y": CesiumMath.toDegrees(con.latitude)};
                    }
                    var leftDown = this.findCoordinate(new Cartesian2(0+margin, this.cesiumWidget.scene.canvas.height-margin), new Cartesian2(this.cesiumWidget.scene.canvas.width-margin, 0+margin));
                    if (leftDown) {
                        var con = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(leftDown);
                        leftDown = {"x": CesiumMath.toDegrees(con.longitude), "y": CesiumMath.toDegrees(con.latitude)};
                    }
                    var rightDown = this.findCoordinate(new Cartesian2(this.cesiumWidget.scene.canvas.width-margin, this.cesiumWidget.scene.canvas.height-margin), new Cartesian2(0+margin, 0+margin));
                    if (rightDown) {
                        var con = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(rightDown);
                        rightDown = {"x": CesiumMath.toDegrees(con.longitude), "y": CesiumMath.toDegrees(con.latitude)};
                    }

                    if (leftTop && rightTop && leftDown && rightDown) {
                        var minLeft = Number.POSITIVE_INFINITY;
                        var minDown = Number.POSITIVE_INFINITY;
                        var maxRight = Number.NEGATIVE_INFINITY;
                        var maxTop = Number.NEGATIVE_INFINITY;

                        if (leftTop.x < minLeft) {
                            minLeft = leftTop.x;
                        }
                        if (leftTop.x > maxRight) {
                            maxRight = leftTop.x;
                        }
                        if (leftTop.y < minDown) {
                            minDown = leftTop.y;
                        }
                        if (leftTop.y > maxTop) {
                            maxTop = leftTop.y;
                        }

                        if (rightTop.x < minLeft) {
                            minLeft = rightTop.x;
                        }
                        if (rightTop.x > maxRight) {
                            maxRight = rightTop.x;
                        }
                        if (rightTop.y < minDown) {
                            minDown = rightTop.y;
                        }
                        if (rightTop.y > maxTop) {
                            maxTop = rightTop.y;
                        }

                        if (leftDown.x < minLeft) {
                            minLeft = leftDown.x;
                        }
                        if (leftDown.x > maxRight) {
                            maxRight = leftDown.x;
                        }
                        if (leftDown.y < minDown) {
                            minDown = leftDown.y;
                        }
                        if (leftDown.y > maxTop) {
                            maxTop = leftDown.y;
                        }

                        if (rightDown.x < minLeft) {
                            minLeft = rightDown.x;
                        }
                        if (rightDown.x > maxRight) {
                            maxRight = rightDown.x;
                        }
                        if (rightDown.y < minDown) {
                            minDown = rightDown.y;
                        }
                        if (rightDown.y > maxTop) {
                            maxTop = rightDown.y;
                        }

                        if (minLeft <= maxRight && minDown <= maxTop) {
                            topic.publish(MapEvent.prototype.SET_EXTENT, {
                                "extent": {
                                    "xmin": minLeft,
                                    "ymin": minDown,
                                    "xmax": maxRight,
                                    "ymax": maxTop
                                },
                                "shape": {
                                    "leftTop": leftTop,
                                    "leftDown": leftDown,
                                    "rightTop": rightTop,
                                    "rightDown": rightDown
                                },

                                "map": null
                            });

                            var evt = {
                                "extent": {
                                    "xmin": minLeft,
                                    "ymin": minDown,
                                    "xmax": maxRight,
                                    "ymax": maxTop
                                },
                                "shape": {
                                    "leftTop": leftTop,
                                    "leftDown": leftDown,
                                    "rightTop": rightTop,
                                    "rightDown": rightDown
                                },
                                "map": null
                            };

                            //TEST LABEL ON 3D:
                            /*
                            var shapeString;
                            var polygonArray;

                            //TODO - need to handle query that contains lat 90 or lat -90
                            //for now, workaround is provided.  even this workaround doesn't give good result
                            if (evt.extent.ymin === -90 || evt.extent.ymax === 90.0)
                                evt.shape = undefined;

                            if (evt.shape) {
                                shapeString = "POLYGON((" + evt.shape.leftTop.x + " " + evt.shape.leftTop.y + "," + +evt.shape.rightTop.x + " " + evt.shape.rightTop.y + "," + +evt.shape.rightDown.x + " " + evt.shape.rightDown.y + "," + +evt.shape.leftDown.x + " " + evt.shape.leftDown.y + "," + +evt.shape.leftTop.x + " " + evt.shape.leftTop.y + "))";

                            } else {
                                var explorerExtent = {
                                    xmin:evt.extent.xmin,
                                    ymin:evt.extent.ymin,
                                    xmax:evt.extent.xmax,
                                    ymax:evt.extent.ymax
                                };

                                var mapExtent = this.currentMapMaxExtent;

                                if(explorerExtent.xmin < mapExtent.xmin){
                                    explorerExtent.xmin = mapExtent.xmin;
                                }
                                if(explorerExtent.xmax > mapExtent.xmax){
                                    explorerExtent.xmax = mapExtent.xmax;
                                }
                                if(evt.extent.ymin < mapExtent.ymin){
                                    explorerExtent.ymin = mapExtent.ymin;
                                }
                                if(evt.extent.ymax > mapExtent.ymax){
                                    explorerExtent.ymax = mapExtent.ymax;
                                }

                                shapeString = "POLYGON((" + explorerExtent.xmin + " " + explorerExtent.ymin + "," + explorerExtent.xmax + " " + explorerExtent.ymin + "," +
                                    explorerExtent.xmax + " " + explorerExtent.ymax + "," + explorerExtent.xmin + " " + explorerExtent.ymax + "," +
                                    explorerExtent.xmin + " " + explorerExtent.ymin + "))";
                                // polygonArray = [explorerExtent.xmin, explorerExtent.ymin, explorerExtent.xmax, explorerExtent.ymin,
                                //     explorerExtent.xmax, explorerExtent.ymax, explorerExtent.xmin, explorerExtent.ymax];
                            }

                            var searchUrl = this.indexerUtil.createGetSearchItemsUrl({
                                "projection": this.config.projection.EQUIRECT,
                                "shape": shapeString,
                                "facetKeys": "itemType",
                                "facetValues": "nomenclature",
                                "start": 0,
                                "rows": 30
                            });
                            var self = this;

                            xhr(searchUrl, {
                                handleAs: "json",
                                headers: {
                                    "X-Requested-With": null
                                }
                            }).then(function (data) {
                                //console.log("data", data);
                                if(data !== null) {
                                    var docs = data.response.docs;

                                    if(docs.length > 0) {
                                       var nomenclatureList = [];
                                       for(var i = 0; i < docs.length; i++){
                                           if(docs[i].itemType = "nomenclature" &&
                                                   docs[i].shape.startsWith("POINT")){
                                               nomenclatureList.push(docs[i]);
                                           }
                                       }

                                       //Remove previous labels
                                        for(var i = 0; i < self.nomenclatureLabelEntities.length; i++){
                                            self.cesiumWidget.entities.remove(self.nomenclatureLabelEntities[i]);
                                        }
                                        self.nomenclatureLabelEntities = [];

                                       //Show new labels
                                        for(var i = 0; i < nomenclatureList.length; i++){
                                            var componentWrap = self.wktUtil.convertWktToComponents(nomenclatureList[i].shape);
                                            var geometry = self.wktUtil.convertComponentWrapToGeometry(componentWrap);
                                            geometry.spatialReference.wkid = self.config.data.extents.equirect.wkid;

                                            var entity = self.cesiumWidget.entities.add({
                                                position : Cartesian3.fromDegrees(geometry.x, geometry.y),
                                                label : {
                                                    text : nomenclatureList[i].title,
                                                    //font : '16px Helvetica Neue",Helvetica,Arial,sans-serif',
                                                    font: '14px Roboto, sans-serif',
                                                    fillColor : Color.WHITE,
                                                    outlineColor : Color.BLACK,
                                                    outlineWidth : 2,
                                                    style : LabelStyle.FILL_AND_OUTLINE
                                                }
                                            });
                                            self.nomenclatureLabelEntities.push(entity);

                                        }

                                    }
                                }else{

                                }

                            }, function (err) {
                                console.log("error retrieving explorer search results:" + err);
                            });
                            */
                            //END TEST LABELS ON 3D
                        }
                    }
                }

            },

            findCoordinate: function(startCoordinates, endCoordinates){
                var pickRay = this.cesiumWidget.scene.camera.getPickRay(startCoordinates);
                //var coordinate = this.cesiumWidget.scene.globe.pick(pickRay, this.cesiumWidget.scene);

                // Translate coordinates
                var x1 = startCoordinates.x;
                var y1 = startCoordinates.y;
                var x2 = endCoordinates.x;
                var y2 = endCoordinates.y;
                // Define differences and error check
                var dx = Math.abs(x2 - x1);
                var dy = Math.abs(y2 - y1);
                var sx = (x1 < x2) ? 1 : -1;
                var sy = (y1 < y2) ? 1 : -1;
                var err = dx - dy;

                var pickRay = this.cesiumWidget.scene.camera.getPickRay({x:x1,y:y1});
                var coordinate = this.cesiumWidget.scene.globe.pick(pickRay, this.cesiumWidget.scene);
                if(coordinate) {
                    return coordinate;
                }

                // Main loop
                while (!((x1 == x2) && (y1 == y2))) {
                    var e2 = err << 1;
                    if (e2 > -dy) {
                        err -= dy;
                        x1 += sx;
                    }
                    if (e2 < dx) {
                        err += dx;
                        y1 += sy;
                    }

                    var pickRay = this.cesiumWidget.scene.camera.getPickRay({x:x1,y:y1});
                    var coordinate = this.cesiumWidget.scene.globe.pick(pickRay, this.cesiumWidget.scene);
                    if(coordinate) {
                        return coordinate;
                    }
                }

            },


            setMinimapCenterCoordinates: function() {
                if(this.visible && !this.detectedFeatures.mobileDevice && this.activeControl === "mouse") {
                    //dont do this for mobile due to the performance issues
                    //for mobile we do this when user changes to 3d
                    //globe center point to reposition 2d map
                    var windowPosition = new Cartesian2(this.cesiumWidget.container.clientWidth / 2, this.cesiumWidget.container.clientHeight / 2);
                    var pickRay = this.cesiumWidget.scene.camera.getPickRay(windowPosition);
                    var pickPosition = this.cesiumWidget.scene.globe.pick(pickRay, this.cesiumWidget.scene);

                    if (pickPosition) {
                        var pickPositionCartographic = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);

                        if (pickPositionCartographic.longitude >= -90 && pickPositionCartographic.longitude <= 90 &&
                            pickPositionCartographic.latitude >= -180 && pickPositionCartographic.latitude <= 180) {

                            this.currentCenterPt.x = CesiumMath.toDegrees(pickPositionCartographic.longitude);
                            this.currentCenterPt.y = CesiumMath.toDegrees(pickPositionCartographic.latitude);

                            if (this.currentCenterPt) {
                                topic.publish(MapEvent.prototype.CENTER_MAP_AT, {
                                    "x": this.currentCenterPt.x,
                                    "y": this.currentCenterPt.y
                                });
                            }
                        }
                    }
                    this.setMapExtent();
                }
            },

            setMapExtent: function() {
                var c2 = new Cartesian2(0, 0);
                var leftTop = this.cesiumWidget.scene.camera.pickEllipsoid(c2, this.cesiumWidget.scene.globe.ellipsoid);
                c2 = new Cartesian2(this.cesiumWidget.scene.canvas.width, this.cesiumWidget.scene.canvas.height);
                var rightDown = this.cesiumWidget.scene.camera.pickEllipsoid(c2, this.cesiumWidget.scene.globe.ellipsoid);

                if (leftTop != null && rightDown != null) { //ignore jslint
                    leftTop = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(leftTop);
                    rightDown = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(rightDown);
                    var ext =  new Rectangle(CesiumMath.toDegrees(leftTop.longitude), CesiumMath.toDegrees(rightDown.latitude), CesiumMath.toDegrees(rightDown.longitude), CesiumMath.toDegrees(leftTop.latitude));

                    topic.publish(MapEvent.prototype.SET_EXTENT, {
                        "extent": {
                            "xmin": ext.west,
                            "ymin": ext.south,
                            "xmax": ext.east,
                            "ymax": ext.north
                        },
                        "map": null
                    });
                    this.minimapIsGlobal = false;
                } else {
                    if(!this.minimapIsGlobal) {
                        topic.publish(MapEvent.prototype.SET_EXTENT, {
                            "extent": {
                                "xmin": -180,
                                "ymin": -90,
                                "xmax": 180,
                                "ymax": 90
                            },
                            "map": null
                        });
                        this.minimapIsGlobal = true;
                    }
                }
            },

            setupSun: function() {
                //create the sun and add parameters
                this.cesiumWidget.scene.sun = undefined;
                //this.cesiumWidget.scene.sun.glowFactor = 0.6;
                //this.cesiumWidget.scene.sun.show = true;
            },

            setupMoon: function() {
                //no moon support yet
                this.cesiumWidget.scene.moon = undefined;
            },

            addInvisibleLayer: function(layer) {
                var addedLayer = this.layers.addImageryProvider(
                    new SingleTileImageryProvider(
                        {
                            url : 'jpl/assets/images/1x1.png',
                            rectangle : Rectangle.fromDegrees(0, 0, 1, 1)
                        }
                    )
                );

                this.addedLayers.push({
                    "layer": layer,
                    "layerCollectionIndex": this.layers.indexOf(addedLayer)
                });
            },

            setupNomenclature: function() {
                /*
                 this.nomlabels = this.cesiumWidget.scene.primitives.add(new LabelCollection());
                 var dataSource = new GeoJsonDataSource();

                 dataSource.loadUrl('./jpl/data/vesta_nomenclature.geojson', { markerSize: 1})
                    .then(lang.hitch(this, function() {
                         var entities = dataSource.entities.entities;
                         for (var i = 0; i < entities.length; i++) {
                             var entity = entities[i];
                             this.cesiumWidget.entities.add({
                                 position : entity.position._value,
                                 label : {
                                     text: entity.properties.name,
                                     font: "font-family: 'Roboto', sans-serif",
                                     scale: 1.2
                                     //show: true
                                     //translucencyByDistance: new NearFarScalar(4.0e6, 1.0, 7.0e6, 0.0)
                                 }
                             });
                         }
                    }), function(err) {
                        console.log(err); // Error: "It broke"
                    });
                    */
            },

            maximize3DContainer: function() {
                this.visible = true;
                topic.publish(MapEvent.prototype.TERRAIN_VIEW, null);

                domClass.replace("cesiumContainer", "cesium-container-large", "cesium-container-small" );
                //domClass.remove(this.cesiumContainer, "cesium-container-small");
                //domClass.add(this.cesiumContainer, "cesium-container-large");


                if(!this.detectedFeatures.mobileDevice) {
                    domStyle.set(this.minimize3DContainerBtn, "display", "block");
                    domClass.add(this.cesiumExpandContainer, "containerHidden");

                    //domClass.add("overviewBtn", "hidden");

                    //domClass.add("overviewBtnIcon", "icon-earth158");
                    //domClass.remove("overviewBtnIcon", "icon-earth74");

                    domClass.remove("gameControlsContainer", "hidden");
                }

                //domClass.remove("view2DContainer", "hidden");
                //domClass.add("view3DContainer", "hidden");

                if(this.detectedFeatures.mobileDevice && this.currentCenterPt) {
                    //mobile only to set globe to current map position
                    window.setTimeout(lang.hitch(this, function () {
                        this.flyToCenter(this.currentCenterPt.x, this.currentCenterPt.y, this.MAX_ZOOM_DISTANCE);
                    }), 100);
                }

                //this.minimapInterval = setInterval(lang.hitch(this, this.setMinimapCenterCoordinates), 5000);

                domClass.add("mapScalebarsContainer", "hidden");
            },

            minimize3DContainer: function() {
                this.setMinimapCenterCoordinates();
                this.visible = false;

                topic.publish(MapEvent.prototype.MAP_VIEW, null);
                //topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {"projection": this.config.projection.EQUIRECT});
                domClass.replace("cesiumContainer", "cesium-container-small", "cesium-container-large" );

                domClass.remove(this.cesiumContainer, "cesium-container-large");

                if(!this.detectedFeatures.mobileDevice) {
                    domClass.remove(this.cesiumExpandContainer, "containerHidden");
                    //domClass.remove("overviewBtn", "hidden");
                    domClass.remove("3dContainer", "hidden");
                    domStyle.set("3dContainer", "opacity", "0");
                    domStyle.set("3dContainer", "visibility", "hidden");
                    //domClass.remove("overviewBtn", "hidden");

                    //domClass.remove("overviewBtnIcon", "icon-earth158");
                    //domClass.add("overviewBtnIcon", "icon-earth74");

                    domClass.add("gameControlsContainer", "hidden");
                    //domClass.remove("view3DContainer", "hidden");
                    domStyle.set(this.minimize3DContainerBtn, "display", "none");
                }

                //domClass.add(this.cesiumContainer, "cesium-container-small");
                //domClass.remove("view3DContainer", "hidden");
                //domClass.add("view2DContainer", "hidden");

                if(this.detectedFeatures.mobileDevice && this.currentCenterPt) {
                    //dont do this for mobile due to the performance issues
                    //for mobile we do this when user changes to 3d
                    topic.publish(MapEvent.prototype.CENTER_MAP_AT, {
                        "x": this.currentCenterPt.x,
                        "y": this.currentCenterPt.y
                    });
                }

                clearInterval(this.minimapInterval);
                this.flyToCenter(this.currentCenterPt.x, this.currentCenterPt.y, this.MAX_ZOOM_DISTANCE);

                domClass.remove("mapScalebarsContainer", "hidden");
            },

            enter3DContainer: function(evt) {
                this.containerHasFocus = true;
                //document.getElementById("layerSearchInput").blur();
                //console.log("enter 3D container");
            },

            leave3DContainer: function(evt) {
                this.containerHasFocus = false;
                this.controller.resetAxis();
                //console.log("leave 3D container");
            },

            showLabels: function() {
                var labels = this.cesiumWidget.scene.primitives._primitives[0]._labels;

                for(var i=0; i < labels.length; i++) {
                    labels[i].show = true;
                }

            },

            hideLabels: function() {
                var labels = this.cesiumWidget.scene.primitives._primitives[0]._labels;

                for(var i=0; i < labels.length; i++) {
                    labels[i].show = false;
                }
            },

            view2DEnabled: function(evt) {
                this.visible = false;
            },

            view3DEnabled: function(evt) {
                this.visible = true;
                /*lang.hitch(this, this.flyToExtent({
                    xmin: this.currentExtent.xmin,
                    xmax: this.currentExtent.xmax,
                    ymin: this.currentExtent.ymin,
                    ymax: this.currentExtent.ymax
                }));*/

                //topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {"projection": this.config.projection.EQUIRECT});

            },

            projectionChanged: function(evt) {
                if(evt.projection === this.config.projection.GLOBE_3D) {
                    //this.visible = true;
                    //lang.hitch(this, this.flyToExtent);
                    //window.setTimeout(lang.hitch(this, this.flyToExtent), 3000);
                    //window.setTimeout(function(){console.log('hit!')}, 3000);
                    //this.cesiumWidget.scene.morphTo3D(1);
                } else {
                    //this.visible = false;
                    //this.cesiumWidget.scene.morphTo2D(1);
                }
            },

            changeBasemap: function(evt) {
                if(this.layers && evt.projection === this.config.projection.EQUIRECT ) {
                    //get and remove the first(base) layer
                    this.removeLayer(this.layers.get(0));
                    //remove the first(base) layer from the addedLayers array
                    this.addedLayers.pop(0);

                    this.addLayer(evt, true);
                }
            },

            changeLayerOpacity: function(evt) {
                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === evt.layer.productLabel) {
                        this.layers.get(this.addedLayers[i].layerCollectionIndex).alpha = evt.opacity;
                    }
                }
            },

            addActiveLayer: function (evt, isBasemap ) {
                if(evt.layer.layerProjection === this.config.projection.EQUIRECT) {

                    var layer = evt.layer;
                    for (var i = 0; i < layer.services.length; i++) {
                        if (layer.services[i].protocol === "WMTS") {
                            this.addWMTSLayer(layer, layer.services[i], isBasemap);
                            break;
                        }
                        else if (layer.services[i].serviceType === "PathElevation") {
                            this.addPathElevationLayer(layer, layer.services[i]);
                            break;
                        }
                        else if (layer.services[i].protocol === "ArcGISTiled") {
                            this.addTiledLayer(layer, isBasemap);
                            break;
                        }
                        else if (layer.services[i].protocol === "ArcGISDynamic") {
                            this.addArcGISMapServerImageryLayer(layer.services[i].endPoint, layer);
                            break;
                        }
                        else if (layer.services[i].protocol === "ArcGISFeature" &&
                            layer.services[i].renderer === "waypoints") {
                            this.addWaypoints3D(evt.layer, layer.services[i]);
                            break;
                        }
                    }
                }
            },

            addAutoLayers: function(evt){
                for(var i = evt.layers.length - 1;i >= 0; i--){
                    if(!this.isLayerAleadyAddedToGlobe(evt.layers[i].layer.productLabel)){
                        this.addAutoLayer({"layer":evt.layers[i].layer});
                    }
                }
            },

            addAutoLayer: function(evt){
                if(evt.layer.layerProjection === this.config.projection.EQUIRECT) {
                    var layer = evt.layer;
                    for (var i = 0; i < layer.services.length; i++) {
                        if (layer.services[i].protocol === "WMTS") {
                            this.addWMTSLayer(layer, layer.service, false, true);
                            break;
                        } else if (layer.services[i].protocol === "ArcGISTiled") {
                            this.addTiledLayer(layer, false, true);
                            break;
                        }
                    }
                }
            },

            isLayerAleadyAddedToGlobe: function(productLabel){
                for(var i = 0; i < this.addedLayers.length; i++){
                    if(this.addedLayers[i].layer.productLabel === productLabel){
                        return true;
                    }
                }

                return false;
            },

            removeAutoLayer: function(evt){
                var productLabel = evt.productLabel;
                var removedIndex;

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === productLabel) {
                        removedIndex = this.addedLayers[i].layerCollectionIndex;
                        this.removeLayer(this.layers.get(this.addedLayers[i].layerCollectionIndex));
                        this.addedLayers.splice(i, 1);
                        break;
                    }
                }

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layerCollectionIndex > removedIndex) {
                        //fix any indices above the one we just removed
                        this.addedLayers[i].layerCollectionIndex--;
                    }
                }

            },

            addLayer: function(evt, isBasemap) {
                if(evt.projection === this.config.projection.EQUIRECT) {
                    var newLayer;
                    if (evt.type === "basemap") {
                        newLayer = this.basemapsInstance.getLayerByProductLabel(evt.productLabel, evt.projection, this.config.projection);
                        if (newLayer.service.endPoint !== "") {
                            this.addWMTSLayer(newLayer, newLayer.service, isBasemap);
                        }
                    } else {
                        var layer = this.layersInstance.getLayerByProductLabel(evt.productLabel, evt.projection, this.config.projection);
                        if (layer == null)
                            return;

                        //console.log('3D: ' + layer.productType);
                        if (layer.productType === "Feature") {
                            for (var i = 0; i < layer.services.length; i++) {
                                //workaround to add tiled path to 3D layer only
                                if (layer.services[i].serviceType === "PathElevation") {
                                    this.addPathElevationLayer(layer, layer.services[i]);
                                } else if (layer.services[i].serviceType === "Imagery") {
                                    if (layer.services[i].protocol === "ArcGISDynamic") {
                                        this.addArcGISMapServerImageryLayer(layer.services[i].endPoint, layer);
                                    } else if (layer.services[i].protocol === "WMTS") {
                                        this.addWMTSLayer(layer, layer.services[i], false);
                                        //this.addArcGISTiledMapServerImageryLayer(layer.services[i].endPoint, layer);
                                    }
                                    break;
                                }
                            }
                        } else if (layer.productType === "FeatureWaypoints") {
                            this.addWaypoints3D(layer, layer.service);
                        } else if (layer.productType === "FeatureLabel") {
                            this.addInvisibleLayer(layer);
                        } else
                        if (layer.productType === "FeatureGraticule") {
                            this.addInvisibleLayer(layer);
                        } else if (layer.productType === "region") {
                            this.addInvisibleLayer(layer);
                        } else {
                            for (var i = 0; i < layer.services.length; i++) {
                                if (layer.services[i].protocol === "WMTS") {
                                    this.addWMTSLayer(layer, layer.service, isBasemap);
                                    break;
                                } else if (layer.services[i].protocol === "ArcGISTiled") {
                                    this.addTiledLayer(layer, isBasemap);
                                    break;
                                }
                            }
                        }
                    }
                }

            },


            addTiledLayer: function(layer, isBasemap, isAutoLayer) {
                var options = {
                    url: layer.service.endPoint + '/1.0.0/default/default028mm/',
                    layers: 0,
                    rectangle: this.getLayerRectangle(layer)
                };

                if(!isBasemap) {
                    //for layers, we need to add transparency
                    options.parameters = {
                        transparent: 'true',
                        format: 'image/png'
                    };
                }

                this.addLayerToGlobe(layer, new ArcGisMapServerTileImageryProvider(options), isBasemap, isAutoLayer);
            },

            addPathElevationLayer: function (layer, service) {
                var elevationOffset = service.elevationOffset;
                if (elevationOffset == undefined)
                    elevationOffset = 0;
                else
                    elevationOffset = parseFloat(elevationOffset);
                this.addPolyline(layer.productLabel, service.endPoint, elevationOffset);
            },

            addWMTSLayer: function(layer, service, isBasemap, isAutoLayer) {

                var options = {
                    url: service.endPoint,
                    style : 'default',
                    layer: service.layerId,
                    tileMatrixSetID : 'default028mm'
                    //rectangle: this.getLayerRectangle(layer),
                    //url: layer.service.endPoint + '/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
                    //format : 'image/png'
                    //,tilingScheme: new GeographicTilingScheme()
                };

                //if(isBasemap) {
                //    options.minimumLevel = 0;
                //    options.maximumLevel = 9;
                //}

                this.addLayerToGlobe(layer, new TrekWebMapTileServiceImageryProvider(options), isBasemap, isAutoLayer);
            },

            addWMSLayer: function(layer, isBasemap) {
                var layerProvider, addedLayer,
                options = {
                    url: layer.WMSEndPoint,
                    layers: 0
                };

                if(!isBasemap) {
                    //for layers, we need to add transparency
                    options.parameters = {
                        transparent: 'true',
                        format: 'image/png'
                    };
                }

                this.addLayerToGlobe(layer, new WebMapServiceImageryProvider(options), isBasemap);
            },

            addArcGISMapServerImageryLayer: function(endpoint, layer) {
                var options = {
                    url: endpoint,
                    layer: layer.productLabel + "_3d",
                    layers: 0,
                    transparent: 'true',
                    rectangle: this.getLayerRectangle(layer)
                };

                this.addLayerToGlobe(layer, new ArcGisMapServerImageryProvider(options), false);
            },

            addArcGISTiledMapServerImageryLayer: function(endpoint, layer) {
                var options = {
                    url: endpoint + '/tile/',
                    layers: 0,
                    transparent: 'true'
                };

                this.addLayerToGlobe(layer, new ArcGisMapServerTileImageryProvider(options), false);
            },

            addLayerToGlobe: function(layer, layerProvider, isBasemap, isAutoLayer) {
                var addedLayer;
                if(isAutoLayer){
                    addedLayer = this.layers.addImageryProvider(layerProvider, 1);
                }else {
                    addedLayer = this.layers.addImageryProvider(layerProvider);
                }

                if(isBasemap) {
                    this.layers.lowerToBottom(addedLayer);
                } else {
                    //addedLayer.show = false;
                    //addedLayer.alpha = 0.4;
                }

                if (layer.opacity)
                    addedLayer.alpha = layer.opacity;

                var imageryLayer = {
                    "layer": layer,
                    "layerObject": addedLayer,
                    "layerCollectionIndex": this.layers.indexOf(addedLayer)
                };

                if(isAutoLayer){
                    this.addedLayers.splice(1, 0, imageryLayer);
                    for(var i=0; i<this.addedLayers.length;i++){
                        this.addedLayers[i].layerCollectionIndex = this.addedLayers.indexOf(this.addedLayers[i]);
                    }
                }else {
                    this.addedLayers.push(imageryLayer);
                }

            },

            getLayerRectangle: function(layer) {
                var rectangle = Rectangle.fromDegrees(
                    layer.boundingBox.west,
                    layer.boundingBox.south,
                    layer.boundingBox.east,
                    layer.boundingBox.north
                );

                return rectangle;
            },

            getLayerCollectionIndex: function(productLabel) {
                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === productLabel) {
                        return this.addedLayers[i].layerCollectionIndex;
                    }
                }
            },

            getAndRemoveLayer: function(layerObject) {
                var productLabel = layerObject.productLabel;
                var removedIndex;
                var addedLayerIndex;

                // if (layerObject.layer.productType == "FeatureWaypoints") {
                //
                //     this.removeWaypoints(productLabel);
                //
                //     for (var i = 0; i < this.pins.length; i++) {
                //         if (this.pins[i].label == layerObject.layer.productLabel) {
                //             this.cesiumWidget.entities.remove(this.pins[i].obj);
                //             this.pins.splice(i, 1); // index will be updated
                //             i--;
                //         }
                //     }
                // }

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === productLabel) {
                        removedIndex = this.addedLayers[i].layerCollectionIndex;
                        addedLayerIndex = i;
                        this.removeLayer(this.layers.get(this.addedLayers[i].layerCollectionIndex));
                        break;
                    }
                }
                if(addedLayerIndex){
                    this.addedLayers.splice(addedLayerIndex, 1);
                }
                // if(productLabel.indexOf("_path") >= 0) {
                //     //workaround for now.  both waypoints and path should be a Layer
                //
                //     this.removePolyline(productLabel);
                //     //set to the 3d layer
                //     productLabel = productLabel + "_3d";
                //     //remove the 3d layer
                //     for(var i=0; i < this.addedLayers.length; i++) {
                //         if(this.addedLayers[i].layer.productLabel === productLabel) {
                //             removedIndex = this.addedLayers[i].layerCollectionIndex;
                //             this.removeLayer(this.layers.get(this.addedLayers[i].layerCollectionIndex));
                //             this.addedLayers.splice(i, 1);
                //         }
                //     }
                //
                // }

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layerCollectionIndex > removedIndex) {
                        //fix any indices above the one we just removed
                        this.addedLayers[i].layerCollectionIndex--;
                    }
                }
            },

            getAndShowLayer: function(layerObject) {
                var productLabel = layerObject.layer.productLabel;

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === productLabel) {
                        var layer = this.layers.get(this.addedLayers[i].layerCollectionIndex);
                        if (layer != undefined)
                            layer.show = true;
                        break;
                    }
                }

                if(productLabel.indexOf("_path") >= 0) {
                    this.togglePath3D(productLabel, true);
                    //set to the 3d layer
                    productLabel = productLabel + "_3d";
                    //remove the 3d layer
                    for(var i=0; i < this.addedLayers.length; i++) {
                        if(this.addedLayers[i].layer.productLabel === productLabel) {
                            this.layers.get(this.addedLayers[i].layerCollectionIndex).show = true;
                        }
                    }
                }

                if (layerObject.layer.productType == "FeatureWaypoints")
                    this.toggleWaypoints3D(layerObject, true);
            },

            getAndHideLayer: function(layerObject) {
                var productLabel = layerObject.layer.productLabel;

                for(var i=0; i < this.addedLayers.length; i++) {
                    if(this.addedLayers[i].layer.productLabel === productLabel) {
                        var layer = this.layers.get(this.addedLayers[i].layerCollectionIndex);
                        if (layer != undefined)
                            layer.show = false;
                        break;
                    }
                }

                if(productLabel.indexOf("_path") >= 0) {
                    this.togglePath3D(productLabel, false);
                    //set to the 3d layer
                    productLabel = productLabel + "_3d";
                    //remove the 3d layer
                    for(var i=0; i < this.addedLayers.length; i++) {
                        if(this.addedLayers[i].layer.productLabel === productLabel) {
                            this.layers.get(this.addedLayers[i].layerCollectionIndex).show = false;
                        }
                    }
                }

                if (layerObject.layer.productType == "FeatureWaypoints"){
                    this.toggleWaypoints3D(layerObject, false);
                }

            },

            toggleWaypoints3D: function(waypointLayer, makeVisible){
                // Loop through the contents of pins and make them equal to var. 'visible'
                if (waypointLayer.layer.productType == "FeatureWaypoints") {
                    // Loop through the read-only array
                    for (var i = 0; i < this.pins.values.length; i++) {
                        if (this.pins.values[i].productLabel == waypointLayer.layer.productLabel) {
                            var entity = this.pins.getById(this.pins.values[i].id);
                            if (makeVisible)
                                entity.availability = undefined;
                            else
                                entity.availability = new TimeIntervalCollection();
                        }
                    }
                }
            },

            togglePath3D: function (productLabel, makeVisible) {

                var entity = this.cesiumWidget.entities.getById(productLabel + "-polyline");
                if (entity != undefined) {
                    entity.show = makeVisible;
                    //if (makeVisible)
                    //    entity.show = true; //entity.availability = undefined;
                    //else
                    //    entity.availability = new TimeIntervalCollection();
                }
            },
            findLayerObject: function (productLabel) {
                for(var i=0; i < this.addedLayers.length; i++) {
                    if (this.addedLayers[i].layer.productLabel === productLabel) {
                        return this.addedLayers[i].layerObject;
                    }
                }
                return undefined;
            },
            reorderLayers: function(evt) {
                //add the basemap so the array indexes match, since event does not have basemap
                evt.layerList.splice(0,0,"basemap");

                //loop over newly reordered layer list
                for(var layerListIndex = 0; layerListIndex < evt.layerList.length; layerListIndex++) {
                    var productLabel = evt.layerList[layerListIndex];
                    var layerObj = this.findLayerObject(productLabel);
                    if (layerObj != undefined) {
                        this.layers.raiseToTop(layerObj);
                    }
                }

                for(var i=0; i < this.addedLayers.length; i++) {
                    this.addedLayers[i].layerCollectionIndex = this.layers.indexOf(this.addedLayers[i].layerObject);
                }



                //loop over newly reordered layer list
                //for(var layerListIndex = 0; layerListIndex < evt.layerList.length; layerListIndex++) {
                //    var productLabel = evt.layerList[layerListIndex], layerObj;
                //
                //    //loop over the cesium layers and to find the match based on the product label
                //    for (var cesiumLayersIndex = 0; cesiumLayersIndex < this.layers.length; cesiumLayersIndex++) {
                //        layerObj = this.layers.get(cesiumLayersIndex);
                //
                //        if (layerObj._imageryProvider._url.indexOf(productLabel) > -1
                //            || layerObj._imageryProvider._url === this.config.invisibleImagePath) {
                //            //layer matches our list
                //            //loop over added layers structure and update the collection index for layer
                //            for(var i=0; i < this.addedLayers.length; i++) {
                //                if (this.addedLayers[i].layer.productLabel === productLabel) {
                //                    this.addedLayers[i].layerCollectionIndex = layerListIndex;
                //                    break;
                //                }
                //            }
                //
                //            //move this layer to the top of the list, as the loop progresses the layers will be
                //            //ordered correctly
                //            this.layers.raiseToTop(layerObj);
                //            this.layers.set
                //            break;
                //        }
                //    }
                //}


            },

            removeLayer: function(layer) {
                this.layers.remove(layer, true);
            },

            addTerrainProvider: function(evt) {
                if (this.config.terrainEndpoint != null && this.config.terrainEndpoint != "") {
                    var demProvider = new CesiumTerrainProvider({
                        url: this.config.terrainEndpoint
                    });

                    //return demProvider;
                    this.cesiumWidget.scene.globe.terrainProvider = demProvider;
                }
            },

            updateViewPosition: function(evt) {
                if(evt.extent) {
                    if(evt.projection === this.config.projection.S_POLE) {
                        //get current center pt y and current center pt x then go there;
                        this.currentCenterPt = evt.extent.getCenter();

                        this.currentCenterPt = MapUtil.prototype.convertSouthPolarMetersToDegrees(this.currentCenterPt.x, this.currentCenterPt.y);

                        this.currentExtent.xmin = this.currentCenterPt.x - 10/(evt.zoom + 1);
                        this.currentExtent.xmax = this.currentCenterPt.x + 10/(evt.zoom + 1);
                        this.currentExtent.ymin = this.currentCenterPt.y - 10/(evt.zoom + 1);
                        this.currentExtent.ymax = this.currentCenterPt.y + 10/(evt.zoom + 1);

                    }
                    else if(evt.projection === this.config.projection.N_POLE){
                        this.currentCenterPt = evt.extent.getCenter();

                        this.currentCenterPt = MapUtil.prototype.convertNorthPolarMetersToDegrees(this.currentCenterPt.x, this.currentCenterPt.y);

                        this.currentExtent.xmin = this.currentCenterPt.x - 10/(evt.zoom + 1);
                        this.currentExtent.xmax = this.currentCenterPt.x + 10/(evt.zoom + 1);
                        this.currentExtent.ymin = this.currentCenterPt.y - 10/(evt.zoom + 1);
                        this.currentExtent.ymax = this.currentCenterPt.y + 10/(evt.zoom + 1);
                    }
                    else{
                        this.currentCenterPt = evt.extent.getCenter();
                        this.currentExtent.xmin = evt.extent.xmin;
                        this.currentExtent.xmax = evt.extent.xmax;
                        this.currentExtent.ymin = evt.extent.ymin;
                        this.currentExtent.ymax = evt.extent.ymax;
                    }

                    if(!this.detectedFeatures.mobileDevice && this.currentCenterPt) {
                        //dont do this for mobile due to the performance issues
                        //for mobile we do this when user changes to 3d
                        window.setTimeout(lang.hitch(this, function () {
                            this.flyToCenter(this.currentCenterPt.x, this.currentCenterPt.y, this.MAX_ZOOM_DISTANCE);
                        }), 100);
                    }
                }
            },

            updateCenterPoint: function(evt) {
                this.flySlowlyToCenter(evt.x, evt.y, this.CENTER_DEFAULT_ALTITUDE);
            },

            flyToCenter: function(centerX, centerY, distance) {
                if(distance > this.MAX_ZOOM_DISTANCE) {
                    distance = this.MAX_ZOOM_DISTANCE;
                }

                if(centerX >= -180 && centerX <= 180
                    && centerY >= -90 && centerY <= 90) {
                    this.cesiumWidget.scene.camera.flyTo({
                        destination : Cartesian3.fromDegrees(centerX, centerY, distance),
                        duration: 0.01
                    });
                }

            },

            flySlowlyToCenter: function(centerX, centerY, distance) {
                if(distance > this.MAX_ZOOM_DISTANCE) {
                    distance = this.MAX_ZOOM_DISTANCE;
                }

                if(centerX >= -180 && centerX <= 180
                    && centerY >= -90 && centerY <= 90) {
                    this.cesiumWidget.scene.camera.flyTo({
                        destination : Cartesian3.fromDegrees(centerX, centerY, distance),
                        duration: 2
                    });
                }

            },

            flyToExtent: function(extent) {
                if(extent.xmin > -180 && extent.xmax < 180 && extent.ymin > -90 && extent.ymax < 90) {
                    this.cesiumWidget.scene.camera.flyTo({
                        destination : Rectangle.fromDegrees(extent.xmin, extent.ymin, extent.xmax, extent.ymax),
                        orientation : {
                            heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-85), range: 0.0
                        },
                        duration: 2
                    });
                }
            },

            flyToTerrain: function(evt) {
                var camera = this.cesiumWidget.scene.camera;
                camera.flyTo({
                    destination : Rectangle.fromDegrees(137.41, -4.90, 137.41, -4.90),
                    duration: 0.01,
                    complete: function(evt) {
                        camera.lookUp(1.67079633);
                        //camera.lookLeft(1.570796);
                        //camera.tilt = -1;
                        //console.log(camera.tilt);
                    }
                });

                topic.publish(LayerEvent.prototype.HIDE_ADDED_LAYERS_CONTAINER, null);
                topic.publish(LayerEvent.prototype.HIDE_EXPLORE_CONTAINER, null);
            },

            zoomIn: function() {
                if(this.visible) {
                    this._zoomInInterval = setInterval(lang.hitch(this, function(){
                        var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(this.cesiumWidget.scene.camera.position).height - this.config.elevationMinValue;
                        var moveRate = cameraHeight / 450.0;
                        this.cesiumWidget.scene.camera.moveForward(moveRate);
                    }),10);
                }
            },

            zoomOut: function() {
               if(this.visible) {
                   this._zoomOutInterval = setInterval(lang.hitch(this, function(){
                       var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(this.cesiumWidget.scene.camera.position).height - this.config.elevationMinValue;
                       var moveRate = cameraHeight / 450.0;
                       this.cesiumWidget.scene.camera.moveBackward(moveRate);
                   }), 10);
               }
            },

            stopZoom: function() {
                clearInterval(this._zoomInInterval);
                clearInterval(this._zoomOutInterval);
            },

            toggleControls: function() {
                if(this.activeControl === "mouse") {
                    this.activeControl = "game";
                } else {
                    this.activeControl = "mouse";
                }

                this.changeControl(this.activeControl);
            },

            changeControl: function(controlType) {
                // if(controlType === "game") {
                //
                //     this.removeGameControlTickHandler = this.cesiumWidget.clock.onTick.addEventListener(lang.hitch(this, function(clock) {
                //         if(this.containerHasFocus) {
                //
                //             this.tickNumber++;
                //             if (this.tickNumber % 150 === 0) {
                //                 this.updateSearchMapExtent();
                //             }
                //         }
                //     }));
                // } else {
                //     this.tickNumber = 0;
                //     this.removeGameControlTickHandler();
                // }

                this.controller.setUpController(controlType);
            },



            /**
             * Begins the tour for the specific bookmark by setting up the Cesium clock and timeline.
             * Also creates a rover entity which is followed along the path contained in the bookmark.
             * Enables tour control.
             *
             * @param  {Bookmark} bkmk Bookmark for which the tour is for.
             */
            centerTour: function(bkmk) {
                var self = this;

                //this.showFlyOverTourHelp();

                // Find the correct polyline to follow in cesiumWidget.entities
                var timePositions = new SampledPositionProperty(),
                    pathLabel = bkmk.pathLayer.productLabel,
                    waypointLabel = bkmk.waypointLayer.productLabel,
                    entity = this.cesiumWidget.entities.getById(pathLabel + "-polyline");

                var startTime = entity.timeArray[0];
                var stopTime = entity.timeArray[entity.timeArray.length-1];

                this.clock.currentTime = startTime.clone();
                this.clock.multiplier =  5; // 5 km per second

                this.clock.startTime = startTime.clone();
                this.clock.stopTime = stopTime.clone();

                //console.debug(this.clock.startTime);

                timePositions.addSamples(entity.timeArray, entity.polyline.positions.getValue());
                timePositions.setInterpolationOptions({
                    interpolationDegree : 5,
                    interpolationAlgorithm : LagrangePolynomialApproximation
                });

                // Set timeline to simulation bounds
                domStyle.set(this.cesiumWidget.timeline.container, "visibility", "visible");
                this.cesiumWidget.timeline.zoomTo(startTime, stopTime);
                this.clock.shouldAnimate = false;
                this.cesiumWidget.timeline.resize();

                this.roverEntity = this.cesiumWidget.entities.add({
                    id: "rover-entity",

                    currentTour: bkmk.waypointLayer.productLabel,

                    // Set the entity availability to the same interval as the simulation time.
                    availability: new TimeIntervalCollection([new TimeInterval({
                        start: startTime,
                        stop: stopTime
                    })]),

                    viewFrom: new Cartesian3(-81000, -1800, 27000),
                    // Use our computed positions
                    position: timePositions,

                    // Automatically compute orientation based on position movement.
                    //orientation: new VelocityOrientationProperty(timePositions),

                    billboard: {
                        image: 'jpl/assets/images/billboard-pin.png',
                        verticalOrigin: VerticalOrigin.BOTTOM
                    }
                });

                //Get a list of waypoints and their locations:
                var waypoints = [];
                for (var i = 0; i < bkmk.waypoints.length; i++){
                    if(bkmk.waypoints[i].attributes.notInclude === "false"){
                        var timeLineDate = this.getClosestWaypointMatchFromPolyline(bkmk.waypoints[i], entity.timeArray, timePositions);
                        var distance = JulianDate.secondsDifference(timeLineDate, this.clock.startTime);
                        //Some points are off of the line by quite a bit. These have to be changed on the server side.
                        if(i === 1)
                            distance = 24;
                        if(i === 2)
                            distance = 28;
                        if(i === 4)
                            distance = 793;
                        if(i === 5)
                            distance = 1289;
                        if(i === 8)
                            distance = 2323;
                        if(i === 9)
                            distance = 3473;

                        waypoints[i] = {
                            distance: distance,
                            name: bkmk.waypoints[i].attributes.name,
                            template: bkmk.waypoints[i].attributes.template
                        };
                    }
                }

                //for (var z = 0; z < waypoints.length; z++){
                //    console.log("waypoint: " + z + " : ", waypoints[z])
                //}

                if(!this.hasCloseListener){
                    aspect.after(this.infoWindow, "close", function(){
                        if(self.hasTourPlayed){
                            self.infoWindow.userClosed = true;
                        }
                        self.infoWindow.userSelected = false;
                    });
                    this.hasCloseListener = true;
                }

                // Make sure game controls aren't on
                if (this.activeControl == "game") {
                    this.changeControl("mouse");
                }

                // Change the status of global variable and show the tour controls
                this.tourOn = true;
                this.flyoverInfo.show();

                this.cesiumWidget.trackedEntity = this.roverEntity;


                //variables for bad workaround
                var mcLaughlinZoomedOut = false;
                var originalHeight = 0;
                var zoomedOutTickCounter = 0;
                var zoomBackIn = false;
                var zoomRate = 25000.0;
                var zoomBackedIn = false;

                var tickCounter = 0;
                var tickCounterResetTime = 15;
                this.hasTourPlayed = false;
                this.infoWindow.userSelected = false;
                var currentWaypointId = 1;
                // Add event handlers for both the tick and keyboard controls
                this.removeTickHandler = this.clock.onTick.addEventListener(lang.hitch(this, function() {
                    //Show waypoint info window automatically if the entity gets close to it.
                    //this method is very quick.  if no change has been made it will return right away so it's safe to add this here
                    this.flyoverInfo.updateAttributes();

                    if(!this.clock.shouldAnimate) {
                        return;
                    }

                    var distance = JulianDate.secondsDifference(this.clock.currentTime, this.clock.startTime);

                    tickCounter++;
                    if(tickCounter >= tickCounterResetTime){
                        this.hasTourPlayed = true;

                        for(var index = 1; index < waypoints.length; index++){
                            if(index === 1){
                                if(distance < waypoints[index].distance){
                                    if(currentWaypointId != index){
                                        this.infoWindow.userClosed = false;
                                    }
                                    currentWaypointId = index;

                                    if(!this.infoWindow.userClosed && !this.infoWindow.userSelected){
                                        this.autoSelectEntityByName(waypointLabel + "-" + waypoints[index].name);
                                    }
                                    //console.log("waypoint" + index);
                                }
                            }
                            else if(index > 1 && index < waypoints.length - 1){
                                if(distance >= waypoints[index].distance && distance < waypoints[index + 1].distance){
                                    if(currentWaypointId != index){
                                        this.infoWindow.userClosed = false;
                                    }
                                    currentWaypointId = index;

                                    if(!this.infoWindow.userClosed && !this.infoWindow.userSelected){
                                        this.autoSelectEntityByName(waypointLabel + "-" + waypoints[index].name);
                                    }
                                    //console.log("waypoint" + index);
                                    //this.cesiumWidget.camera.rotateDown(1);
                                }
                            }
                            else if (index === (waypoints.length - 1)){
                                if(distance >= waypoints[waypoints.length - 1].distance){
                                    if(currentWaypointId != (waypoints.length - 1)){
                                        this.infoWindow.userClosed = false;
                                    }
                                    currentWaypointId = (waypoints.length - 1);

                                    if(!this.infoWindow.userClosed && !this.infoWindow.userSelected){
                                        this.autoSelectEntityByName(waypointLabel + "-" + waypoints[waypoints.length - 1].name);
                                    }
                                    //console.log("waypoint" + (waypoints.length - 1));
                                }
                            }

                        }

                        tickCounter = 0;

                    }

                    //bad workaround.
                    //when hitting the waypoint #4 it will zoom out so that McLaughlin is shown.
                    if (!mcLaughlinZoomedOut) {
                        if (distance > 750.0 && distance < 850.0) {
                            //start zooming out
                            var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(this.cesiumWidget.scene.camera.position).height;
                            if (originalHeight === 0)
                                originalHeight = cameraHeight;

                            if (cameraHeight < -2720574) {
                                this.cesiumWidget.camera.zoomOut(zoomRate);
                            } else {
                                mcLaughlinZoomedOut = true;
                                zoomBackedIn = false;
                            }
                        }
                    } else if (!zoomBackedIn) {
                        if (distance > 850.0) {
                            var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(this.cesiumWidget.scene.camera.position).height;
                            if (cameraHeight > originalHeight) {
                                this.cesiumWidget.camera.zoomIn(zoomRate);
                            } else {
                                zoomBackedIn = true;
                                mcLaughlinZoomedOut = false;
                                originalHeight = 0;
                            }
                        }
                    }

                }));

                this.tourControlKUListener = on(document, 'keyup', lang.hitch(this, function(key) {
                    if(this.containerHasFocus) {
                        switch (key.keyCode) {
                            case keys.RIGHT_ARROW:
                                key.preventDefault();
                                this.flyoverInfo.stepForward();
                                break;

                            case keys.LEFT_ARROW:
                                key.preventDefault();
                                this.flyoverInfo.stepBackward();
                                break;

                            case keys.UP_ARROW:
                                key.preventDefault();
                                this.flyoverInfo.fastForward();
                                break;

                            case keys.DOWN_ARROW:
                                key.preventDefault();
                                this.flyoverInfo.fastBackward();
                                break;

                            case keys.SPACE:
                                key.preventDefault();
                                this.cesiumWidget.timeline.resize();
                                this.flyoverInfo.togglePlayPause();
                                break;

                            default:
                                break;
                        }
                    }
                }));

                //Show the first waypoint automatically:
                this.autoSelectEntityByName(waypointLabel + "-" + waypoints[0].name);
            },

            getClosestWaypointMatchFromPolyline: function(waypoint, times, timePositions){
                /*console.log("times", times);
                console.log("positionTest", timePositions.getValue(times[0]));*/
                var carto = Cartographic.fromDegrees(waypoint.geometry.x, waypoint.geometry.y);
                var height = this.cesiumWidget.scene.globe.getHeight(carto);
                var position = Cartesian3.fromRadians(carto.longitude, carto.latitude, height);

                var minDistance = Infinity;
                var minDistanceIndex = -1;
                for(var timeIndex = 0; timeIndex < times.length; timeIndex++){
                    var distance = this.dist(timePositions.getValue(times[timeIndex]), position);
                    if(distance < minDistance){
                        minDistance = distance;
                        minDistanceIndex = timeIndex;
                    }
                }
                //console.log("minDistanceIndex", minDistanceIndex);

                return times[minDistanceIndex];
                //return the date instead
            },

             /**
             * Stops the tour. Resets the clock and prevents animation. Game controls
             * are reverted if on before the start of the tour.
             */
            exitTour: function(){
                this.cesiumWidget.entities.remove(this.roverEntity);
                this.clock.currentTime = this.clock.startTime.clone();
                this.clock.shouldAnimate = false;
                this.tourOn = false;

                domStyle.set(this.cesiumWidget.timeline.container, "visibility", "hidden");
                this.flyoverInfo.hide();

                this.infoWindow.close();
                this.infoWindow.userClosed = false;
                this.hasTourPlayed = false;

                if (this.activeControl == "game") {
                    this.changeControl("game");
                }

                this.tourControlKUListener.remove();
                this.removeTickHandler();
            },

             /**
             * Loops through the waypoints contained in the bookmark and adds
             * them to the globe.
             *
             * @param {Bookmark} bkmk Object containing waypoints.
             */
            addWaypoints3D: function(layer, service) {
                 xhr(service.endPoint + "/query?f=json&where=1=1&outFields=*", {
                     handleAs: "json",
                     headers: {"X-Requested-With": null}
                 }).then(lang.hitch(this, function (data) {
                     var waypoints;
                     if(data.features){
                         waypoints = data.features;
                     }

                     for (var i = 0; i < waypoints.length; i++) {
                         var elevationOffset = service.elevationOffset;
                         if (elevationOffset == undefined)
                             elevationOffset = 0;
                         var viewOffset = service.viewOffset;
                         if (viewOffset == undefined)
                             viewOffset = 0;

                         this._innerWaypointFunction(waypoints[i].geometry, waypoints[i].attributes,
                             layer.productLabel, elevationOffset,
                             viewOffset);

                     }

                 }), function (err) {
                     throw new Error("Could not retrieve waypoints for bookmark (" + service.endPoint + ") - " + err);
                 });


            },

            /**
             * Makes an XMLHttpRequest to read the HTML file containing information
             * about the region described in the bookmark. Then it makes the InfoWindow
             * visible.
             *
             * @param  {Bookmark} bkmk Object containing the region information.
             */
            /*viewRegionInfo: function(bkmk) {
                var name = bkmk.bookmark.regionInfo.name,
                    template = bkmk.bookmark.regionInfo.template;

                bkmk.zoomToExtent(true);
                xhr(template).then(lang.hitch(this, function(content) {
                    this.infoWindow.newWindow(name, content);
                    if(name !== this.previousName){
                        this.infoWindow.contentNode.scrollTop = 0;
                        this.previousName = name;
                    }
                }));
            },*/

            /**
             * Removes the path, waypoints, and any other layers associated to the bkmk parameter.
             *
             * @param  {Bookmark} bkmk The bookmark object whose contents are removed from the map.
             */
            removeWaypoints3D: function(bkmk) {
                if(bkmk.waypointLayer) {
                    var wayPointLayerProductLabel = bkmk.waypointLayer.productLabel;
                    this.removeWaypoints(wayPointLayerProductLabel);
                }

                if(bkmk.pathLayer) {
                    var pathLayerProductLabel = bkmk.pathLayer.productLabel;
                    this.removePolyline(pathLayerProductLabel);

                    // just incase path has been added as map layer
                    this.getAndRemoveLayer(bkmk.pathLayer);
                }

                this.infoWindow.close();
                this.infoWindow.userClosed = false;
                this.hasTourPlayed = false;
            },

            removeWaypoints: function(productLabel) {
                for (var i = this.pins.values.length - 1; i >= 0; i--) {
                    if (this.pins.values[i].productLabel == productLabel) {
                        this.cesiumWidget.entities.remove(this.pins.values[i]);
                        this.pins.remove(this.pins.values[i]);
                    }
                }
            },

            removePolyline: function(productLabel) {
                // Remove vector path
                this.cesiumWidget.entities.removeById(productLabel + "-polyline");
            },

            /**
             * Adds the path associated with the bookmark as a polyline. Takes the
             * points from the web service and then converts them into a type that
             * generateIntermediatePoints() can handle. Then it samples the lat-long
             * coordinates for a height value. These 3D-points are passed in as object
             * options to create a polyline entity.
             *
             * @param {Bookmark} bookmark The bookmark object.
             * @param {String} pointsServiceURL The URL string for the point service.
             */
            addPolyline: function(productLabel, pointsServiceURL, elevationOffset) {
                xhr(pointsServiceURL, {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(lang.hitch(this, function(data) {
                    //setup an array of objects for each point
                    var points = [];
                    for(var i=0; i < data.line.length; i++) {
                        var littleAboveGround = data.line[i].elevation - this.config.elevationMinValue + elevationOffset; //
                        // + Math.abs(data.line[i].elevation * 0.10);
                        points.push(Cartesian3.fromDegrees(data.line[i].x, data.line[i].y, littleAboveGround));
                    }

                    var timeArray = [];
                    if (data.line[data.line.length-1].m == undefined) {
                        //there is no distance information.  use dummy distance.
                        this.clock.startTime = new JulianDate(2457290, 1);
                        this.clock.stopTime = JulianDate.addSeconds(this.clock.startTime, data.line.length, new JulianDate());

                        for (var i = 0; i < data.line.length; i++) {
                            var time = JulianDate.addSeconds(this.clock.startTime, i, new JulianDate());
                            timeArray.push(time.clone());
                        }

                    } else {
                        // Create a timeArray for the polyline for Rover entity updates
                        //there is distance information in the service.
                        var totalDistance = data.line[data.line.length - 1].m;
                        var startTime = new JulianDate(2457290, 1),
                            stopTime = JulianDate.addSeconds(startTime, totalDistance, new JulianDate());

                        //startTime = JulianDate.fromIso8601(bookmark.waypoints[0].attributes.date),
                        //stopTime = JulianDate.fromIso8601(bookmark.waypoints[numWaypoints - 1].attributes.date);
                        this.clock.startTime = startTime.clone();
                        this.clock.stopTime = stopTime.clone();

                        // Evenly distribute the points between the start and stop time

                        for (var i = 0; i < data.line.length; i++) {
                            var time = JulianDate.addSeconds(startTime, data.line[i].m / 1000, new JulianDate());
                            timeArray.push(time.clone());
                        }
                    }




                    //setup and add the line entity with the terrain points

                    this.cesiumWidget.entities.add({
                        id: productLabel + "-polyline",
                        polyline: {
                            positions: points,
                            width: 3,
                            material: Color.LIGHTSKYBLUE
                        },
                        timeArray: timeArray
                    });

                    this.cesiumWidget.scene.groundPrimitives.add(new GroundPrimitive({
                        geometryInstance : new GeometryInstance({
                            geometry: new CorridorGeometry({
                                positions : points,
                                width : 2000.0,
                                cornerType : CornerType.MITERED,
                                vertexFormat : VertexFormat.POSITION_ONLY
                            }),
                            attributes : {
                                color : ColorGeometryInstanceAttribute.fromColor(Color.LIGHTSKYBLUE.withAlpha(0.8))
                            },
                            id : 'corridor'
                        })
                    }));
                }), function(err) {
                    console.log("error retrieving points: " + err);
                });


            },

            /**
             * Adds the corresponding waypoint to the globe. Initially un-highlighted.
             *
             * @param  {Cartesian2} position The coordinate for the waypoint.
             * @param  {Object} attributes Object properties for the bookmark.
             * @param  {String} productLabel String representation of the bookmark name.
             * @param  {Number} elevationOffset Elevation Offset
             * @param  {Number} viewOffset camera view Offset
             *
             */
            _innerWaypointFunction: function(position, attributes, productLabel, elevationOffset, viewOffset) {
                var elevationURL = this.config.services.combinedDEMService.equirect + "?dems=" + this.config.services.catalogRastersService.equirect + "&path=[[" + position.x + "," + position.y + "]]";

                var entity;

                var labelNear = 10000; //default value
                var labelFar = 100000; //default value
                if (attributes.labelNear != undefined)
                    labelNear = attributes.labelNear;
                if (attributes.labelFar != undefined)
                    labelFar = attributes.labelFar;

                //if (attributes.notInclude === 'true') {
                //    entity = this.cesiumWidget.entities.add({
                //        id: attributes.name,
                //        label: new LabelGraphics({text: attributes.name, pixelOffset : new Cartesian2(0.0, -20.0), outlineWidth: 8.0, scale: 0.5, translucencyByDistance: new NearFarScalar(labelNear, 1.0, labelFar, 0.0)}),
                //        offset: {heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-45), range: viewOffset},
                //        productLabel: productLabel
                //    });
                //} else {

                    entity = this.cesiumWidget.entities.add({
                        //id: attributes.name,
                        id: productLabel + "-" + attributes.name,
                        name: attributes.name,
                        label: new LabelGraphics({text: attributes.name, pixelOffset : new Cartesian2(0.0, -20.0), outlineWidth: 8.0, scale: 0.5, translucencyByDistance: new NearFarScalar(labelNear, 1.0, labelFar, 0.0)}),
                        point: this.normal3DPoint,
                        offset: {heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-45), range: viewOffset},
                        productLabel: productLabel
                    });
                //}

                this.pins.add(entity);

                if (attributes.elevation != undefined) {
                    var littleAboveGround = attributes.elevation - this.config.elevationMinValue + elevationOffset;

                    entity.position = Cartesian3.fromDegrees(position.x, position.y, littleAboveGround);
                } else {
                    xhr(elevationURL, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(lang.hitch(this, function (content) {
                        var littleAboveGround = content.line[0].elevation - this.config.elevationMinValue + elevationOffset;

                        entity.position = Cartesian3.fromDegrees(position.x, position.y, littleAboveGround);
                    }));
                }

                //var carto = Cartographic.fromDegrees(position.x, position.y);
                //height = this.cesiumWidget.scene.globe.getHeight(carto);
                //entity.position = Cartesian3.fromDegrees(position.x, position.y, height);

                //Cesium.when(Cesium.sampleTerrain(this.cesiumWidget.terrainProvider, 12, terrainSamplePositions), sampleTerrainSuccess);

                xhr(attributes.template).then(lang.hitch(this, function(content) {
                    entity.description = content;

                }));

            },

            /**
             * Highlights the pin associated to the name parameter. This comprises of
             * changing the color of the billboard.
             *
             * @param  {String} id The string corresponding to the desired entity.
             */
            featureHighlight: function(id) {
                var entity = this.pins.getById(id);
                if (entity != undefined) {
                    if (entity != undefined)
                        this.set3DPoint(entity, this.hover3DPoint);
                }
            },

            /**
             * Un-highlights the pin associated to the name parameter. This comprises of
             * changing the color of the billboard.
             *
             * @param  {String} id The string corresponding to the desired entity.
             */
            featureUnHighlight: function(id) {
                var entity = this.pins.getById(id);
                if (entity != undefined) {
                    if (this.selectedEntity && entity === this.selectedEntity)
                        this.set3DPoint(entity, this.selected3DPoint);
                    else
                        this.set3DPoint(entity, this.normal3DPoint);

                }
            },

            /**
             * Selects the corresponding pin by clearing any that was previously selected
             * and then changing the billboard of the pin.
             *
             * @param  {String} name The string corresponding to the desired entity.
             */
            selectEntityByName: function(name) {
                this.infoWindow.userSelected = true;
                var entity = this.pins.getById(name);
                if (entity != undefined) {
                    this.infoWindow.newWindow(entity.name, entity.description.getValue());
                    if(name !== this.previousName){
                        this.infoWindow.contentNode.scrollTop = 0;
                        this.previousName = name;
                    }

                    if (definedNotNull(this.selectedEntity))
                        this.set3DPoint(this.selectedEntity, this.normal3DPoint);
                    this.selectedEntity = entity;
                    if (entity.point != undefined) {
                        this.set3DPoint(this.selectedEntity, this.selected3DPoint);
                    }
                    if (!this.tourOn)
                        this.cesiumWidget.zoomTo(this.selectedEntity, this.selectedEntity.offset);

                }
            },

            /**
             * Selects the corresponding pin by clearing any that was previously selected
             * and then changing the billboard of the pin without setting he user selected to true;
             *
             * @param  {String} name The string corresponding to the desired entity.
             */
            autoSelectEntityByName: function(name) {
                var entity = this.pins.getById(name);
                if (entity != undefined) {
                    this.infoWindow.newWindow(entity.name, entity.description.getValue());
                    if(name !== this.previousName){
                        this.infoWindow.contentNode.scrollTop = 0;
                        this.previousName = name;
                    }

                    if (definedNotNull(this.selectedEntity))
                        this.set3DPoint(this.selectedEntity, this.normal3DPoint);
                    this.selectedEntity = entity;
                    if (entity.point != undefined) {
                        this.set3DPoint(this.selectedEntity, this.selected3DPoint);
                    }
                    if (!this.tourOn)
                        this.cesiumWidget.zoomTo(this.selectedEntity, this.selectedEntity.offset);
                }
            },

            /**
             * Takes an array of objects containing positional data and interpolates between the points.
             *
             * @param  {Array} polylinePoints      An array containing objects that hold
             *                                               a "lng" and "lat" property.
             * @param  {Number} minDistance               The distance interval for computing interpolated points.
             *                                               If -1 is passed in, polylinePoints is just converted
             *                                               to Cartographic array WITHOUT interpolation.
             * @return {Array}               An array of cartographic points.
             */
            generateIntermediatePoints: function(polylinePoints, minDistance) {
                var extendedPoints = [],
                    previousPoint = polylinePoints[0];

                if (minDistance === -1) {
                    for (var i=0; i < polylinePoints.length; i++) {
                        extendedPoints.push(
                            Cartographic.fromDegrees(
                                polylinePoints[i].lng,
                                polylinePoints[i].lat
                            )
                        );
                    }
                    console.log("Total points: " + extendedPoints.length);
                    return extendedPoints;
                }

                //start by pushing the first point
                extendedPoints.push(
                    Cartographic.fromDegrees(
                        previousPoint.lng,
                        previousPoint.lat
                    )
                );

                for (var i=1; i < polylinePoints.length; i++) {
                    var current = polylinePoints[i],
                        lngDiff = current.lng - previousPoint.lng,
                        latDiff = current.lat - previousPoint.lat,
                        max = Math.max(Math.abs(lngDiff), Math.abs(latDiff)),
                        pointCount = parseInt(max / minDistance, 10),
                        lngIncrement = lngDiff / (pointCount ? pointCount : 1),
                        latIncrement = latDiff / (pointCount ? pointCount : 1),
                        count = 1;

                    while (count <= pointCount) {
                        extendedPoints.push(
                            Cartographic.fromDegrees(
                                previousPoint.lng + count * lngIncrement,
                                previousPoint.lat + count * latIncrement
                            )
                        );
                        count++;
                    }

                    extendedPoints.push(
                        Cartographic.fromDegrees(
                            current.lng,
                            current.lat
                        )
                    );

                    previousPoint = current;
                }

                console.log('Total Line Points: ' + extendedPoints.length);

                return extendedPoints;
            },

                        /**
             * Takes the event passed into ToolsGallery.addToMap along with the finished
             * graphic to parse it into an entity that Cesium understands. Converts coordinates
             * and samples the terrain to determine at what height on the globe to place the graphic.
             * For polylines, the waypoints are interpolated to create a more detailed polyline that
             * follows the terrain.
             *
             * @param {MouseEvent} evt The event related to the location of the mouse click.
             * @param {Graphic} graphic The graphic which is added in the 2-dimensional map view.
             */
            addGraphic: function(evt, graphic, projection){
                // Grab evt geometry and construct array for use in
                // generateIntermediatePoints()
                if (evt.geometry.type === "polyline") {
                    var points = [];
                    for (var i=0; i < evt.geometry.paths[0].length; i++) {
                        //Equirectangular
                        var lng = evt.geometry.paths[0][i][0];
                        var lat = evt.geometry.paths[0][i][1];
                        if(projection === this.config.projection.N_POLE) {
                            console.log("npole");
                            var converted = MapUtil.prototype.convertNorthPolarMetersToDegrees(lng, lat);
                            lng = converted.x;
                            lat = converted.y;
                        } else if(projection === this.config.projection.S_POLE) {
                            console.log("spole");
                            var converted = MapUtil.prototype.convertSouthPolarMetersToDegrees(lng, lat);
                            lng = converted.x;
                            lat = converted.y;
                        }
                        points.push({
                            lng: lng,
                            lat: lat
                        });
                        /*points.push({
                            lng: evt.geometry.paths[0][i][0],
                            lat: evt.geometry.paths[0][i][1]
                        });*/
                    }
                    // Generate additional points to make the polyline hug the terrain
                    var pointsExtended = this.generateIntermediatePoints(points, 0.001);
                    var updatedPoints = [];

                    //create a cartesian point with the terrain height for each point
                    for (var i=0; i < pointsExtended.length; ++i) {
                        var height = this.cesiumWidget.scene.globe.getHeight(pointsExtended[i]);
                        updatedPoints.push(Cartesian3.fromRadians(pointsExtended[i].longitude, pointsExtended[i].latitude, height));
                    }



                    // Setup and add the line entity with the terrain points
                    this.customEntities.add(this.cesiumWidget.entities.add({
                        polyline: {
                            positions: updatedPoints,
                            width: 5,
                            material: Color.YELLOW
                        },
                        /* The following variables are used to integrate 2D and 3D events
                         * when clicking on items in the context menu. */
                        type: "polyline",
                        graphic: graphic
                    }));
                }
                else if (evt.geometry.type ==="point"){
                    // Sample the terrain and then create entity for single point
                        var geoX = evt.geometry.x;
                        var geoY = evt.geometry.y;
                        if(projection === this.config.projection.N_POLE) {
                            console.log("npole");
                            var converted = MapUtil.prototype.convertNorthPolarMetersToDegrees(geoX, geoY);
                            geoX = converted.x;
                            geoY = converted.y;
                        } else if(projection === this.config.projection.S_POLE) {
                            console.log("spole");
                            var converted = MapUtil.prototype.convertSouthPolarMetersToDegrees(geoX, geoY);
                            geoX = converted.x;
                            geoY = converted.y;
                        }
                    var carto = Cartographic.fromDegrees(geoX, geoY);
                    height = this.cesiumWidget.scene.globe.getHeight(carto);

                    var entity = this.cesiumWidget.entities.add({
                        position: Cartesian3.fromRadians(carto.longitude, carto.latitude, height),
                        billboard: {
                            image : this.SUN_PIN,
                            verticalOrigin: VerticalOrigin.BOTTOM
                        },
                        /* The following variables are used to integrate 2D and 3D events
                         * when clicking on items in the context menu. */
                        type: "point",
                        graphic: graphic
                    });
                }
                else if (evt.geometry.type === "polygon") {
                    var xmin = CesiumMath.toRadians(evt.geometry.getExtent().xmin),
                        xmax = CesiumMath.toRadians(evt.geometry.getExtent().xmax),
                        ymin = CesiumMath.toRadians(evt.geometry.getExtent().ymin),
                        ymax = CesiumMath.toRadians(evt.geometry.getExtent().ymax);

                    // Sample the terrain to determine a height
                    var height = this.cesiumWidget.scene.globe.getHeight(new Cartographic(xmin, ymin));

                    var entity = this.cesiumWidget.entities.add({
                        rectangle: {
                            coordinates: new Rectangle(xmin, ymin, xmax, ymax),
                            material: Color.YELLOW.withAlpha(0.5),
                            outline: true,
                            outlineColor: Color.YELLOW,
                            height: height
                        },
                        /* The following variables are used to integrate 2D and 3D events
                         * when clicking on items in the context menu. */
                        type: "polygon",
                        graphic: graphic
                    });

                    this.customEntities.add(entity);
                }
            },

            /**
              * Removes the custom entity from the terrainview based on the
              * corresponding graphic in the 2D view.
              *
              * @param {Graphic} graphic The corresponding graphic to be removed.
              */
            removeGraphic: function(graphic){
                for (var i=0; i < this.customEntities.values.length; i++) {
                    if (this.customEntities.values[i].graphic === graphic) {
                        var entity = this.customEntities.values[i];
                        this.customEntities.remove(entity);
                        if (this.cesiumWidget.entities.contains(entity))
                            this.cesiumWidget.entities.remove(entity);
                        return;
                    }
                }
            },

            /**
              * Returns the distance between 2 cartesian points.
              *
              * @param {Object} First point.
              * @param {Object} Second point.
              */
            dist: function(p1, p2) {
                var x1 = p1.x;
                var y1 = p1.y;
                var x2 = p2.x;
                var y2 = p2.y;
                return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
            },

            flyToSlideShowLocation: function(evt){
                var height = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(this.cesiumWidget.scene.camera.position);

                this.cesiumWidget.scene.camera.flyTo({
                    destination: Cartesian3.fromDegrees(evt.longitude, evt.latitude, height.height),
                    duration: 2
                });
            },

            addSlideShowPoint: function(evt){
                if(this.slideShowEntity){
                    this.cesiumWidget.entities.remove(this.slideShowEntity);
                }

                this.slideShowEntity = this.cesiumWidget.entities.add({
                    position: Cartesian3.fromDegrees(evt.longitude, evt.latitude),
                    point: {
                      pixelSize : 10,
                      color: Color.YELLOW
                    }
                });
            },

            removeSlideShowPoint: function(evt){
                if(this.slideShowEntity){
                    this.cesiumWidget.entities.remove(this.slideShowEntity);
                }
            },

            showFlyOverTourHelp: function(){
                on(window.document, "#flyOverTourShowPreferenceCkbox:click", function() {
                    cookie("disableFlyoverTourHelp", true, {expires: 3600 * 1000 * 24 * 365 * 2});
                });

                if(!cookie("disableFlyoverTourHelp")) {
                    setTimeout(lang.hitch(this, this.startTour), 0);
                }
            },

            startTour: function() {
                var that = this;
                var tour = new Tour({
                    name: "fly-over-tour-help",
                    backdrop: false,
                    storage: false,
                    autoscroll: false,
                    delay: 400,
                    keyboard: false,
                    orphan: true,
                    onShown: function() {
                        domClass.remove(dom.byId(this.id), "fade");
                    },
                    onHide: function() {
                        if(dom.byId(this.id))
                            domClass.add(dom.byId(this.id), "fade");
                    },
                    steps: that.getSteps()
                });

                tour.init(true);
                tour.start();
            },
            set3DPoint: function(entity, pointType) {
                if (entity == undefined)
                    return;

                if (entity.point != undefined)
                    entity.point = pointType;
            },
            getSteps: function() {
                var steps = [
                    {
                        title: "<h1>" + textContent.GlobeView_helpWelcomeTitle + "</h1>",
                        backdrop: true,
                        content: '<span style="font-size: 1.2em;text-align:left;display:inline-block;">' + textContent.GlobeView_helpWelcomeContent + '</span>',
                        template: "<div class='popover tour' style='max-width:400px;width:90%;text-align:center;'><div class='arrow'></div> <h3 class='popover-title'></h3> <div class='popover-content'></div> <div class='popover-navigation'>" +
                        "<button class='btn btn-success' data-role='next'><span class='fa fa-check'></span>" + textContent.GlobeView_helpWelcomeShowBtn + "</button> <button class='btn btn-primary' data-role='end' style='float:none;'>" + textContent.GlobeView_helpWelcomeSkipBtn + "</button> </div>" +
                        "<div class='checkbox'> <label><input id='flyOverTourShowPreferenceCkbox' type='checkbox'> Do not show this dialog again </label></div></div></div>"
                    },
                    {
                        title: textContent.GlobeView_helpMapViewTitle,
                        content: textContent.GlobeView_helpMapViewContent
                    },
                    {
                        element: "#flyOverButtons",
                        title: textContent.GlobeView_helpTourControlTitle,
                        content: textContent.GlobeView_helpTourControlContent,
                        placement: "top"
                    },
                    {
                        element: "#timelineContainer",
                        title: textContent.GlobeView_helpTimeLineTitle,
                        content: textContent.GlobeView_helpTimeLineContent,
                        placement: "top"
                    },
                    {
                    title: textContent.GlobeView_helpTourCompleteTitle,
                    backdrop: true,
                    content: textContent.GlobeView_helpTourCompleteContent,
                    template: "<div class='popover tour' style='max-width:400px;text-align:center;'><div class='arrow'></div> <h3 class='popover-title'></h3> <div class='popover-content' style='text-align:left;'></div> <div class='popover-navigation'>" +
                    "<button class='btn btn-success' data-role='end' style='float:none;'>" + textContent.GlobeView_helpTourCompleteDoneBtn + "</button></div>" +
                    "</div></div>"
                }
                ];

                return steps;
            },

            changeTerrainExaggeration: function(evt){
                var terrainExaggerationValue  = evt.terrainExaggerationValue;
                this.cesiumWidget.scene._terrainExaggeration = terrainExaggerationValue;
                if (this.config.terrainEndpoint != null && this.config.terrainEndpoint != "") {
                    var demProvider = new CesiumTerrainProvider({
                        url: this.config.terrainEndpoint
                    });

                    //return demProvider;
                    this.cesiumWidget.scene.globe.terrainProvider = demProvider;
                }
            },

            flyToCoordinate: function(evt){
                if (typeof evt.zoom !== 'undefined') {
                    this.cesiumWidget.scene.camera.flyTo({
                        destination : Cartesian3.fromDegrees(evt.lon,evt.lat,evt.zoom)
                    });
                }else{
                    var zoom = this.cesiumWidget.scene.camera.getMagnitude();
                    this.cesiumWidget.scene.camera.flyTo({
                        destination : Cartesian3.fromDegrees(evt.lon,evt.lat,zoom)
                    });
                }
            },

            addExplorerHighLightPolygon: function(evt){
                this.removeExplorerHighLightPolygon();

                if(evt.type === "point"){
                    this.explorerHighlightPolygon = this.cesiumWidget.entities.add({
                        position : Cartesian3.fromDegrees(evt.degreeArray.x, evt.degreeArray.y),
                        point : {
                            pixelSize : 25,
                            color : Color.YELLOW.withAlpha(0.50)
                        }
                    });
                }
                if(evt.type === "rectangle") {
                    var degreeArray = evt.degreeArray;
                    this.explorerHighlightPolygon = this.cesiumWidget.entities.add({
                        rectangle : {
                            coordinates : Rectangle.fromDegrees(degreeArray[0],degreeArray[1],degreeArray[2],degreeArray[3]),
                            material : Color.YELLOW.withAlpha(0.1),
                            extrudedHeight : 300.0,
                            height : 1000.0,
                            outline : true,
                            outlineColor : Color.YELLOW
                        }
                    })
                }
                else if(evt.type === "polygon") {
                    var degreeArray = evt.degreeArray;
                    this.explorerHighlightPolygon = this.cesiumWidget.entities.add({
                        polygon : {
                            hierarchy : {
                                positions: Cartesian3.fromDegreesArray(degreeArray)
                            },
                            material : Color.YELLOW.withAlpha(0.1),
                            extrudedHeight : 300.0,
                            height : 1000.0,
                            outline : true,
                            outlineColor : Color.YELLOW
                        }
                    })
                }
            },

            removeExplorerHighLightPolygon: function(evt){
                if(this.explorerHighlightPolygon !== null) {
                    this.cesiumWidget.entities.remove(this.explorerHighlightPolygon);
                }
            },

            pointToLineDistance: function(ax, ay, bx, by, px,py) {
                var normalLength = Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay));
                return Math.abs((px-ax)*(by-ay)-(py-ay)*(bx-ax))/normalLength;
            },

            addBookmarkGraphicToTerrain: function(evt){
                console.log("ADD TO TERRAIN GRAPHIC", evt.graphic);

                var color = evt.graphic.symbol.color;
                var outlineColor = evt.graphic.symbol.color;
                if(evt.graphic.symbol.outline){
                    outlineColor = evt.graphic.symbol.outline.color;
                }
                color = this.convertRgbaToCesiumColor(color);
                outlineColor = this.convertRgbaToCesiumColor(outlineColor);

                if(evt.graphic.geometry.type === "point"){
                    var entity = this.cesiumWidget.entities.add({
                        position : Cartesian3.fromDegrees(evt.graphic.geometry.x, evt.graphic.geometry.y),
                        point : {
                            show : true,
                            color : new Color(color.r, color.g, color.b, color.a),
                            pixelSize : 10,
                            outlineColor: new Color(outlineColor.r, outlineColor.g, outlineColor.b, outlineColor.a),
                            outlineWidth : 2,
                            heightReference : HeightReference.CLAMP_TO_GROUND
                        }
                    });

                    this.bookmarkEntities.push(entity);
                }

                if(evt.graphic.geometry.type === "polyline"){
                    var paths = evt.graphic.geometry.paths[0];
                    var positions = [];
                    for (var i = 0; i < paths.length; i++) {
                        positions.push(Cartesian3.fromDegrees(paths[i][0], paths[i][1]));
                    }

                    var entity = this.cesiumWidget.entities.add({
                        polyline : {
                            positions : positions,
                            width : 5.0,
                            material : new Color(outlineColor.r, outlineColor.g, outlineColor.b, outlineColor.a),
                            heightReference : HeightReference.CLAMP_TO_GROUND
                        }
                    });
                    this.bookmarkEntities.push(entity);
                }

                if(evt.graphic.geometry.type === "polygon"){
                    var rings = evt.graphic.geometry.rings[0];
                    var hierarchy = [];
                    for( var i = 0; i < rings.length; i++){
                        hierarchy.push(rings[i][0]);
                        hierarchy.push(rings[i][1]);
                    }

                    var entity = this.cesiumWidget.entities.add({
                        polygon : {
                            hierarchy : new PolygonHierarchy(Cartesian3.fromDegreesArray(hierarchy)),
                            outline : true,
                            outlineColor : new Color(outlineColor.r, outlineColor.g, outlineColor.b, outlineColor.a),
                            outlineWidth : 4,
                            heightReference : HeightReference.CLAMP_TO_GROUND,
                            material : new Color(color.r, color.g, color.b, color.a)
                        }
                    });
                    this.bookmarkEntities.push(entity);
                }
            },

            convertRgbaToCesiumColor: function(color){
                var convertedColor = {
                    "r": color.r / 255,
                    "g": color.g / 255,
                    "b": color.b / 255,
                    "a": color.a
                };

                return convertedColor;
            },

            removeBookmarkGraphicsFromTerrain: function(evt){
                for(var i = 0; i < this.bookmarkEntities.length; i++){
                    this.cesiumWidget.entities.remove(this.bookmarkEntities[i]);
                }

                this.bookmarkEntities = [];
            },

            showWaypoints: function(evt){
                var layer = evt.layer;
                var pins = this.pins;

                for(var i = 0; i < pins.values.length; i++){
                    if(pins.values[i].productLabel === layer.id){
                        var entity = pins.getById(pins.values[i].id);
                        entity.availability = undefined;
                    }
                }
            },

            hideWaypoints: function(evt){
                var layer = evt.layer;
                var pins = this.pins;

                for(var i = 0; i < pins.values.length; i++){
                    if(pins.values[i].productLabel === layer.id){
                        var entity = pins.getById(pins.values[i].id);
                        entity.availability = new TimeIntervalCollection();
                    }
                }
            }
    });
});
