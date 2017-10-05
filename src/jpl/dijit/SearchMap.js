define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/on",
    "dojo/mouse",
    "dojo/topic",
    "dojo/query",
    "dojo/request/xhr",
    "dojo/dom-style",
    "dojo/dom-class",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SearchMap.html',
    "xstyle/css!./css/SearchMap.css",
    "jpl/config/Config",
    "jpl/utils/MapLinkUtil",
    "jpl/utils/MapUtil",
    "jpl/utils/DOMUtil",
    "jpl/utils/IndexerUtil",
    "jpl/utils/AutomaticLayerManager",
    "jpl/events/MapEvent",
    "jpl/events/LayerEvent",
    "jpl/data/BaseMaps",
    "jpl/data/Layers",
    "esri/config",
    "esri/dijit/OverviewMap",
    "esri/geometry/Point",
    "esri/layers/FeatureLayer",
    "esri/tasks/query",
    "esri/graphic",
    "esri/Color",
    "esri/symbols/TextSymbol",
    "esri/layers/LabelLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/Font",
    "esri/symbols/SimpleMarkerSymbol"
], function (declare, lang, event, dom, on, mouse, topic, query, xhr, domStyle, domClass, _WidgetBase, _TemplatedMixin, template, css,
             Config, MapLinkUtil, MapUtil, DOMUtil, IndexerUtil, AutomaticLayerManager, MapEvent, LayerEvent, BaseMaps, Layers, esriConfig, OverviewMap, Point) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        visible: true,
        basemapsLoaded: false,
        layerGalleryInit: false,
        globeInit: false,
        mapInit: false,
        layersLoaded: false,
        indexerUtil: undefined,
        autoLayerManager: undefined,

        constructor: function () {
        },

        postCreate: function () {
        },

        startup: function () {
            //initialize footer variables
            console.debug("start========");

            console.debug("basemap========");
            this.basemapSingleton = BaseMaps.getInstance();
            console.debug("layers========");
            this.layerSingleton = Layers.getInstance();
            console.debug("config========");
            this.config = Config.getInstance();
            this.currentMapProjection = this.config.projection.EQUIRECT;
            this.maplink = MapLinkUtil.getInstance();
            this.indexerUtil = new IndexerUtil();
            if(this.config.autoLayerConfig.useAutoLayers){
                this.autoLayerManager = new AutomaticLayerManager();
                this.autoLayerManager.startup();
            }


            esriConfig.defaults.io.corsEnabledServers.push("mars2-532959285.us-west-1.elb.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("dzw9r5p966egh.cloudfront.net");
            esriConfig.defaults.io.corsEnabledServers.push("marstrek.jpl.nasa.gov");
            esriConfig.defaults.io.corsEnabledServers.push("ec2-54-177-76-230.us-west-1.compute.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("ec2-184-72-57-254.us-west-1.compute.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("moontrek.jpl.nasa.gov");
            esriConfig.defaults.io.corsEnabledServers.push("http://ec2-50-18-111-140.us-west-1.compute.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("http://vesta-1249282919.us-west-1.elb.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("http://lmmp-webclient");
            esriConfig.defaults.io.corsEnabledServers.push("https://trektiles.jpl.nasa.gov");

            //esriConfig.defaults.io.corsEnabledServers.push("http://ec2-54-241-20-2.us-west-1.compute.amazonaws.com");

            //should remove the followings.
            esriConfig.defaults.io.corsEnabledServers.push("mars-2035432769.us-west-1.elb.amazonaws.com");
            esriConfig.defaults.io.corsEnabledServers.push("d1poygwgh8gv6r.cloudfront.net");

            esriConfig.defaults.map.zoomDuration = 300; //time in milliseconds; default is 500

            topic.subscribe(LayerEvent.prototype.BASEMAPS_LOADED, lang.hitch(this, this.basemapsComplete));
            topic.subscribe(LayerEvent.prototype.LAYERS_LOADED, lang.hitch(this, this.layersComplete));
            //topic.subscribe(LayerEvent.prototype.LAYER_GALLERY_INITIALIZED, lang.hitch(this, this.layerGalleryLoaded));
            //topic.subscribe(MapEvent.prototype.GLOBE_INITIALIZED, lang.hitch(this, this.layerGalleryLoaded));
            topic.subscribe(MapEvent.prototype.GLOBE_MOUSE_MOVED, lang.hitch(this, this.mapMouseMoved));
            topic.subscribe(MapEvent.prototype.CENTER_MAP_AT, lang.hitch(this, this.centerMap));
            topic.subscribe(MapEvent.prototype.CENTER_ZOOM_MAP_AT, lang.hitch(this, this.centerAndZoomMap));
            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            topic.subscribe(MapEvent.prototype.SET_EXTENT, lang.hitch(this, this.setMapExtent));
            topic.subscribe(MapEvent.prototype.TERRAIN_VIEW, lang.hitch(this, this.disableMap));
            topic.subscribe(MapEvent.prototype.MAP_VIEW, lang.hitch(this, this.enableMap));
            topic.subscribe(MapEvent.prototype.ZOOM_IN, lang.hitch(this, this.mapZoomInEvent));
            topic.subscribe(MapEvent.prototype.ZOOM_OUT, lang.hitch(this, this.mapZoomOutEvent));
            topic.subscribe(MapEvent.prototype.SHOW_INFOWINDOW, lang.hitch(this, this.showInfoWindow));
            topic.subscribe(MapEvent.prototype.MOVE_MAP, lang.hitch(this, this.moveMap));
            topic.subscribe(MapEvent.prototype.VIEW_VR, lang.hitch(this, this.viewVR));
            topic.subscribe(LayerEvent.prototype.REORDER_LAYERS_REQUST, lang.hitch(this, this.orderLayers));


            if(this.config.autoLayerConfig.useAutoLayers){
                topic.subscribe(LayerEvent.prototype.TOGGLE_AUTO_LAYERS, lang.hitch(this, this.toggleAutoLayers));
                topic.subscribe(LayerEvent.prototype.TOGGLE_AUTO_LAYER_SECTION, lang.hitch(this, this.toggleAutoLayerSection));
                topic.subscribe(LayerEvent.prototype.TOGGLE_AUTO_LAYER_SECTION_FOOTPRINT, lang.hitch(this, this.toggleAutoLayerFootPrintLayer));
            }

            //disable the right click context menu on the map

            var self = this;
            on(this, "contextmenu", function(evt){
                evt.preventDefault();
                evt.stopPropagation();
                //var map = self.currentMap();
                //map.centerAt(new Point(137.37751542051092,-4.6627907213145905,map.extent.spatialReference)).then(function(){
                //    console.info("center at : " + map.extent.getCenter().x);
                //});
                return false;
            });
        },

        projectionChanged: function(evt) {
            var extent;

            if(evt.projection === this.config.projection.EQUIRECT) {
                this.visible = true;
                this.currentMapProjection = this.config.projection.EQUIRECT;
                domClass.remove("mainSearchMap", "containerHidden");
                domClass.add("mainSearchMap", "containerVisible");
                domStyle.set("cubeSpinner", "transform", "translateY(0)");
                domStyle.set("cubeSpinner", "-webkit-transform", "translateY(0)");
                extent = this.equirectMap.extent;
            } else if(evt.projection === this.config.projection.N_POLE) {
                this.visible = true;
                this.currentMapProjection = this.config.projection.N_POLE;
                domClass.remove("mainSearchMap", "containerHidden");
                domClass.add("mainSearchMap", "containerVisible");
                domStyle.set("cubeSpinner", "transform", "translateY(100%)");
                domStyle.set("cubeSpinner", "-webkit-transform", "translateY(100%)");
                extent = this.northPoleMap.extent;
            } else if(evt.projection === this.config.projection.S_POLE) {
                this.currentMapProjection = this.config.projection.S_POLE;
                this.visible = true;
                domClass.remove("mainSearchMap", "containerHidden");
                domClass.add("mainSearchMap", "containerVisible");
                domStyle.set("cubeSpinner", "transform", "translateY(-100%)");
                domStyle.set("cubeSpinner", "-webkit-transform", "translateY(-100%)");
                domStyle.set("cubeSpinner", "transform-origin", "-100% -100%");
                extent = this.southPoleMap.extent;
            } else if(evt.projection === this.config.projection.GLOBE_3D) {
                this.currentMapProjection = this.config.projection.GLOBE_3D;
                this.visible = false;
            }

            MapUtil.prototype.resizeFix();

            topic.publish(MapEvent.prototype.MAP_MOVED, {extent: extent, projection: evt.projection});

            //Refresh maplink URL
            if(this.currentMapProjection){
                topic.publish(MapEvent.prototype.MOVE_MAP, { projection: this.currentMapProjection});
            }
        },

        viewVR: function(evt) {
            var map = this.currentMap();
            var textures = "";
            var alphas = "";
            for (var i=0; i<map.layerIds.length; i++) {
                var layer = map.getLayer(map.layerIds[i]);
                //workaround to only include WMTS
                if (layer.tileInfo !== undefined && layer.visible) {
                    textures += layer.url + ",";
                    alphas += layer.opacity + ",";
                }

            }

            if(textures != "")
                textures = textures.substring(0, textures.length-1);

            textures = encodeURI(textures);
            if(alphas != "")
                alphas = alphas.substring(0, alphas.length-1);

            alphas = encodeURI(alphas);

            var windowObjectReference;
            var strWindowFeatures = "menubar=no,location=no,resizable=no,scrollbars=no,status=yes";

            var point = map.extent.getCenter();
            point = "point=" + encodeURI(point.x + "," + point.y);

            var zoom = "zoom="+ map.getZoom();
            var terrain = encodeURI(this.config.data.services.terrainEndpoint);
            var vrViewerURL = this.config.data.services.vrViewer + "?textures=" + textures + "&" + point + "&" + zoom + "&alphas=" + alphas + "&terrain=" + terrain;


            windowObjectReference = window.open(vrViewerURL, "VR Viewer", strWindowFeatures);

        },

        currentMap: function() {
            var map = null;
            if(this.currentMapProjection === this.config.projection.EQUIRECT) {
                map = this.equirectMap;
            } else if(this.currentMapProjection === this.config.projection.N_POLE) {
                map = this.northPoleMap;
            } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                map = this.southPoleMap;
            }
            return map;
        },

        terrainViewClicked: function(evt) {
            topic.publish(MapEvent.prototype.TERRAIN_VIEW, null);
            //topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {"projection": Projection.prototype.GLOBE_3D});
        },

         //Function to handle mouse moved events on the map
        mapMouseMoved: function (evt) {
            if (evt.mapPoint.x !== undefined && evt.mapPoint.y !== undefined) {

                var x=0, y=0;

                if(this.currentMapProjection === this.config.projection.N_POLE) {
                     var degObj = MapUtil.prototype.convertNorthPolarMetersToDegrees(evt.mapPoint.x, evt.mapPoint.y);
                     x = degObj.x;
                     y = degObj.y;
                } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                     var degObj = MapUtil.prototype.convertSouthPolarMetersToDegrees(evt.mapPoint.x, evt.mapPoint.y);
                     x = degObj.x;
                     y = degObj.y;
                } else {
                    x = evt.mapPoint.x;
                    y = evt.mapPoint.y;
                }

                topic.publish(MapEvent.prototype.MOUSE_COORDINATE_CHANGE, {
                    "x": x,
                    "y": y
                });
            }
        },

         //Function to handle zoom events on the map
        mapZoomed: function (evt) {
            var centerPt, ddCenterPt;

            if(this.visible) {
                topic.publish(MapEvent.prototype.MAP_MOVED, {
                    extent: evt.extent,
                    projection: this.currentMapProjection,
                    zoom: this.currentMap().getZoom()
                });
            }
            // try to find out more high resolution layers
            if(this.config.autoLayerConfig.useAutoLayers) {
                this.autoLayerManager.mapChanged(this.currentMap(), this.currentMapProjection);
            }
        },

        mapPanEnd: function(evt) {
            if(this.visible) {
                topic.publish(MapEvent.prototype.MAP_MOVED, {
                    extent: evt.extent,
                    projection: this.currentMapProjection,
                    zoom: this.currentMap().getZoom()
                });
            }

            var centerPt, ddCenterPt;

            if(this.currentMapProjection === this.config.projection.N_POLE) {
                centerPt = evt.extent.getCenter();
                ddCenterPt = MapUtil.prototype.convertNorthPolarMetersToDegrees(centerPt.x, centerPt.y);

                if(this.visible) {
                    topic.publish(MapEvent.prototype.GLOBE_SET_CENTER, {
                        x: ddCenterPt.x,
                        y: ddCenterPt.y
                    });
                }
            } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                centerPt = evt.extent.getCenter();
                ddCenterPt = MapUtil.prototype.convertSouthPolarMetersToDegrees(centerPt.x, centerPt.y);

                if(this.visible) {
                    topic.publish(MapEvent.prototype.GLOBE_SET_CENTER, {
                        x: ddCenterPt.x,
                        y: ddCenterPt.y
                    });
                }
            }

            // try to find out more high resolution layers
            if(this.config.autoLayerConfig.useAutoLayers) {
                this.autoLayerManager.mapChanged(this.currentMap(), this.currentMapProjection);
            }
        },

        basemapsComplete: function() {
            console.info("basemap loaded");

            this.basemapsLoaded = true;
            this.initializeMaps();
        },

        layersComplete: function() {
            console.info("layers loaded");

            this.layersLoaded = true;
            this.initializeMaps();
        },

        initializeMaps: function() {
            console.info("Initializeing Map Attempt===============" + this.basemapsLoaded + ":" + this.layersLoaded);

            if(this.basemapsLoaded && this.layersLoaded) {
                console.info("Initializeing Map===============");
                this.equirectMap = MapUtil.prototype.createMap(this.mapContainer, 2, this.config.projection.EQUIRECT);
                this.northPoleMap = MapUtil.prototype.createMap(this.northPoleMapContainer, 1, this.config.projection.N_POLE);
                this.southPoleMap = MapUtil.prototype.createMap(this.southPoleMapContainer, 1, this.config.projection.S_POLE);

                //Initialization of the map event handlers
                on(this.equirectMap, MapEvent.prototype.MOUSE_MOVED, lang.hitch(this, this.mapMouseMoved));
                on(this.equirectMap, MapEvent.prototype.ZOOM_END, lang.hitch(this, this.mapZoomed));
                on(this.equirectMap, MapEvent.prototype.PAN_END, lang.hitch(this, this.mapPanEnd));
                on(this.equirectMap, MapEvent.prototype.BASEMAP_LOADED, lang.hitch(this, this.equirectBasemapLoaded));
                on(this.equirectMap, "click", lang.hitch(this, this.mapClicked));

                on(this.northPoleMap, MapEvent.prototype.MOUSE_MOVED, lang.hitch(this, this.mapMouseMoved));
                on(this.northPoleMap, MapEvent.prototype.ZOOM_END, lang.hitch(this, this.mapZoomed));
                on(this.northPoleMap, MapEvent.prototype.PAN_END, lang.hitch(this, this.mapPanEnd));
                on(this.northPoleMap, MapEvent.prototype.BASEMAP_LOADED, lang.hitch(this, this.northPoleBasemapLoaded));
                on(this.northPoleMap, "click", lang.hitch(this, this.mapClicked));

                on(this.southPoleMap, MapEvent.prototype.MOUSE_MOVED, lang.hitch(this, this.mapMouseMoved));
                on(this.southPoleMap, MapEvent.prototype.ZOOM_END, lang.hitch(this, this.mapZoomed));
                on(this.southPoleMap, MapEvent.prototype.PAN_END, lang.hitch(this, this.mapPanEnd));
                on(this.southPoleMap, MapEvent.prototype.BASEMAP_LOADED, lang.hitch(this, this.southPoleBasemapLoaded));
                on(this.southPoleMap, "click", lang.hitch(this, this.mapClicked));

                console.info("basemapSingleton", this.basemapSingleton);
                if(this.config.useIndexerLayers) {
                    //add the first basemap automatically
                    if (this.basemapSingleton.centerLayerList[0]) {
                        var layer = this.basemapSingleton.getLayerByProductLabel(this.basemapSingleton.defaultBasemaps[0]);
                        MapUtil.prototype.addLayerToMap(layer, this.equirectMap, true);
                    }
                    if (this.basemapSingleton.northLayerList[0]) {
                        var layer = this.basemapSingleton.getLayerByProductLabel(this.basemapSingleton.defaultBasemaps[1]);
                        MapUtil.prototype.addLayerToMap(layer, this.northPoleMap, true, this.config.projection.SPATIAL_REFERENCES.N_POLE);
                    }
                    if (this.basemapSingleton.southLayerList[0]) {
                        var layer = this.basemapSingleton.getLayerByProductLabel(this.basemapSingleton.defaultBasemaps[2]);
                        MapUtil.prototype.addLayerToMap(layer, this.southPoleMap, true, this.config.projection.SPATIAL_REFERENCES.S_POLE);
                    }
                }
                else{
                    if (this.basemapSingleton.centerLayerList[0]) {
                        MapUtil.prototype.addLayerToMap(this.basemapSingleton.centerLayerList[0], this.equirectMap, true);
                    }
                    if (this.basemapSingleton.northLayerList[0]) {
                        MapUtil.prototype.addLayerToMap(this.basemapSingleton.northLayerList[0], this.northPoleMap, true, this.config.projection.SPATIAL_REFERENCES.N_POLE);
                    }
                    if (this.basemapSingleton.southLayerList[0]) {
                        MapUtil.prototype.addLayerToMap(this.basemapSingleton.southLayerList[0], this.southPoleMap, true, this.config.projection.SPATIAL_REFERENCES.S_POLE);
                    }
                }


                topic.publish(LayerEvent.prototype.BASEMAP_CHANGED, {
                    "productLabel": this.basemapSingleton.centerLayerList[0].productLabel,
                    "projection": this.config.projection.EQUIRECT,
                    "type": "basemap"
                });

                //this.setupMinimap(this.equirectMap);
                console.info("MAP_INITIALIZED published");

                topic.publish(MapEvent.prototype.MAP_INITIALIZED, null);


                topic.publish(MapEvent.prototype.INITIALIZE_SCALEBARS, {
                    maps: {
                        equirect: this.equirectMap,
                        southPole: this.southPoleMap,
                        northPole: this.northPoleMap
                    }
                });


                console.info('map initialized');

                //this.layerGalleryLoaded({eType: MapEvent.prototype.MAP_INITIALIZED});

                if(this.config.autoLayerConfig.useAutoLayers) {
                    this.autoLayerManager.mapChanged(this.currentMap(), this.currentMapProjection);
                }


            }


        },

        mapZoomInEvent: function() {
            var currentMap;

            if(this.currentMapProjection === this.config.projection.EQUIRECT) {
                currentMap = this.equirectMap;
            } else if(this.currentMapProjection === this.config.projection.N_POLE) {
                currentMap = this.northPoleMap;
            } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                currentMap = this.southPoleMap;
            }

            MapUtil.prototype.mapZoomIn(currentMap);
        },

        mapZoomOutEvent: function() {
            var currentMap;

            if(this.currentMapProjection === this.config.projection.EQUIRECT) {
                currentMap = this.equirectMap;
            } else if(this.currentMapProjection === this.config.projection.N_POLE) {
                currentMap = this.northPoleMap;
            } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                currentMap = this.southPoleMap;
            }

            MapUtil.prototype.mapZoomOut(currentMap);
        },

        equirectBasemapLoaded: function(evt) {
            var self = this;

            MapUtil.prototype.centerMapAt(this.equirectMap,0,0).then(function(){
                MapUtil.prototype.resizeFix();
                topic.publish(MapEvent.prototype.MAP_READY, {map: self.equirectMap, projection: self.config.projection.EQUIRECT});
            });

        },

        northPoleBasemapLoaded: function(evt) {
            var self = this;
            MapUtil.prototype.centerMapAt(this.northPoleMap,0,0).then(function() {
                MapUtil.prototype.resizeFix();
                topic.publish(MapEvent.prototype.MAP_READY, {
                    map: self.equirectMap,
                    projection: self.config.projection.N_POLE
                });
            });
        },

        southPoleBasemapLoaded: function(evt) {
            var self = this;
            MapUtil.prototype.centerMapAt(this.southPoleMap,0,0).then(function(){
                MapUtil.prototype.resizeFix();
                topic.publish(MapEvent.prototype.MAP_READY, {map: self.equirectMap, projection: self.config.projection.S_POLE});
            });

        },

        layerGalleryLoaded: function(evt) {
            /*
            if(evt.eType === LayerEvent.prototype.LAYER_GALLERY_INITIALIZED) {
                this.layerGalleryInit = true;
            } else if(evt.eType === MapEvent.prototype.GLOBE_INITIALIZED) {
                this.globeInit = true;
            } else if(evt.eType === MapEvent.prototype.MAP_INITIALIZED) {
                this.mapInit = true;
            }

            console.log("LAYER GALLERY LOADED");
            if(this.globeInit && this.mapInit && this.layersLoaded) {
                var self = this;

                for(var i=0; i < this.layerSingleton.centerLayerList.length; i++) {
                    var layer = this.layerSingleton.centerLayerList[i];
                    if (layer.show) {
                        if(layer.productType === "FeatureLabel" && layer.layerTitle === "Nomenclature") {
                            MapUtil.prototype.addNomenclatureToMap(layer, self.equirectMap, false);
                        } else if(layer.productType === "FeaturePoint") {
                            MapUtil.prototype.addPointFeatureToMap(layer, self.equirectMap, layer.layerTitle, false);
                        } else if (layer.productType === "region") {
                            MapUtil.prototype.addRegionLayerToMap(layer, self.equirectMap, false);
                        } else if (layer.productType === "featureLayer") {
                            MapUtil.prototype.addFeatureLayerToMap(layer, self.equirectMap, false);
                            topic.publish(LayerEvent.prototype.ADD_TO_STATIC_LAYERS, {
                                "layer": layer
                            });
                        } else if (layer.productType === "featureGroupLayer") {
                            MapUtil.prototype.addFeatureGroupLayerToMap(layer, self.equirectMap, false);
                            topic.publish(LayerEvent.prototype.ADD_TO_STATIC_LAYERS, {
                                "layer": layer
                            });
                        } else if (layer.productType === "Mosaic") {
                            MapUtil.prototype.addLayerToMap(layer,self.equirectMap, false);
                            topic.publish(LayerEvent.prototype.ADD_TO_STATIC_LAYERS, {
                                "layer": layer
                            });
                        }
                    }


                    if (i != 0)
                        topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": layer});
                }

                for(var i=0; i < this.layerSingleton.northLayerList.length; i++) {
                    var layer = this.layerSingleton.northLayerList[i];
                    if(layer.productType === "FeatureLabel" && layer.layerTitle === "Nomenclature") {
                        MapUtil.prototype.addNomenclatureToMap(layer, self.northPoleMap, true);

                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "region") {
                        MapUtil.prototype.addRegionLayerToMap(layer, self.northPoleMap, true);

                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "featureLayer") {
                        MapUtil.prototype.addFeatureLayerToMap(layer, self.northPoleMap, false);

                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "imagery") {
                        MapUtil.prototype.addLayerToMap(layer,self.northPoleMap, false);
                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    }

                    if (i != 0)
                        topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": layer});
                }

                for(var i=0; i < this.layerSingleton.southLayerList.length; i++) {
                    var layer = this.layerSingleton.southLayerList[i];
                    if(layer.productType === "FeatureLabel" && layer.layerTitle === "Nomenclature") {
                        MapUtil.prototype.addNomenclatureToMap(layer, self.southPoleMap, true);
                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "region") {
                        MapUtil.prototype.addRegionLayerToMap(layer, self.southPoleMap, true);

                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "featureLayer") {
                        MapUtil.prototype.addFeatureLayerToMap(layer, self.southPoleMap, false);

                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    } else if (layer.productType === "imagery") {
                        MapUtil.prototype.addLayerToMap(layer,self.southPoleMap, false);
                        topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                            productLabel: layer.productLabel,
                            projection: layer.layerProjection,
                            thumbnailURL: layer.thumbnailImage
                        });
                    }

                    if (i != 0)
                        topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": layer});
                }

                //setup the catalog
                topic.publish(LayerEvent.prototype.SET_UP_CATALOG_DATA, {});
                //force the map to start in equirect
                topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: this.config.projection.EQUIRECT});

                //starts with globe
                if (this.config.startsWithGlobe)
                    topic.publish(MapEvent.prototype.VIEW_3D, {});

                //topic.subscribe(MapEvent.prototype.VIEW_3D, lang.hitch(this, this.view3DEnabled));
            }
            */
        },

        setupMinimap: function(map) {
            this.overviewMapDijit = new OverviewMap({
                id: "minimapEqui",
                map: map,
                color: "#FF0000",
                //baseLayer: bmlayer,
                expandFactor: 20,
                width: 300,
                height: 150
            }, "overviewMapContainer");
            this.overviewMapDijit.startup();
            this.overviewMapDijit.show();
            this.overviewMapDijit.resize({"h":150, "w":300});
            domStyle.set("minimapEqui", "display", "none");
        },

        mapClicked: function(){
            topic.publish(MapEvent.prototype.MAP_CLICKED, null);
        },

        minimapClicked: function() {
            domStyle.set("minimapEqui", "display", "none");
            topic.publish(MapEvent.prototype.MINIMAP_CLICKED, null);
        },

        getCurrentMap: function() {
            var map;

            if(this.currentMapProjection === this.config.projection.EQUIRECT) {
                map = this.equirectMap;
            } else if(this.currentMapProjection === this.config.projection.N_POLE) {
                map = this.northPoleMap;
            } else if(this.currentMapProjection === this.config.projection.S_POLE) {
                map = this.southPoleMap;
            }

            return map;
        },

        centerMap: function(evt) {
            var map = this.getCurrentMap();
            MapUtil.prototype.centerMapAt(map, evt.x, evt.y);
        },

        centerAndZoomMap: function(evt) {
            var map = this.getCurrentMap();
            var self = this;
            MapUtil.prototype.centerAndZoomMapAt(map, evt.x, evt.y, evt.zoom);
            //MapUtil.prototype.centerMapAt(map, evt.x, evt.y);
        },

        setMapExtent: function(evt) {
            var layerProjectionMap = this.equirectMap;
            if(evt.extent.projection === this.config.projection.N_POLE)
                layerProjectionMap = this.northPoleMap;
            if (evt.extent.projection === this.config.projection.S_POLE)
                layerProjectionMap = this.southPoleMap;

            MapUtil.prototype.setMapExtent(evt.extent.xmin, evt.extent.ymin, evt.extent.xmax, evt.extent.ymax, layerProjectionMap);
        },

        disableMap: function() {
            this.visible = false;
            //this.overviewMapDijit.resize({"h":150, "w":300});
            //domStyle.set("minimapEqui", "display", "block");
            domStyle.set('overviewMapClickContainer', "display", "block" );
        },

        enableMap: function() {
            this.visible = true;
            //this.overviewMapDijit.resize({"h":150, "w":300});
            //domStyle.set("minimapEqui", "display", "none");
            domStyle.set('overviewMapClickContainer', "display", "none" );
        },

        showInfoWindow: function(evt) {
            var map = this.getCurrentMap();

            xhr(evt.contentURL)
            .then(function(content) {
                //if (evt.replaceFrom != undefined) {
                //    //this should be replaceAll..but since there are only two calling twice for now.
                //    content = content.replace(evt.replaceFrom, evt.replaceTo);
                //    content = content.replace(evt.replaceFrom, evt.replaceTo);
                //}
                map.infoWindow.setTitle(evt.title);
                map.infoWindow.setContent(content);
                map.infoWindow.resize(400, 400);
                map.infoWindow.show(evt.geometry, map.getInfoWindowAnchor(evt.screenPoint));
                map.infoWindow._contentPane.scrollTop = 0;

            }, function(err) {
                throw new Error("Could not get content: " + err);
            });
        },

        moveMap: function(evt){
            var extent;
            if(evt.projection === this.config.projection.EQUIRECT){
                extent = this.equirectMap.extent;
            }else if (evt.projection === this.config.projection.N_POLE){
                extent = this.northPoleMap.extent;
            }else if (evt.projection === this.config.projection.S_POLE){
                extent = this.southPoleMap.extent;
            }else{
            }

            if(extent){
                topic.publish(MapEvent.prototype.MAP_MOVED, {
                    extent: extent,
                    projection: this.currentMapProjection,
                    zoom: this.currentMap().getZoom()
                });
            }
        },

        toggleAutoLayers: function(evt){
            var eqMap = this.equirectMap;
            var npMap = this.northPoleMap;
            var spMap = this.southPoleMap;
            var currentMap = this.currentMap();
            var projectionId = this.currentMapProjection;
            this.autoLayerManager.toggleAutoLayers({
                "useAutoLayers":evt.useAutoLayers,
                "eqMap": eqMap,
                "npMap": npMap,
                "spMap": spMap,
                "currentMap": currentMap,
                "currentProjectionId": projectionId
            });
        },

        toggleAutoLayerSection: function(evt){
            this.autoLayerManager.toggleAutoLayerSection({
                "isOn": evt.isOn,
                "projection": evt.projection,
                "name": evt.name,
                "eqMap": this.equirectMap,
                "npMap": this.northPoleMap,
                "spMap": this.southPoleMap,
                "currentMap": this.currentMap(),
                "currentProjectionId": this.currentMapProjection
            })
        },

        toggleAutoLayerFootPrintLayer: function(evt){
            this.autoLayerManager.toggleAutoLayerSectionFootPrintLayer({
                "isOn": evt.isOn,
                "projection": evt.projection,
                "name": evt.name,
                "eqMap": this.equirectMap,
                "npMap": this.northPoleMap,
                "spMap": this.southPoleMap,
                "currentMap": this.currentMap(),
                "currentProjectionId": this.currentMapProjection
            })
        },

        orderLayers: function(evt) {
            this.placeStaticLayersOnTop(this.getCurrentMap());
        },

        placeStaticLayersOnTop: function(map){
            var staticLayers = [];
            if(map === this.equirectMap){
                staticLayers = this.layerSingleton.centerLayerList;
            }
            if(map === this.northPoleMap){
                staticLayers = this.layerSingleton.northLayerList;
            }
            if(map === this.southPoleMap){
                staticLayers = this.layerSingleton.southLayerList;
            }

            var mosaicLayerList = [];
            for(var i = 0; i < staticLayers.length; i++){
                if(staticLayers[i].services){
                    if(staticLayers[i].services.length === 1){
                        if(staticLayers[i].services[0].serviceType === "Mosaic"){
                            mosaicLayerList.push(staticLayers[i].productLabel);
                        }
                    }
                }
            }
            var mapLayerList = map.layerIds;
            var newLayerList = [];
            for(var i = 0; i < mapLayerList.length; i++){
                if(mosaicLayerList.indexOf(mapLayerList[i]) > -1){
                }
                else{
                    newLayerList.push(mapLayerList[i]);
                }
            }
            for(var i = 0; i < mosaicLayerList.length; i++){
                newLayerList.push(mosaicLayerList[i]);
            }

            MapUtil.prototype.reorderLayers(newLayerList, map);

            //now, make a list for cesium
            var completeLayerList = newLayerList.concat(map.graphicsLayerIds);


            topic.publish(LayerEvent.prototype.REORDER_LAYERS, {"layerList": completeLayerList, "projection": this.currentMapProjection});
        }
    });
});
