define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/request/xhr",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/query",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/LayerSetItem.html',
    "jpl/config/Config",
    "jpl/data/Layers",
    "jpl/events/LayerEvent",
    "jpl/events/BrowserEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "jpl/utils/AnimationUtil",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojox/charting/widget/Legend",
    "jpl/dijit/ColorLegendControl",
    "jpl/dijit/LayerItemAuto",
    "dojo/NodeList-traverse"
], function (declare, lang, on, xhr, dom, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, Config, Layers, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl, LayerItemAuto) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            layer: null,
            layerInfo: null,
            imgUrl: "",
            isCollapsed: true,
            layerVisible: true,
            map: null,
            mapLayer: null,
            mapDijit: "",
            removeSetFromActiveLayersListener: null,
            updateAutoLayersListener: null,
            staticLayerOffset: 0,

            constructor: function(layerInfo, map){
                this.layerInfo = layerInfo;
                this.map = map;
            },
            
            startup: function(){
                this.mapDijit = registry.byId("mainSearchMap");
                this.indexerUtil = new IndexerUtil();
                this.config = Config.getInstance();
                this.layersInstance = Layers.getInstance();

                if(this.layerInfo.layerTitle === null ||
                    this.layerInfo.layerTitle === "" ||
                    this.layerInfo.layerTitle === "undefined") {
                    this.layerTitle.innerHTML = "Layer title unavailable";
                }else {
                    this.layerTitle.innerHTML = this.layerInfo.title;
                }

                if(this.layerInfo.thumbnailURLDir){
                    domAttr.set(this.img, "src", this.indexerUtil.createThumbnailUrl(this.layerInfo.thumbnailURLDir, "120"));
                }

                if(this.layerInfo.productLabel){
                    domAttr.set(this.productLabelHiddenDiv, "data-productlabel", this.layerInfo.productLabel);
                    domAttr.set(this.productLabelHiddenDiv, "data-isautolayerset", "true");
                }

                topic.publish(LayerEvent.prototype.CREATE_MANAGER_FOR_AUTO_LAYER_SET, {
                    "layerInfo": this.layerInfo,
                    "map": this.map
                });

                //this.calculateStaticLayersOffset();
                this.createTransparencySlider();

                this.setListeners();
            },

            setListeners: function(){
                on(this.showMoreBtn, "click", lang.hitch(this, this.toggleCollapsed));
                on(this.toggleVisibilityBtn, "click", lang.hitch(this, this.toggleVisibilityBoxClicked));
                on(this.removeBtn, "click", lang.hitch(this, this.removeSelfFromActiveLayers));
                on(this.sliderWidget, "change", lang.hitch(this, this.setLayerOpacity));

                this.removeSetFromActiveLayersListener = topic.subscribe(LayerEvent.prototype.REMOVE_SET_FROM_ACTIVE_LAYERS, lang.hitch(this, this.removeFromActiveLayers));
                this.updateAutoLayersListener = topic.subscribe(LayerEvent.prototype.ADD_TO_AUTO_LAYERS, lang.hitch(this, this.updateAutoLayers));
            },

            toggleVisibilityBoxClicked: function(evt){
                if(!this.layerVisible) {
                    topic.publish(LayerEvent.prototype.SHOW_ALL_AUTO_LAYERS_IN_SET, {"layerInfo": this.layerInfo});
                    this.layerVisible = true;

                    if(this.toggleVisibilityBtn) {
                        domClass.remove(this.toggleVisibilityBtn, "fa-eye-slash");
                        domClass.add(this.toggleVisibilityBtn, "fa-eye");
                    }
                } else {
                    this.layerVisible = false;

                    if(this.toggleVisibilityBtn) {
                        domClass.remove(this.toggleVisibilityBtn, "fa-eye");
                        domClass.add(this.toggleVisibilityBtn, "fa-eye-slash");
                    }
                    topic.publish(LayerEvent.prototype.HIDE_ALL_AUTO_LAYERS_IN_SET, {"layerInfo": this.layerInfo});
                }
            },

            showLayer: function(evt) {
                if(evt.layer.productLabel === this.mapLayer.id) {
                    MapUtil.prototype.showLayer(this.mapLayer);
                    MapUtil.prototype.addLayerPolygon(this.outline, this.map);
                    this.layerVisible = true;

                    if(this.toggleVisibilityBtn) {
                        domClass.remove(this.toggleVisibilityBtn, "fa-eye-slash");
                        domClass.add(this.toggleVisibilityBtn, "fa-eye");
                    }
                }
            },

            hideLayer: function(evt) {
                if(evt.layer.productLabel === this.mapLayer.id) {
                    MapUtil.prototype.removeLayerPolygon(this.outline, this.map);
                    MapUtil.prototype.hideLayer(this.mapLayer);

                    this.layerVisible = false;

                    if(this.toggleVisibilityBtn) {
                        domClass.remove(this.toggleVisibilityBtn, "fa-eye");
                        domClass.add(this.toggleVisibilityBtn, "fa-eye-slash");
                    }
                }
            },

            showLayerInfo: function(evt) {
                var self = this;
                var searchUrl = this.config.services.getLayerAbstractUrl;
                searchUrl = searchUrl + self.layer.productLabel;
                
                xhr(searchUrl, {
                    handleAs: "html",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (description) {
                    topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                        title: self.layer.layerTitle,
                        content: description,
                        size: "lg"
                    });
                }, function (err) {
                    console.log("error retrieving nomenclature results:" + err);
                });
                
            },

            flyToLayer: function(evt) {
                var extent = {
                    "xmin": this.layer.boundingBox.west,
                    "ymin": this.layer.boundingBox.south,
                    "xmax": this.layer.boundingBox.east,
                    "ymax": this.layer.boundingBox.north,
                    "projection": this.layer.layerProjection
                };

                topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});

                topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                    "xmin": extent.xmin,
                    "xmax": extent.xmax,
                    "ymin": extent.ymin,
                    "ymax": extent.ymax
                });
            },

            removeLayerClicked: function(evt) {
                MapUtil.prototype.removeLayerFromMap(this.layer.productLabel, this.map);

                topic.publish(LayerEvent.prototype.REMOVE_FROM_LAYER_VIEWER, {
                    "productLabel":this.layer.productLabel,
                    "projection": this.layer.layerProjection
                });

                topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
                    "productLabel":this.layer.productLabel,
                    "projection": this.layer.layerProjection
                });
            },

            removeLayer: function(evt){
                if (evt.layer.productLabel === this.layer.productLabel){
                    this.removeLayerClicked(evt);
                }
            },

            removeSelfFromActiveLayers: function(evt){
                this.removeFootprintLayer();

                this.removeFromActiveLayers({
                    "productLabel":this.layerInfo.productLabel,
                    "projection":this.layerInfo.dataProjection
                });

                topic.publish(LayerEvent.prototype.REMOVE_FROM_LAYER_SET_VIEWER, {
                    "productLabel":this.layerInfo.productLabel,
                    "projection":this.layerInfo.dataProjection
                });
            },

            removeFromActiveLayers: function(evt){

                if(evt.productLabel === this.layerInfo.productLabel){
                    if(evt.projection === this.layerInfo.dataProjection) {
                        topic.publish(LayerEvent.prototype.REMOVE_MANAGER_FOR_AUTO_LAYER_SET, {
                            "layerInfo": this.layerInfo,
                            "map": this.map
                        });
                        this.removeSetFromActiveLayersListener.remove();
                        this.updateAutoLayersListener.remove();
                        this.destroy();
                    }
                }
            },

            removeFootprintLayer: function(){
                var self = this;
                xhr(this.indexerUtil.createLayerServicesUrl(this.layerInfo.item_UUID), {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function (data) {

                    var footprintLayer = self.indexerUtil.createLayerFromFootPrint(data.response.docs[0], self.layerInfo);
                    MapUtil.prototype.removeLayerFromMap(footprintLayer.productLabel, self.map);

                }, function (err) {
                    console.log("error retrieving layer service:" + err);
                });
            },

            toggleCollapsed: function(evt) {
                if(this.isCollapsed) {
                    domClass.remove(this.showMoreBtn, "fa-caret-down");
                    domClass.add(this.showMoreBtn, "fa-caret-up");
                    this.showMoreBtnLabel.innerHTML = " Hide Layers";
                    AnimationUtil.prototype.wipeInAnimation(this.layerItemListContainer);
                    this.isCollapsed = false;
                } else {
                    domClass.remove(this.showMoreBtn, "fa-caret-up");
                    domClass.add(this.showMoreBtn, "fa-caret-down");
                    this.showMoreBtnLabel.innerHTML = " Show Layers";
                    AnimationUtil.prototype.wipeOutAnimation(this.layerItemListContainer);
                    this.isCollapsed = true;
                }
            },

            toggleLegend: function(){
                if(this.isCollapsed) {
                    domClass.remove(this.legendContainer, "hidden");
                    domClass.remove(this.legendBtn, "legendIconClosed");
                    domClass.add(this.legendBtn, "legendIconOpen");
                    AnimationUtil.prototype.wipeInAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = false;
                } else {
                    domClass.remove(this.legendBtn, "legendIconOpen");
                    domClass.add(this.legendBtn, "legendIconClosed");
                    domClass.add(this.legendContainer, "hidden");
                    AnimationUtil.prototype.wipeOutAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = true;
                }
            },

            metadataBtnClicked: function(){
                var url = this.config.services.getLayerMetadataUrl;
                url = url + this.layer.productLabel;

                window.open(url, this.layer.productLabel, 'width=520, height=520, scrollbars=yes');
            },

            downloadBtnClicked: function(){
                var url = this.config.services.getLayerDataUrl;
                url = url + this.layer.productLabel;

                var stlDownloadFrame = dom.byId("layerDownloadFrame");
                stlDownloadFrame.src = url;
            },

            createTransparencySlider: function(sliderValue) {
                if(typeof sliderValue != 'number') {
                    sliderValue = 100;
                } else {
                }

                var rulesNode = domConstruct.place("<div></div>", this.sliderContainer, "after");
                var sliderRules = new HorizontalRule({
                    container: "rightDecoration",
                    count: 5,
                    style: "height: 4px;"
                }, rulesNode);

                var labelsNode = domConstruct.place("<div></div>", this.sliderContainer, "after");
                var sliderLabels = new HorizontalRuleLabels({
                    container: "rightDecoration",
                    labelStyle: "padding-top:4px;font-size:12px;"
                }, labelsNode);

                this.sliderWidget = new HorizontalSlider({
                    id: "slider_" + this.layerInfo.productLabel,
                    name: "slider_" + this.layerInfo.productLabel,
                    containerNode: "sliderContainer",
                    value: sliderValue,
                    minimum: 0,
                    maximum: 100,
                    showButtons: false,
                    intermediateChanges: true
                }, this.sliderContainer);

                this.sliderWidget.startup();
                sliderRules.startup();
                sliderLabels.startup();
            },

            setLayerOpacity: function(value){
                topic.publish(LayerEvent.prototype.CHANGE_AUTO_LAYER_SECTION_OPACITIES, {
                    "layerInfo": this.layerInfo,
                    "opacity": value/100
                });
            },

            getMapFromProjection: function(projection) {
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

            updateAutoLayers: function(evt){
                if(this.layerInfo.productLabel === evt.layerInfo.productLabel){
                    if(evt.layers.length > 0){
                        for (var i = evt.layers.length - 1; i >= 0; i--) {
                            var layer = evt.layers[i].layer;

                            var existsInContainer = this.isInAutoLayerContainer(query(this.layerItemList), layer);
                            if (existsInContainer) {
                                return;
                            }

                            var index = this.findIndexToPlaceLayer(this.layerItemList);
                            MapUtil.prototype.addAutoLayerToMap(layer, evt.map, index + 1);

                            var layerItem = new LayerItemAuto({"layer": layer, "map": evt.map});
                            layerItem.startup();

                            domConstruct.place(layerItem.domNode, this.layerItemList, "last");
                        }
                    }
                    else{
                    }
                }
            },

            isInAutoLayerContainer: function (domContainer, layer) {
                var existsInContainer = false;
                if (domContainer.children().length > 0){
                    for (var i = 0; i < domContainer.children().length; i++) {
                        if (domContainer.children()[i].dataset.productlabel === layer.productLabel) {
                            existsInContainer = true;
                        }
                    }
                }
                return existsInContainer;
            },

            findIndexToPlaceLayer: function(layerListDom){
                var layerList = query(this.domNode)[0].parentNode.children;
                var totalLayerCount = 0;
                var countFromSet = 0;
                var beginCountFromSet = false;

                for(var i = 0; i < layerList.length; i++){
                    if(layerList[i].dataset.isautolayerset == "true"){
                        if(layerList[i].dataset.productlabel === this.layerInfo.productLabel){
                            beginCountFromSet = true;
                        }
                        var setLayerList = layerList[i].children[1].children[4].children[0].children;
                        for(var j = 0; j < setLayerList.length; j++){
                            totalLayerCount++;
                            if(beginCountFromSet){
                                countFromSet++;
                            }
                        }
                    }
                    else{
                        totalLayerCount++;
                        if(beginCountFromSet){
                            countFromSet++;
                        }
                    }
                }

                countFromSet = countFromSet + this.staticLayerOffset;

                return countFromSet;
            }

            /*calculateStaticLayersOffset: function(){
                var staticLayers = [];
                if(this.map === this.mapDijit.equirectMap){
                    staticLayers = this.layersInstance.centerLayerList;
                }
                if(this.map === this.mapDijit.northPoleMap){
                    staticLayers = this.layersInstance.northLayerList;
                }
                if(this.map === this.mapDijit.southPoleMap){
                    staticLayers = this.layersInstance.southLayerList;
                }

                var nonFeatureCount = 0;
                for(var i = 0; i < staticLayers.length; i++){
                    if(staticLayers[i].services){
                        if(staticLayers[i].services.length === 1){
                            if(staticLayers[i].services[0].serviceType === "Mosaic"){
                                nonFeatureCount = nonFeatureCount + 1;
                            }
                        }
                    }
                }

                this.staticLayerOffset = nonFeatureCount;
            }*/
    });

});


