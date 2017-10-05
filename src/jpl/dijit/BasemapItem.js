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
    'dojo/text!./templates/BasemapItem.html',
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
    "jpl/dijit/ColorLegendControl"
], function (declare, lang, on, xhr, dom, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, Layers, Config, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            layer: null,
            imgUrl: "",
            isCollapsed: true,
            mapDijit: "",

            constructor: function(layer){
                this.layer = layer.layer;
            },
            
            startup: function(){
                this.mapDijit = registry.byId("mainSearchMap");
                this.indexerUtil = new IndexerUtil();
                this.config = Config.getInstance().config;
                this.setListeners();

                if(this.layer.layerTitle === null ||
                    this.layer.layerTitle === "" ||
                    typeof this.layer.layerTitle === "undefined") {
                    this.layerTitle.innerHTML = "Layer title unavailable";
                }else {
                    this.layerTitle.innerHTML = this.layer.layerTitle;
                }

                domAttr.set(this.img, "src", this.indexerUtil.createThumbnailUrl(this.layer.thumbnailImage, "120"));
                this.checkIfIsCurrentBasemap();
                this.removeButtonsIfNotUsingIndexer();
            },

            setListeners: function(){
                on(this.showMoreBtn, "click", lang.hitch(this, this.toggleCollapsed));
                on(this.setBasemapBtn, "click", lang.hitch(this, this.setBasemap));
                on(this.metadataBtn, "click", lang.hitch(this, this.metadataBtnClicked));
                on(this.downloadBtn, "click", lang.hitch(this, this.downloadBtnClicked));
                on(this.informationBtn, "click", lang.hitch(this, this.showLayerInfo));

                topic.subscribe(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, lang.hitch(this, this.setActiveBookmark));
            },

            toggleBoxClicked: function(evt) {
                /*
                if(!this.layerVisible) {
                    this.initializeLayer();
                } else {
                    topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": this.layer});
                }
                */
            },

            showLayerInfo: function(evt) {
            },

            flyToLayer: function(evt) {
            },

            removeLayerClicked: function(evt) {
            },


            toggleCollapsed: function(evt) {
                if(this.isCollapsed) {
                    domClass.remove(this.showMoreBtn, "fa-caret-down");
                    domClass.add(this.showMoreBtn, "fa-caret-up");
                    AnimationUtil.prototype.wipeInAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = false;
                } else {
                    domClass.remove(this.showMoreBtn, "fa-caret-up");
                    domClass.add(this.showMoreBtn, "fa-caret-down");
                    AnimationUtil.prototype.wipeOutAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = true;
                }
            },

            setBasemap: function(evt){
                var map = null,
                    layerOutline = null,
                    newLayerId = "myLayer_" + this.layer.productLabel;

                //if the layer is not found in the layer list, do not add
                if (this.layer == null)
                    return;


                //hack for now
                if (this.layer.layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if (this.layer.layerProjection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                } else {
                    map = this.mapDijit.equirectMap;
                }

                console.log("this.layer.productType", this.layer.productType);
                if (this.layer.productType === "Mosaic" ||
                    this.layer.productType === "Feature" ||
                    this.layer.productType === "FeatureLabel" ||
                    this.layer.productType === "FeatureRegions" ||
                    this.layer.productType === "FeatureWaypoints" ||
                    this.layer.productType === "FeatureLinks" ||
                    this.layer.productType === "FeatureGraticule" ||
                    this.layer.productType === "imagery" ||
                    this.layer.productType === "region") {
                    MapUtil.prototype.addLayerToMap(this.layer, map, true);
                    topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":this.layer,"isBasemap": true});
                } else if (this.layer.productType === "DEM") {
                    layerOutline = MapUtil.prototype.createLayerPolygon(this.layer, this.mapDijit.equirectMap, this.layer.productLabel, true);
                    topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer":this.layer});
                } else{

                }

            },

            checkIfIsCurrentBasemap: function(){
                var map;

                if (this.layer.layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if (this.layer.layerProjection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                } else {
                    map = this.mapDijit.equirectMap;
                }

                if (map != undefined) {
                    if (map.layerIds.indexOf(this.layer.productLabel) > -1) {
                        domClass.add(this.setBasemapBtn, "hidden");
                    }
                }
            },

            removeButtonsIfNotUsingIndexer: function(){
                if(this.config.useIndexerLayers){
                }
                else{
                    domClass.add(this.basemapSetButtonP, "hidden");
                }
            },

            setActiveBookmark: function(evt){
                if(evt.isBasemap){
                    if(this.layer.productLabel === evt.layer.productLabel){
                        domClass.add(this.setBasemapBtn, "hidden");
                    }
                    else{
                        domClass.remove(this.setBasemapBtn, "hidden");
                    }

                }
            },

            metadataBtnClicked: function(){
                var url = this.config.services.getLayerMetadataUrl;
                url = url + this.layer.productLabel;

                window.open(url, this.layer.productLabel, 'width=520, height=520');
            },

            downloadBtnClicked: function(){
                var url = this.config.services.getLayerDataUrl;
                url = url + this.layer.productLabel;

                console.log("downloadLayer url", url);
                var stlDownloadFrame = dom.byId("layerDownloadFrame");
                stlDownloadFrame.src = url;
            },

            showLayerInfo: function(evt) {
                var self = this;
                var searchUrl = this.config.services.getLayerAbstractUrl;
                searchUrl = searchUrl + self.layer.productLabel;
                console.log("layer info url", searchUrl);

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

            }
        
    });

});

