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
    "bootstrap/Modal",
    'dojo/text!./templates/LayerSetViewer.html',
    "xstyle/css!./css/LayerSetViewer.css"
], function (declare, lang, on, query, topic, xhr, win, dom, domClass, domConstruct, domAttr, registry, _WidgetBase, _TemplatedMixin,
             LayerEvent, LoadingEven, MapEvent, MapUtil, IndexerUtil, Config, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        mapDijit: "",
        layerInfo: null,
        sidebar: null,
        backButtonListener: null,
        item: null,
        layerService: null,
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
            this.setContent();

            backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));

            on(this.addLayerBtn, "click", lang.hitch(this, this.addLayerSet));
            on(this.removeLayerBtn, "click", lang.hitch(this, this.removeLayerSet));

            //on(this.showFootPrintBtn, "click", lang.hitch(this, this.showFootPrintLayer));
            //on(this.removeFootPrintBtn, "click", lang.hitch(this, this.removeFootPrintLayer));

            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeSidebar));

            topic.subscribe(LayerEvent.prototype.REMOVE_FROM_LAYER_SET_VIEWER, lang.hitch(this, this.setRemoved));
            topic.subscribe(LayerEvent.prototype.CHECK_IF_LAYER_SET_ADDED_RESPONSE, lang.hitch(this, this.isSetAddedResponse));

            //this.isFootprintAdded();
            this.isSetAdded();
        },

        setLayerInfo: function(layerInfo){
            this.layerInfo = layerInfo;
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            backButtonListener.remove();
            this.cleanUp();
        },

        setContent: function(){
            if (this.layerInfo.title) {
                this.layerTitle.innerHTML = this.layerInfo.title;
            }

            if(this.layerInfo.description){
                this.description.innerHTML = this.layerInfo.description;
            }else{
                this.description.innerHTML = "No description Available";
            }

            if(this.layerInfo.instrument){
                this.instrumentLabel.innerHTML = this.layerInfo.instrument;
            }else{
                this.instrumentLabel.innerHTML = "N/A";
            }

            if(this.layerInfo.itemType){
                this.itemTypeLabel.innerHTML = this.layerInfo.itemType;
            }else{
                this.itemTypeLabel.innerHTML = "N/A";
            }

            if(this.layerInfo.productType){
                this.productTypeLabel.innerHTML = this.layerInfo.productType;
            }else{
                this.productTypeLabel.innerHTML = "N/A";
            }

            if(this.layerInfo.mission){
                this.missionLabel.innerHTML = this.layerInfo.mission;
            }else{
                this.missionLabel.innerHTML = "N/A";
            }

            if(this.layerInfo.thumbnailURLDir) {
                domAttr.set(this.layerSetImage, "src", this.indexerUtil.createThumbnailUrl(this.layerInfo.thumbnailURLDir, "200"));
            }
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

                    MapUtil.prototype.addLayerToMap(layer, map);
                    topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":layer});

                    domClass.add(self.addLayerBtn, "hidden");
                    domClass.remove(self.removeLayerBtn, "hidden");
                    domClass.add(self.openLayersMenuNotAddedBtn, "hidden");
                    domClass.remove(self.openLayersMenuAddedBtn, "hidden");

                }, function (err) {
                    console.log("error retrieving layer description:" + err);
                });

            }
        },

        isSetAdded: function(){
            this.addLayerBtn.disabled = true;
            topic.publish(LayerEvent.prototype.CHECK_IF_LAYER_SET_ADDED, {"layerInfo": this.layerInfo});
        },

        isSetAddedResponse: function(evt){
            if(evt.layerInfo.productLabel === this.layerInfo.productLabel){
                if(evt.isAdded === true){
                    this.hideAddLayerSetButton();
                }
                else{
                    this.hideRemoveFootPrintButton();
                }
                this.addLayerBtn.disabled = false;
            }
        },

        addLayerSet: function(){
            topic.publish(LayerEvent.prototype.ADD_SET_TO_ACTIVE_LAYERS, {"layerInfo":this.layerInfo});
            this.showFootPrintLayer();

            this.hideAddLayerSetButton();
        },

        removeLayerSet: function(){
            topic.publish(LayerEvent.prototype.REMOVE_SET_FROM_ACTIVE_LAYERS, {
                "productLabel":this.layerInfo.productLabel,
                "projection":this.layerInfo.dataProjection
            });

            this.removeFootPrintLayer();

            this.hideRemoveLayerSetButton();
        },

        hideAddLayerSetButton: function(){
            domClass.add(this.addLayerBtn, "hidden");
            domClass.remove(this.removeLayerBtn, "hidden");
        },

        hideRemoveLayerSetButton: function(){
            domClass.remove(this.addLayerBtn, "hidden");
            domClass.add(this.removeLayerBtn, "hidden");
        },

        isFootprintAdded: function(){
            this.showFootPrintBtn.disabled = true;
            var self = this;
            xhr(this.indexerUtil.createLayerServicesUrl(this.layerInfo.item_UUID), {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function (data) {
                var map = self.getMapByProjection(self.layerInfo.dataProjection);
                var layer = self.indexerUtil.createLayerFromFootPrint(data.response.docs[0], self.layerInfo);
                if(map.getLayer(layer.productLabel)){
                    self.hideShowFootPrintLayerButton();
                }
                else{
                    self.hideRemoveFootPrintButton();
                }

                self.showFootPrintBtn.disabled = false;
            }, function (err) {
                console.log("error retrieving layer service:" + err);
            });

        },

        showFootPrintLayer: function(){
            var map = this.getMapByProjection(this.layerInfo.dataProjection);

            this.showFootPrintBtn.disabled = true;
            var self = this;
            xhr(this.indexerUtil.createLayerServicesUrl(this.layerInfo.item_UUID), {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function (data) {

                self.footprintLayer = self.indexerUtil.createLayerFromFootPrint(data.response.docs[0], self.layerInfo);
                //MapUtil.prototype.addLayerToMap(self.footprintLayer, map);
                MapUtil.prototype.addFeatureLayerToMap(self.footprintLayer, self.mapDijit.equirectMap, false);

                self.showFootPrintBtn.disabled = false;
                self.hideShowFootPrintLayerButton();
            }, function (err) {
                console.log("error retrieving layer service:" + err);
            });
        },

        hideShowFootPrintLayerButton: function(){
            domClass.add(this.showFootPrintBtn, "hidden");
            domClass.remove(this.removeFootPrintBtn, "hidden");
        },

        removeFootPrintLayer: function(){
            this.removeFootPrintBtn.disabled = true;
            var self = this;
            xhr(this.indexerUtil.createLayerServicesUrl(this.layerInfo.item_UUID), {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function (data) {
                var map = self.getMapByProjection(self.layerInfo.dataProjection);

                var footprintLayer = self.indexerUtil.createLayerFromFootPrint(data.response.docs[0], self.layerInfo);
                MapUtil.prototype.removeLayerFromMap(footprintLayer.productLabel, map);

                self.removeFootPrintBtn.disabled = false;
                self.hideRemoveFootPrintButton();
            }, function (err) {
                console.log("error retrieving layer service:" + err);
            });
        },

        hideRemoveFootPrintButton: function(){
            domClass.remove(this.showFootPrintBtn, "hidden");
            domClass.add(this.removeFootPrintBtn, "hidden");
        },


        removeLayer: function(){
            var map = null;
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
            }
        },

        downloadLayer: function(){
            var url = this.config.services.getLayerDataUrl;
            url = url + this.layerInfo.productLabel;

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
            /*if(this.footprintLayer){
                var map = this.getMapByProjection(this.layerInfo.dataProjection);
                MapUtil.prototype.removeLayerFromMap(this.footprintLayer.productLabel, map);
            }*/
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
        },

        getMapByProjection: function(projection){
            var map = null;
            if(this.layerInfo.dataProjection === this.config.data.projections.equirect){
                return map = this.mapDijit.equirectMap;
            }
            if(this.layerInfo.dataProjection === this.config.data.projections.northpole){
                return map = this.mapDijit.northPoleMap;
            }
            if(this.layerInfo.dataProjection === this.config.data.projections.southpole){
                return map = this.mapDijit.southPoleMap;
            }

            console.log("ERROR: Map for projection: " + projection + " not found");
            return null;
        }

    });
});