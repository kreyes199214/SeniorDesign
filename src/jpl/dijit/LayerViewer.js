define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/topic",
    "dojo/request/xhr",
    "dojo/window",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/LayerEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "jpl/config/Config",
    "jpl/data/Layers",
    "jpl/data/BaseMaps",
    "bootstrap/Modal",
    'dojo/text!./templates/LayerViewer.html',
    "xstyle/css!./css/LayerViewer.css"
], function (declare, lang, on, query, topic, xhr, win, dom, domClass, domConstruct, domAttr, registry, _WidgetBase, _TemplatedMixin,
             LayerEvent, LoadingEven, MapEvent, MapUtil, IndexerUtil, Config, Layers, BaseMaps, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        mapDijit: "",
        layerInfo: null,
        sidebar: null,
        backButtonListener: null,
        item: null,
        layerService: null,
        basemapsInstance: null,
        isLegendCollapsed: true,
        pixelListener: null,
        pixelX: 0,
        pixelY: 0,
        timer: false,
        timerFunction: null,

        startup: function() {
            this.mapDijit = registry.byId("mainSearchMap");
            this.indexerUtil = new IndexerUtil();
            this.config = Config.getInstance();
            this.layersInstance = Layers.getInstance();
            this.basemapsInstance = BaseMaps.getInstance();
            this.setContent();

            this.backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
            on(this.addLayerBtn, "click", lang.hitch(this, this.addLayer));
            on(this.removeLayerBtn, "click", lang.hitch(this, this.removeLayer));
            on(this.metadataBtn, "click", lang.hitch(this, this.openMetadata));
            on(this.downloadMetadataBtn, "click", lang.hitch(this, this.downloadMetadata));
            on(this.openLayersMenuNotAddedBtn, "click", lang.hitch(this, this.openLayersSidebar));
            on(this.openLayersMenuAddedBtn, "click", lang.hitch(this, this.openLayersSidebar));
            //on(this.legendToggleBtn, "click", lang.hitch(this, this.toggleLegend));
            on(this.ZoomBtn, "click", lang.hitch(this, this.ZoomBtnClicked));
            topic.subscribe(LayerEvent.prototype.REMOVE_FROM_LAYER_VIEWER, lang.hitch(this, this.setRemoved));

            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeSidebar));

            if(this.layerInfo.title.toLowerCase().includes("opportunity") || this.layerInfo.title.toLowerCase().includes("spirit")){
                domClass.add(this.downloadBtn, "hidden");
            }
            else{
                on(this.downloadBtn, "click", lang.hitch(this, this.downloadLayer));
            }

            if(this.layerInfo.productType === "Mosaic"){
                domClass.add(this.legendTr, "hidden");
            }
            else{
                on(this.legendToggleBtn, "click", lang.hitch(this, this.toggleLegend));

                var self = this;
                this.legendImage.onerror = function () {
                    domClass.add(self.legendTr, "hidden");
                };


                var legendUrl = this.config.services.getLayerLegendUrl;
                legendUrl = legendUrl + this.layerInfo.productLabel;
                console.log("legendUrl", legendUrl);
                domAttr.set(this.legendImage, "src", legendUrl);
                domAttr.set(this.legendImageLink, "href", legendUrl);
            }

            if(this.config.data.showLayerMetadata){
            }
            else{
                domClass.add(this.metadataBtn, "hidden");
                domClass.add(this.downloadMetadataBtn, "hidden");
            }

            this.hideAddRemoveButtonsIfBasemap();
        },

        setLayerInfo: function(layerInfo){
            this.layerInfo = layerInfo;
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.backButtonListener.remove();
            this.cleanUp();
        },

        isBasemap: function(){
            var basemapLabels = this.basemapsInstance.defaultBasemaps;
            var layerProductLabel = this.layerInfo.productLabel;

            return basemapLabels.includes(layerProductLabel);
        },

        setContent: function(){
            var self = this;
            var getItemUrl = this.indexerUtil.createGetItemUrl({
                productLabel:this.layerInfo.productLabel,
                projection:this.layerInfo.dataProjection
            });
            console.log("LayerViewer getItemUrl", getItemUrl);
            xhr(getItemUrl, {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function (data) {
                var visibleLayer = true;
                var showPixelButtons = false;
                self.item = data;
                data = data.response;
                data = data.docs;
                data = data[0];
                var subtitle = "";
                if (data.subtitle)
                    subtitle = data.subtitle;
                if (data.title)
                    self.layerTitle.innerHTML = data.title + ' <small>' + subtitle + '</small>';
                if (data.itemType)
                    self.itemType.innerHTML = data.itemType;
                if (data.productType) {
                    self.productType.innerHTML = data.productType;
                    if(data.productType === "DEM" && data.serviceTypes.indexOf("raster") > -1){
                        visibleLayer = false;
                        showPixelButtons = true;
                    }
                    else if (data.productType == "DEM") {
                        visibleLayer = false;
                        showPixelButtons = false;
                    }
                    else{
                        visibleLayer = true;
                        showPixelButtons = false;
                    }

                    if(showPixelButtons){
                        domClass.remove(self.pixelValueButtons, "hidden");
                        on(self.showPixelValueBtn, "click", lang.hitch(self, self.showPixelValue));
                        on(self.hidePixelValueBtn, "click", lang.hitch(self, self.hidePixelValue));
                    }
                }

                var descriptionUrl = self.config.services.getLayerAbstractUrl;
                descriptionUrl = descriptionUrl + self.layerInfo.productLabel;
                console.log("layer info url", descriptionUrl);

                xhr(descriptionUrl, {
                    handleAs: "html",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (description) {
                    self.description.innerHTML = description;
                }, function (err) {
                    console.log("error retrieving layer description:" + err);
                });

                var map = null;
                //hack for now
                if (self.layerInfo.dataProjection === self.config.projection.N_POLE) {
                    map = self.mapDijit.northPoleMap;
                } else if (self.layerInfo.dataProjection === self.config.projection.S_POLE) {
                    map = self.mapDijit.southPoleMap;
                } else {
                    map = self.mapDijit.equirectMap;
                }

                var isAdded = false;
                for (var i = 0; i < map.layerIds.length; i++) {
                    if (map.layerIds[i] === self.layerInfo.productLabel) {
                        isAdded = true;
                    }
                }

                if (visibleLayer) {
                    domAttr.set(self.layerImage, "src", self.indexerUtil.createThumbnailUrl(data.thumbnailURLDir, "200"));
                    if (isAdded) {
                        domClass.add(self.addLayerBtn, "hidden");
                        domClass.remove(self.removeLayerBtn, "hidden");
                        domClass.remove(self.openLayersMenuAddedBtn, "hidden");
                        domClass.add(self.openLayersMenuNotAddedBtn, "hidden");
                    } else {
                        domClass.remove(self.addLayerBtn, "hidden");
                        domClass.add(self.removeLayerBtn, "hidden");
                        domClass.add(self.openLayersMenuAddedBtn, "hidden");
                        domClass.remove(self.openLayersMenuNotAddedBtn, "hidden");
                    }
                } else {
                    domClass.add(self.layerImage, "hidden");
                    domClass.add(self.addLayerBtn, "hidden");
                    domClass.remove(self.openLayersMenuNotAddedBtn, "hidden");
                    domClass.add(self.openLayersMenuAddedBtn, "hidden");
                    domClass.add(self.openLayersMenuNotAddedBtn, "hidden");

                    var polygonString = data.shape;
                    var beginIndex = self.indexOfInString(polygonString, "(", 2);
                    var endIndex = self.indexOfInString(polygonString, ")", 1);
                    polygonString = polygonString.slice(beginIndex + 1, endIndex);

                    var rawRings = polygonString.split(",");

                    var midRing = [];
                    for (var i = 0; i < rawRings.length; i++) {
                        var innerRing = [];
                        var x = rawRings[i].trim().split(" ")[0];
                        var y = rawRings[i].trim().split(" ")[1];
                        innerRing.push(x);
                        innerRing.push(y);
                        midRing.push(innerRing);
                    }
                    var rings = [];
                    rings.push(midRing);

                    var map = self.getMap(data.dataProjection);
                    var polygonJson = {"rings": rings, "spatialReference": map.spatialReference};

                    self.addGraphic(polygonJson, data.dataProjection);
                }

                self.hideAddRemoveButtonsIfBasemap();

            }, function (err) {
                console.log("error retrieving layer description:" + err);
            });

        },

        addGraphic: function(polygonJson, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPolygon(polygonJson, map);

            map.graphics.add(this.graphicPoint);
            map.setExtent(this.graphicPoint._extent);
        },

        removeGraphic: function(projection) {
            if(this.graphicPoint) {
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        addLayer: function(evt){
            var self = this;
            if(self.item) {
                xhr(this.indexerUtil.createLayerServicesUrl(self.item.response.docs[0].item_UUID), {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function (data) {
                    self.layerService = data;

                    var map = null,
                        layerOutline = null,
                        newLayerId = "myLayer_" + evt.productLabel,
                        layer = self.indexerUtil.createLayer(self.item, self.layerService);

                    //if the layer is not found in the layer list, do not add
                    if (layer == null)
                        return;

                    map = self.getMap(layer.layerProjection);
                    // //hack for now
                    // if (layer.layerProjection === self.config.projection.N_POLE) {
                    //     map = self.mapDijit.northPoleMap;
                    // } else if (layer.layerProjection === self.config.projection.S_POLE) {
                    //     map = self.mapDijit.southPoleMap;
                    // } else {
                    //     map = self.mapDijit.equirectMap;
                    // }

                    //for now, don't exclude any type..just  load all.

                    MapUtil.prototype.addLayerToMap(layer, map);
                    topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":layer});
                    topic.publish(LayerEvent.prototype.REORDER_LAYERS_REQUST, { });



                    // if (layer.productType === "DEM") {
                    //     layerOutline = MapUtil.prototype.createLayerPolygon(layer, this.mapDijit.equirectMap, evt.productLabel);
                    //     topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":layer});
                    // } else if (layer.productType === "Mosaic" ||
                    //     layer.productType === "Feature" ||
                    //     layer.productType === "FeatureLabel" ||
                    //     layer.productType === "FeatureRegions" ||
                    //     layer.productType === "FeatureWaypoints" ||
                    //     layer.productType === "FeatureLinks" ||
                    //     layer.productType === "FeatureGraticule" ||
                    //     layer.productType === "imagery" ||
                    //     layer.productType === "region") {
                    //     MapUtil.prototype.addLayerToMap(layer, map);
                    //     topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":layer});
                    // }


                    //THIS SECTION WILL ZOOM TO LAYER EXTENT
                    /*var extent = {
                        "xmin": layer.boundingBox.west,
                        "ymin": layer.boundingBox.south,
                        "xmax": layer.boundingBox.east,
                        "ymax": layer.boundingBox.north,
                        "projection": layer.layerProjection
                    };
                    topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});
                    topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                        "xmin": extent.xmin,
                        "xmax": extent.xmax,
                        "ymin": extent.ymin,
                        "ymax": extent.ymax
                    });*/

                    domClass.add(self.addLayerBtn, "hidden");
                    domClass.remove(self.removeLayerBtn, "hidden");
                    domClass.add(self.openLayersMenuNotAddedBtn, "hidden");
                    domClass.remove(self.openLayersMenuAddedBtn, "hidden");

                }, function (err) {
                    console.log("error retrieving layer description:" + err);
                });

            }
        },

        removeLayer: function(){
            var map = null;
            //hack for now
            if (this.layerInfo.dataProjection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if (this.layerInfo.dataProjection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            } else {
                map = this.mapDijit.equirectMap;
            }

            MapUtil.prototype.removeLayerFromMap(this.layerInfo.productLabel, map);
            topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
                "productLabel":this.layerInfo.productLabel,
                "projection": this.layerInfo.dataProjection
            });

            domClass.remove(this.addLayerBtn, "hidden");
            domClass.add(this.removeLayerBtn, "hidden");
            domClass.remove(this.openLayersMenuNotAddedBtn, "hidden");
            domClass.add(this.openLayersMenuAddedBtn, "hidden");
        },

        getMap: function(projection) {
            var map;
            if(projection === this.config.projection.EQUIRECT) {
                map = this.mapDijit.equirectMap;
            } else if(projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        },

        setRemoved: function(evt){
            if(this.layerInfo.productLabel === evt.productLabel){
                domClass.remove(this.addLayerBtn, "hidden");
                domClass.add(this.removeLayerBtn, "hidden");
                domClass.remove(this.openLayersMenuNotAddedBtn, "hidden");
                domClass.add(this.openLayersMenuAddedBtn, "hidden");
            }
        },

        downloadLayer: function(){
            var url = this.config.services.getLayerDataUrl;
            url = url + this.layerInfo.productLabel;

            console.log("downloadLayer url", url);
            var downloadFrame = dom.byId("layerDownloadFrame");

            stlDownloadFrame.src = url;
        },

        openMetadata: function(){
            var url = this.config.services.getLayerMetadataUrl;
            url = url + this.layerInfo.productLabel;

            window.open(url, this.layerInfo.productLabel, 'width=600, height=600, scrollbars=yes');
        },

        downloadMetadata: function(){
            var url = this.config.services.downloadLayerMetadataUrl;
            url = url + this.layerInfo.productLabel;

            console.log("download layer metadata url", url);
            var downloadFrame = dom.byId("layerMetadataDownloadFrame");

            downloadFrame.src = url;
        },

        toggleLegend: function(){
            if(this.isLegendCollapsed) {
                domClass.remove(this.legendImage, "hidden");
                this.legendToggleBtn.innerHTML = "Hide Legend";
                this.isLegendCollapsed = false;
            } else {
                domClass.add(this.legendImage, "hidden");
                this.legendToggleBtn.innerHTML = "Show Legend";
                this.isLegendCollapsed = true;
            }
        },

        hidePixelValue: function(){
            domClass.remove(this.showPixelValueBtn, "hidden");
            domClass.add(this.pixelValueContainer, "hidden");
            domClass.add(this.hidePixelValueBtn, "hidden");
            this.pixelListener.remove();

            if(this.pixelListener !== null) {
                this.pixelListener = null;
            }
        },

        showPixelValue: function(){
            domClass.add(this.showPixelValueBtn, "hidden");
            domClass.remove(this.pixelValueContainer, "hidden");
            domClass.remove(this.hidePixelValueBtn, "hidden");

            var projection = this.item.response.docs[0].dataProjection;
            var map = this.getMap(projection);
            var self = this;

            this.pixelListener = map.on("mouse-move", function(evt) {

                self.ttt = setTimeout(function () {
                    if(evt.mapPoint.x == self.pixelX &&
                        evt.mapPoint.y === self.pixelY){
                        domClass.remove(self.pixelValueLoadingIcon, "hidden");
                        domClass.add(self.pixelValue, "hidden");

                        xhr(self.indexerUtil.createLayerServicesUrl(self.item.response.docs[0].item_UUID), {
                            handleAs: "json",
                            headers: {"X-Requested-With": null}
                        }).then(function (data) {
                            var layerService = data;
                            self.setPixelValue(data, evt.mapPoint.x, evt.mapPoint.y);
                        }, function (err) {
                            console.log("error retrieving layer service:" + err);
                        });
                    }
                }, 500);

                self.pixelX = evt.mapPoint.x;
                self.pixelY = evt.mapPoint.y;

            });
        },

        setPixelValue: function(data, x, y){
            var docs = data.response.docs;
            var self = this;
            for(var i = 0; i < docs.length; i++){
                if(docs[i].serviceType === "raster"){
                    xhr(this.indexerUtil.createGetPixelValueUrl(docs[i].endPoint, y, x), {
                        handleAs: "json",
                        headers: {"X-Requested-With": null}
                    }).then(function (pixelData) {
                        if(pixelData.value !== null){
                            if(pixelData.value == "NoData"){
                                self.pixelValue.innerHTML = "No Data";
                            }
                            else{
                                self.pixelValue.innerHTML = pixelData.value + "m";
                            }
                        }
                        else{
                            self.pixelValue.innerHTML = "N/A";
                        }

                        domClass.add(self.pixelValueLoadingIcon, "hidden");
                        domClass.remove(self.pixelValue, "hidden");

                    }, function (err) {
                        console.log("error retrieving layer service:" + err);
                    });

                    i = docs.length;
                }
            }

        },

        hideAddRemoveButtonsIfBasemap: function(){
            if(this.isBasemap()){
                domClass.add(this.addLayerBtn, "hidden");
                domClass.add(this.removeLayerBtn, "hidden");
            }
        },

        indexOfInString: function(str, m, i) {
            return str.split(m, i).join(m).length;
        },

        closeSidebar: function(){
           this.sidebar.closeThisSidebar();
        },

        openLayersSidebar: function(){
            this.sidebar.controlBar.activateLayers();
        },

        cleanUp: function(){
            this.removeGraphic(this.layerInfo.dataProjection);

            if(this.pixelListener !== null) {
                this.pixelListener.remove();
                this.pixelListener = null;
            }
        },

        ZoomBtnClicked: function(){
            var projection = this.layerInfo.dataProjection;
            var xmin = this.layerInfo.bbox.split(",")[0];
            var ymin = this.layerInfo.bbox.split(",")[1];
            var xmax = this.layerInfo.bbox.split(",")[2];
            var ymax = this.layerInfo.bbox.split(",")[3];

            var extent = {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "projection": projection
            };
            topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});
            topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                "xmin": xmin,
                "xmax": xmax,
                "ymin": ymin,
                "ymax": ymax
            });
        }
    });
});