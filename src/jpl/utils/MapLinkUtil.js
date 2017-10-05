define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/hash",
	"dojo/io-query",
	"dojo/topic",
    "dojo/has",
    "dojo/request/xhr",
    "dijit/registry",
	"jpl/data/Layers",
    "jpl/config/Config",
	"jpl/events/LayerEvent",
	"jpl/events/MapEvent",
    "jpl/utils/IndexerUtil",
    "jpl/events/BrowserEvent",
    "jpl/utils/MakeSingletonUtil",
    "jpl/utils/MapUtil",
    "jpl/events/BookmarkEvent",
    "jpl/data/Bookmarks"
], function (declare, lang, array, hash, ioQuery, topic, has, xhr, registry, Layers, Config, LayerEvent, MapEvent, IndexerUtil, BrowserEvent, MakeSingletonUtil, MapUtil, BookmarkEvent, Bookmarks) {
	return MakeSingletonUtil(
		declare(null, {
			mapstate: {
				v: "0.1", // version of the state object
                x: "", //x position in local projection
                y: "", //y position in local projection
                z: "", //(z)oom
                p: "", //(p)rojection
                d: "", //format: YYYY-MM-DD-HHMM
				l: [] //layer - [[0]productLabel, [1]visible, [2]opacity]
			},
            fullyrestored: false,
            mapsLoadedCount: 0,
            layersLoadedCount: 0,
            mapMoveCount: 0,
            mapLinkLoaded: false,
            bookmarksLoaded: false,
            bookmarkToBeLoaded: "",
            isInIframe: false,
            isCentered: true,
            acceptingLinkChanges: false,
			constructor: function () {
				try {
                    //Check for valid query
					var query = ioQuery.queryToObject(hash());
                    if (!query || typeof query !== "object") {
                        throw "URL permalink query object is invalid or not found";
                    }

                    this.config = Config.getInstance();
                    this.indexerUtil = new IndexerUtil();
                    this.mapDijit = registry.byId("mainSearchMap");
                    this.loadmapstate = query;
                    this.totalMapCount = Object.keys(this.config.projection).length - 1;
                    this.totalLayersCount = 0;

                    if(query.l) {
                        this.totalLayersCount = query.l.length;
                    }
				} catch(err) {
                    console.log(err);
				}

				topic.subscribe(MapEvent.prototype.MAP_MOVED, lang.hitch(this, this.mapMoved));
				topic.subscribe(MapEvent.prototype.MAP_READY, lang.hitch(this, this.mapReady));
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));

                topic.subscribe(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.LAYER_HIDDEN, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.LAYER_SHOWN, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_LAYER_VIEWER, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.REORDER_LAYERS, lang.hitch(this, this.updateWithCurrentLayers));
                topic.subscribe(LayerEvent.prototype.OPACITY_CHANGED, lang.hitch(this, this.updateWithCurrentLayers));


                // topic.subscribe(BookmarkEvent.prototype.BOOKMARKS_LOADED, lang.hitch(this, this.bookmarksLoaded));




                //Layers can't be selected until that specific layer control has been loaded.
                //topic.subscribe(LayerEvent.prototype.LAYER_CONTROL_LOADED, lang.hitch(this, this.layerReady));
                //topic.subscribe(LayerEvent.prototype.SHOW_LAYER, lang.hitch(this, this.showLayer));
                //topic.subscribe(LayerEvent.prototype.HIDE_LAYER, lang.hitch(this, this.hideLayer));
                //topic.subscribe(LayerEvent.prototype.OPACITY_CHANGED, lang.hitch(this, this.changeLayerOpacity));
                //topic.subscribe(LayerEvent.prototype.REMOVE_FROM_MY_DATA, lang.hitch(this, this.removeLayer));
                //topic.subscribe(LayerEvent.prototype.REORDER_LAYERS, lang.hitch(this, this.reorderLayers));
                //topic.subscribe(BookmarkEvent.prototype.BOOKMARK_ADDED, lang.hitch(this, this.bookmarkAdded));
                //topic.subscribe(BookmarkEvent.prototype.BOOKMARK_REMOVED, lang.hitch(this, this.bookmarkRemoved));



                if(has("config-control-bookmarks")) {
                    this.bookmarksInstance = Bookmarks.getInstance();
                }


			},

            //currently loads +2 for maps(mapmove) then +1 for 3d (projection change)
            //then does 3 more for maps

            mapReady: function(evt) {
                /*console.log("mapReady mapsLoadedCount:" + this.mapsLoadedCount + " layersLoadedCount:" + this.layersLoadedCount, "totalMapCount:" + this.totalMapCount);
                this.mapsLoadedCount++;
                if(this.mapsLoadedCount >= this.totalMapCount && this.layersLoadedCount >= this.totalMapCount && !this.mapLinkLoaded) {
                    this.loadMapLink(evt);
                }
                */
                console.log("mapReady mapsLoadedCount:" + this.mapsLoadedCount + " layersLoadedCount:" + this.layersLoadedCount, "totalMapCount:" + this.totalMapCount);
                this.mapsLoadedCount++;
                if(this.mapsLoadedCount > this.totalMapCount && !this.mapLinkLoaded) {
                    this.loadMapLink(evt);
                }

            },


            layerReady: function(evt) {
                console.log("layerReady", evt);
                /*
                this.layersLoadedCount++;
                if(this.mapsLoadedCount >= this.totalMapCount && this.layersLoadedCount >= this.totalMapCount * 2 && !this.mapLinkLoaded) {
                    this.acceptingLinkChanges = true;
                    this.loadMapLink(evt);
                }
                */
            },

			loadMapLink: function (evt) {
                //all maps and layers have been loaded, make sure there is a hash
                if(Object.keys(this.loadmapstate).length > 0) {
                    //there was some sort of hash in the url, validate it
                    if(this.loadmapstate.hasOwnProperty("v") && this.isLinkVersionValid(this.loadmapstate.v, this.config.permalinkVersions)) {
                        //add additional cases when new permalink versions are added
                        switch(this.loadmapstate.v) {
                            case "0.1":
                                if(!this.mapLinkLoaded){
                                    this.mapLinkLoaded = true;
                                    this._loadMapLinkV0_1(evt, this.loadmapstate);

                                }
                                break;
                        }
                    } else {
                        //invalid hash version, set empty mapstate and show error message to user
                        topic.publish(MapEvent.prototype.MAPLINK_LOADED, {mapstate: null});
                        topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                            title: "Unable to Load Permalink",
                            content: "The URL provided has invalid data and is unable to be processed. The URL is now reset.",
                            size: "sm"
                        });
                    }
                } else {
                    //no hash present, just set mapstate to null
                    topic.publish(MapEvent.prototype.MAPLINK_LOADED, {mapstate: null});
                }

                //set to true so map can start updating url when moved
                this.fullyrestored = true;
			},

            bookmarksLoaded: function(evt) {
                this.bookmarksLoaded = true;
                this.loadBookmark();
            },

            isLinkVersionValid: function(version, validVersions) {
                var versionIndex = array.indexOf(validVersions, version);
                if(versionIndex === -1) {
                    return false;
                } else {
                    return true;
                }
            },

            isProjectionValid: function(projection, validProjections, config) {
                //validation for projection
                for(var i=0; i < validProjections.length; i++) {
                    if(config.projection[validProjections[i]] === projection) {
                        //projection is valid
                        return true;
                    }

                    if(i === validProjections.length) {
                        return false;
                    }
                }

                return false;
            },

            isCoordinatesValid: function(x, y, projection) {
                if(!isNaN(x) || !isNaN(y)) {
                    //x and y are numbers, verify they are within the extent of the projection
                    var extent = MapUtil.prototype.getInitialExtent(projection);

                    if(extent &&
                        Number(extent.xmin) <= Number(x) && Number(extent.xmax) >= Number(x) &&
                        Number(extent.ymin) <= Number(y) && Number(extent.ymax) >= Number(y)) {
                        return true;
                    }
                }

                return false;
            },

            isZoomLevelValid: function(zoomLevel, projection) {
                //TODO: need to validate zoom level is within range of projection

                if(!isNaN(zoomLevel)) {
                    return true;
                }

                return false;
            },

			_loadMapLinkV0_1: function (evt, mapstate) {
                var self = this;
                var layersSingleton = Layers.getInstance(),
                    configSingleton = Config.getInstance(),
                    availableProjections = Object.keys(configSingleton.projection);

                var errorThrown = false;
                try {
                    var hasAllProperties = true;
                    //Check that all necessary parameters exist
                    if(!mapstate.hasOwnProperty("x")){
                        hasAllProperties = false;
                        throw "Invalid coordinates"
                    }
                    else if(!mapstate.hasOwnProperty("y") && hasAllProperties){
                        hasAllProperties = false;
                        throw "Invalid coordinates";
                    }
                    else if(!mapstate.hasOwnProperty("z") && hasAllProperties){
                        hasAllProperties = false;
                        throw "URL permalink query object is invalid or not found";
                    }
                    else if(!mapstate.hasOwnProperty("p") && hasAllProperties){
                        hasAllProperties = false;
                        throw "Invalid projection";
                    }
                    else{}

                    if(!hasAllProperties)
                        errorThrown = true;

                    if(!errorThrown){
                        //validation for coordinates
                        if(!this.isCoordinatesValid(mapstate.x, mapstate.y, mapstate.p)) {
                            throw "Invalid coordinates";
                        }

                        //validation for zoom level
                        if(!this.isZoomLevelValid(mapstate.z, mapstate.p)) {
                            throw "Invalid zoom level";
                        }

                        //validation for projection
                        if(!this.isProjectionValid(mapstate.p, availableProjections, configSingleton)) {
                            throw "Invalid projection";
                        }
                    }

                } catch (err) {
                    errorThrown = true;
                    topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                        title: "Unable to Load Permalink",
                        content: "The URL provided has invalid data and is unable to be processed: " + err,
                        size: "sm"
                    });
                }

                if(!errorThrown){
                    /*
                    console.log("!errorThrown");
                    //Check for valid layers states
                    if (mapstate.ec == undefined)
                    {
                        console.log("mapstate.ec == undefined");
                        if (mapstate.l) {
                            console.log("mapstate.l");
                            try {
                                var layers = typeof mapstate.l === "string" ? [mapstate.l] : mapstate.l;

                                var i = 0;
                                var self = this;
                                array.forEach(layers, function (layerState) {
                                    //break up each layer into its parts: [0]-product label, [1]-visible, [2]-opacity
                                    layerState = layerState.split(",");

                                    //get the layer from its product label in the url
                                    console.log("getlayer from productLabel");
                                    var layer = layersSingleton.getLayerByProductLabel(layerState[0]);
                                    console.log("permalink add layer", layer);
                                    if (!layer) {
                                        throw "Layer specified doesn't exist";
                                    }

                                    var addLayer = false;
                                    if(layer.productType === "FeatureWaypoints" ||
                                        layer.productType === "FeatureLinks" ||
                                        layer.productType === "Feature") {
                                        if (layer.layerTitle === "Nomenclature" ||
                                            layer.layerTitle === "Graticule" ||
                                            layer.layerTitle === "Regions" ||
                                            layer.layerTitle === "Quadrangles Regions")
                                            addLayer = true;
                                        else
                                            addLayer = false;
                                    } else {
                                        addLayer = true;
                                    }

                                    if (addLayer) {

                                        if (i >= self.totalMapCount * 2) {
                                            //determine if we should show or hide the layer if indicated in url
                                            var isShow = true;
                                            if (layerState[1] === "true") {
                                                isShow = true;
                                            } else if (layerState[1] === "false") {
                                                isShow = false;
                                            }

                                            topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                                                "productLabel": layer.productLabel,
                                                "thumbnailURL": layer.thumbnailImage,
                                                "projection": layer.layerProjection,
                                                "show": isShow
                                            });
                                        } else {
                                            //determine if we should show or hide the layer if indicated in url
                                            if (layerState[1] === "true") {
                                                topic.publish(LayerEvent.prototype.SHOW_LAYER, {layer: layer});
                                            } else if (layerState[1] === "false") {
                                                topic.publish(LayerEvent.prototype.HIDE_LAYER, {layer: layer});
                                            }
                                        }


                                        //determine the transparency of layer if indicated in url
                                        if (!isNaN(layerState[2])) {
                                            console.log('changing opacity...')
                                            topic.publish(LayerEvent.prototype.CHANGE_OPACITY, {
                                                layer: layer,
                                                opacity: layerState[2]
                                            });
                                        } else if (layerState[2] && isNaN(layerState[2])) {
                                            throw "Layer opacity must be a numeric value"
                                        }
                                    }
                                    i++;
                                })
                            } catch (err) {
                                console.log("unable to load layers from URL: " + err);
                            }
                        }

                        var centeredListen = topic.subscribe(MapEvent.prototype.CENTERED_ZOOM_MAP_AT, lang.hitch(this, function() {
                            centeredListen.remove();
                            self.isCentered = true;
                        }));

                        this.isCentered = false;

                        //topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: mapstate.p});
                        topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {projection: mapstate.p});

                        topic.publish(MapEvent.prototype.CENTER_ZOOM_MAP_AT, {
                            x: mapstate.x,
                            y: mapstate.y,
                            zoom: mapstate.z,
                            projection: mapstate.p
                        });
                        topic.publish(MapEvent.prototype.MAPLINK_LOADED, {mapstate: mapstate});
                        */
                    console.log("!errorThrown");
                    //Check for valid layers states
                    if (mapstate.ec == undefined)
                    {
                        if (mapstate.sl) {
                            var staticlayers = typeof mapstate.sl === "string" ? [mapstate.sl] : mapstate.sl;

                            var layersInstance = Layers.getInstance();
                            var staticLayers = [];
                            if(mapstate.p === this.config.projection.N_POLE) {
                                staticLayers = layersInstance.northLayerList;
                            } else if (mapstate.p === this.config.projection.S_POLE) {
                                staticLayers = layersInstance.southLayerList;
                            } else {
                                staticLayers = layersInstance.centerLayerList;
                            }

                            array.forEach(staticlayers, function (layerId) {
                               for (var j=0; j < staticLayers.length; j++) {
                                   if (staticLayers[j].productLabel === layerId) {
                                       topic.publish(LayerEvent.prototype.SHOW_LAYER, { layer: staticLayers[j] });
                                       break;
                                   }
                               }

                            });

                        }

                        if (mapstate.l) {
                            try {
                                var layers = typeof mapstate.l === "string" ? [mapstate.l] : mapstate.l;

                                var i = 0;
                                var self = this;
                                array.forEach(layers, function (layerState) {
                                    //break up each layer into its parts: [0]-product label, [1]-visible, [2]-opacity
                                    layerState = layerState.split(",");

                                    //NEED TO RETHINK MAPLINK:
                                    //MAYBE SHOULD ADD LAYER PROJECTION FOR EACH LAYER
                                    //CURRENT WORK AROUND IS TO CHECK BOTH POLE AND EQ SERVICES
                                    console.log("CONFIG ADD LAYER", self.config);
                                    var searchUrl = self.indexerUtil.createGetItemUrl({
                                        //"projection": mapstate.p,
                                        "projection": self.config.data.projections.equirect,
                                        "productLabel": layerState[0]
                                    });

                                    xhr(searchUrl, {
                                        handleAs: "json",
                                        headers: {
                                            "X-Requested-With": null
                                        }
                                    }).then(function (itemInfo) {
                                        var item = itemInfo.response.docs[0];
                                        console.log("EQUI ITEM", item);

                                        if(item) {
                                            console.log("equirect item found");
                                            searchUrl = self.indexerUtil.createLayerServicesUrl(item.item_UUID);

                                            xhr(searchUrl, {
                                                handleAs: "json",
                                                headers: {
                                                    "X-Requested-With": null
                                                }
                                            }).then(function (layerServiceInfo) {
                                                var layerService = layerServiceInfo.response.docs[0];

                                                var layer = self.indexerUtil.createLayer(itemInfo, layerServiceInfo);

                                                self.addLayerToMap(layer, "true" === layerState[1], layerState[2]);

                                            });
                                        }
                                        else{
                                            console.log("equirect item not found");
                                            console.log("looking in polar");

                                            var searchUrl = self.indexerUtil.createGetItemUrl({
                                                //"projection": mapstate.p,
                                                "projection": self.config.data.projections.northpole,
                                                "productLabel": layerState[0]
                                            });
                                            xhr(searchUrl, {
                                                handleAs: "json",
                                                headers: {
                                                    "X-Requested-With": null
                                                }
                                            }).then(function (itemInfo) {
                                                var item = itemInfo.response.docs[0];
                                                console.log("POLAR ITEM", item);

                                                if (item != undefined && item.item_UUID) {
                                                    searchUrl = self.indexerUtil.createLayerServicesUrl(item.item_UUID);

                                                    xhr(searchUrl, {
                                                        handleAs: "json",
                                                        headers: {
                                                            "X-Requested-With": null
                                                        }
                                                    }).then(function (layerServiceInfo) {
                                                        var layerService = layerServiceInfo.response.docs[0];

                                                        var layer = self.indexerUtil.createLayer(itemInfo, layerServiceInfo);

                                                        self.addLayerToMap(layer, "true" === layerState[1], layerState[2]);

                                                    });
                                                }
                                            });
                                        }
                                    });
                                })
                            } catch (err) {
                                console.log("unable to load layers from URL: " + err);
                            }
                        }

                        var centeredListen = topic.subscribe(MapEvent.prototype.CENTERED_ZOOM_MAP_AT, lang.hitch(this, function() {
                            centeredListen.remove();
                            self.isCentered = true;
                        }));

                        this.isCentered = false;

                        //topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: mapstate.p});
                        topic.publish(MapEvent.prototype.PROJECTION_CHANGED, {projection: mapstate.p});

                        topic.publish(MapEvent.prototype.CENTER_ZOOM_MAP_AT, {
                            x: mapstate.x,
                            y: mapstate.y,
                            zoom: mapstate.z,
                            projection: mapstate.p
                        });
                        topic.publish(LayerEvent.prototype.REORDER_LAYERS_REQUST, { });
                        topic.publish(MapEvent.prototype.MAPLINK_LOADED, {mapstate: mapstate});

                    } else {
                        //the request is coming from Exeprience Curiosity
                        this.bookmarkToBeLoaded = mapstate.bk;
                        this.loadBookmark();
                    }

                }
			},

            loadBookmark: function () {
                var self = this;
                if (this.bookmarksLoaded && this.bookmarkToBeLoaded != "") {
                    var subscribe = topic.subscribe(BookmarkEvent.prototype.BOOKMARK_LAYERS_ADDED, function() {
                        subscribe.remove();
                        var centeredListen = topic.subscribe(MapEvent.prototype.CENTERED_ZOOM_MAP_AT, lang.hitch(this, function() {
                            centeredListen.remove();
                            self.isCentered = true;
                        }));

                        topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: self.loadmapstate.p});
                        this.isCentered = false;

                        topic.publish(MapEvent.prototype.CENTER_ZOOM_MAP_AT, {
                            x: self.loadmapstate.x,
                            y: self.loadmapstate.y,
                            zoom: self.loadmapstate.z,
                            projection: self.loadmapstate.p
                        });
                        topic.publish(MapEvent.prototype.MAPLINK_LOADED, {mapstate: self.loadmapstate});


                    });


                    for (var i = 0; i < this.bookmarksInstance.bookmarkList.length; i++) {
                        if (this.bookmarksInstance.bookmarkList[i].name == this.bookmarkToBeLoaded) {
                            topic.publish(BookmarkEvent.prototype.LOAD_BOOKMARK, {bookmark: this.bookmarksInstance.bookmarkList[i]});
                            break;
                        }
                    }
                }
            },

            mapMoved: function (evt) {
                    this.mapMoveCount++;

                //if (this.mapMoveCount > (this.totalMapCount + 1)) {
                    this.mapstate.x = parseFloat(evt.extent.getCenter().x);
                    this.mapstate.y = parseFloat(evt.extent.getCenter().y);
                    this.mapstate.z = evt.zoom;
                    this.mapstate.p = evt.projection;

                    this.publishMapState();
                //}
			},

            bookmarkAdded: function (evt) {
                //Workaroudn EC intergration
                if (evt.bookmark.name == "Curiosity Landing Site") {
                    this.mapstate.bk = evt.bookmark.name;
                    //this.publishMapState();
                }
            },

            bookmarkRemoved: function (evt) {
                if (evt.bookmark.name == "Curiosity Landing Site") {
                    this.mapstate.bk = "";
                    this.publishMapState();
                }
            },

            projectionChanged: function(evt) {
                //clear the hash since all of the url params will need to be updated
                //hash('');

                //TODO: put in call to mapMoved function that happens after projection is completed
                //On projection changed SearchMap.projectionChanged calls mapMoved.
            },

            updateWithCurrentLayers: function(evt) {
                if(!this.fullyrestored || !this.isCentered) {
                    //not ready
                    return;
                }

                var layerProjection;
                if (evt.layer)
                    layerProjection = evt.layer.layerProjection;
                else
                    layerProjection = evt.projection;

                if (this.mapDijit.currentMapProjection != layerProjection ) {
                    //if adding layer not in current projection, ignore.
                    return;
                }
                var layersInstance = Layers.getInstance();

                var map;
                //hack for now
                if (layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if (layerProjection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                } else {
                    map = this.mapDijit.equirectMap;
                }

                var staticLayers = [];
                if(map === this.mapDijit.equirectMap){
                    staticLayers = layersInstance.centerLayerList;
                }
                if(map === this.mapDijit.northPoleMap){
                    staticLayers = layersInstance.northLayerList;
                }
                if(map === this.mapDijit.southPoleMap){
                    staticLayers = layersInstance.southLayerList;
                }

                var mosaicStaticLayerList = [];
                for(var i = 0; i < staticLayers.length; i++){
                    if(staticLayers[i].services){
                        if(staticLayers[i].services.length === 1){
                            if(staticLayers[i].services[0].serviceType === "Mosaic"){
                                mosaicStaticLayerList.push(staticLayers[i].productLabel);
                            }
                        }
                    }
                }

                //need to find out added layers
                var mapLayerList = map.layerIds;
                var addedLayerList = [];
                for(var i = 0; i < mapLayerList.length; i++){
                    if(mosaicStaticLayerList.indexOf(mapLayerList[i]) == -1){
                        addedLayerList.push(mapLayerList[i]);
                    }
                }

                var layers = [];
                for (var j = 1; j < addedLayerList.length; j++) {
                    var layerId = addedLayerList[j];
                    var layerO = map.getLayer(layerId);

                    var layer = [];
                    layer[0] = layerId;
                    layer[1] = layerO.visible;
                    layer[2] = layerO.opacity;

                    layers.push(layer);
                }
                this.mapstate.l = layers;

                //need to find out static layers
                var turnedOnStaticLayers = [];
                for(var i = 0; i < staticLayers.length; i++){
                    var layerO = map.getLayer(staticLayers[i].productLabel);
                    if (layerO !== undefined) {
                        if (layerO.visible)
                            turnedOnStaticLayers.push(staticLayers[i].productLabel);
                    }
                }

                this.mapstate.sl = turnedOnStaticLayers;

                this.publishMapState();
            },

			showLayer: function(evt) {
                if (array.every(this.mapstate.l, function (layer) {
                        return layer[0] !== evt.layer.productLabel;
                    })) {
                    this.mapstate.l.push([evt.layer.productLabel]);
                }
                array.some(this.mapstate.l, function(layer){
                    if (layer[0] === evt.layer.productLabel) {
                        layer[1] = true;
                        return true;
                    }
                });
                this.publishMapState();

			},

			hideLayer: function(evt) {
                if (array.every(this.mapstate.l, function (layer) {
                        return layer[0] !== evt.layer.productLabel;
                    })) {
                    this.mapstate.l.push([evt.layer.productLabel]);
                }
                array.some(this.mapstate.l, function(layer){
                    if (layer[0] === evt.layer.productLabel) {
                        layer[1] = false;
                        return true;
                    }
                });
                this.publishMapState();
			},

			changeLayerOpacity: function(evt) {
                if (array.every(this.mapstate.l, function (layer) {
                        return layer[0] !== evt.layer.productLabel;
                    })) {
                    this.mapstate.l.push([evt.layer.productLabel]);
                }
                array.some(this.mapstate.l, function(layer){
                    if (layer[0] === evt.layer.productLabel) {
                        //Round to 2 decimal places (without trailing zeroes)
                        layer[2] = +(Math.round(evt.opacity + "e+2")  + "e-2");
                        return true;
                    }
                });
                if(!evt.changing) {
                    this.publishMapState();
                }
            },

            removeLayer: function(evt){
                var index = -1;
                for (var i = 0; i < this.mapstate.l.length; i++){
                    if(this.mapstate.l[i][0] === evt.productLabel){
                        index = i;
                    }
                }

                if (index > -1) {
                     this.mapstate.l.splice(index, 1);
                }

                this.publishMapState();
            },

            reorderLayers: function(evt){
                var temp = [];
                for(var j = 0; j < evt.layerList.length; j++){
                    var matchIndex = -1;
                    for (var i = 0; i < this.mapstate.l.length; i++){
                        if(this.mapstate.l[i][0] === evt.layerList[j] && (this.mapstate.l[i][0].indexOf("nomenclature") < 0) && (this.mapstate.l[i][0].indexOf("graticule") < 0)){
                            matchIndex = i;
                        }
                    }

                    if (matchIndex > -1) {
                        temp.push(this.mapstate.l[matchIndex]);
                        this.mapstate.l.splice(matchIndex, 1);
                    }
                }

                for (var tIndex = 0; tIndex < temp.length; tIndex++){
                    this.mapstate.l.push(temp[tIndex]);
                }

                this.publishMapState();
            },

			publishMapState: function(evt) {
                // avoid URL changes until everything's done
                if(this.fullyrestored && this.isCentered) {
                    hash(ioQuery.objectToQuery(this.mapstate), true);
                }
			},

            addLayerToMap: function(layer, isVisible, opacity){

                var map;
                //hack for now
                if (layer.layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if (layer.layerProjection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                } else {
                    map = this.mapDijit.equirectMap;
                }

                MapUtil.prototype.addLayerToMap(layer, map);
                topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":layer});
                topic.publish(LayerEvent.prototype.REORDER_LAYERS_REQUST, { });

                if(!isVisible){
                    topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer":layer});
                }

                if (!isNaN(opacity)) {
                    console.log('changing opacity...');
                    topic.publish(LayerEvent.prototype.CHANGE_OPACITY, {
                        layer: layer,
                        opacity: opacity
                    });
                } else if (opacity && isNaN(opacity)) {
                    throw "Layer opacity must be a numeric value"
                }

            }
		})
    );
});