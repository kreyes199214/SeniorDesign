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
    'dojo/text!./templates/LayerItem.html',
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
             _TemplatedMixin, template, Config, Layers, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            layer: null,
            imgUrl: "",
            isCollapsed: true,
            layerVisible: true,
            map: null,
            mapLayer: null,
            mapDijit: "",

            constructor: function(layer){
                this.layer = layer.layer;
            },
            
            startup: function(){
                this.mapDijit = registry.byId("mainSearchMap");
                this.indexerUtil = new IndexerUtil();
                this.config = Config.getInstance();
                this.map = this.getMapFromProjection(this.layer.layerProjection);
                this.mapLayer = MapUtil.prototype.getLayerFromMap(this.layer.productLabel, this.map);

                if(this.layer.layerTitle === null ||
                    this.layer.layerTitle === "" ||
                    this.layer.layerTitle === "undefined") {
                    this.layerTitle.innerHTML = "Layer title unavailable";
                }else {
                    this.layerTitle.innerHTML = this.layer.layerTitle;
                }
                
                if(this.layer.productLabel){
                    domAttr.set(this.productLabelHiddenDiv, "data-productlabel", this.layer.productLabel);
                }

                domAttr.set(this.img, "src", this.indexerUtil.createThumbnailUrl(this.layer.thumbnailImage, "120"));

                var self = this;
                this.legendImage.onerror = function () {
                    domClass.add(self.legendBtn, "hidden");
                };

                var legendUrl = this.config.services.getLayerLegendUrl;
                legendUrl = legendUrl + this.layer.productLabel;
                console.log("legendUrl", legendUrl);
                domAttr.set(this.legendImage, "src", legendUrl);
                domAttr.set(this.legendImageLink, "href", legendUrl);

                this.createTransparencySlider();

                if(this.config.data.showLayerMetadata){
                }
                else{
                    domClass.add(this.metadataBtn, "hidden");
                }

                this.setListeners();

                if(this.config.useIndexerLayers){
                }
                else{
                    this.hideIndexerButtons();
                }
            },

            setListeners: function(){
                on(this.toggleVisibilityBtn, "click", lang.hitch(this, this.toggleVisibilityBoxClicked));
                on(this.informationBtn, "click", lang.hitch(this, this.showLayerInfo));
                on(this.flyToBtn, "click", lang.hitch(this, this.flyToLayer));
                on(this.removeBtn, "click", lang.hitch(this, this.removeLayerClicked));
                on(this.showMoreBtn, "click", lang.hitch(this, this.toggleCollapsed));
                on(this.metadataBtn, "click", lang.hitch(this, this.metadataBtnClicked));

                on(this.sliderWidget, "change", lang.hitch(this, this.setLayerOpacity));

                if(this.layer.productType === "Mosaic"){
                    domClass.add(this.legendBtn, "hidden");
                }
                else{
                    on(this.legendBtn, "click", lang.hitch(this, this.toggleLegend));
                }

                if(this.layer.layerTitle.toLowerCase().indexOf("opportunity") > -1 ||
                    this.layer.layerTitle.toLowerCase().indexOf("spirit") > -1){
                    domClass.add(this.downloadBtn, "hidden");
                }
                else{
                    on(this.downloadBtn, "click", lang.hitch(this, this.downloadBtnClicked));
                }
                //
                // if(this.layer.layerTitle.toLowerCase().includes("opportunity") || this.layer.layerTitle.toLowerCase().includes("spirit")){
                //     domClass.add(this.downloadBtn, "hidden");
                // }
                // else{
                //     on(this.downloadBtn, "click", lang.hitch(this, this.downloadBtnClicked));
                // }

                topic.subscribe(LayerEvent.prototype.TOGGLE_VISIBILITY, lang.hitch(this, this.toggleVisibility));
                topic.subscribe(LayerEvent.prototype.HIDE_LAYER, lang.hitch(this, this.hideLayer));
                topic.subscribe(LayerEvent.prototype.SHOW_LAYER, lang.hitch(this, this.showLayer));
                topic.subscribe(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, lang.hitch(this, this.removeFromActiveLayers));
                topic.subscribe(LayerEvent.prototype.CHANGE_OPACITY, lang.hitch(this, this.changeLayerOpacity));
            },

            toggleVisibility: function(evt) {
                if(evt.layer.productLabel === this.layer.productLabel) {
                    this.toggleVisibilityBoxClicked();
                }
            },

            toggleVisibilityBoxClicked: function(evt) {
                if(!this.layerVisible) {
                    this.initializeLayer();
                } else {
                    topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": this.layer});
                }
            },

            initializeLayer: function(){
                MapUtil.prototype.showLayer(this.mapLayer);
                MapUtil.prototype.addLayerPolygon(this.outline, this.map);
                topic.publish(LayerEvent.prototype.SHOW_LAYER, {"layer": this.layer});
                this.layerVisible = true;

                if(this.toggleVisibilityBtn) {
                    domClass.remove(this.toggleVisibilityBtn, "fa-eye-slash");
                    domClass.add(this.toggleVisibilityBtn, "fa-eye");
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
                    topic.publish(LayerEvent.prototype.LAYER_SHOWN, { layer: evt.layer });
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
                    topic.publish(LayerEvent.prototype.LAYER_HIDDEN, { layer: evt.layer });
                }
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

            removeFromActiveLayers: function(evt){
                if(evt.productLabel === this.layer.productLabel &&
                    evt.projection === this.layer.layerProjection){
                    this.destroy();
                }
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

                console.log("downloadLayer url", url);
                var stlDownloadFrame = dom.byId("layerDownloadFrame");
                stlDownloadFrame.src = url;
            },

            createTransparencySlider: function(sliderValue) {
                if(typeof sliderValue != 'number') {
                    sliderValue = 100;
                } else {
                    this.setLayerOpacity(sliderValue);
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
                    id: "slider_" + this.layer.productLabel,
                    name: "slider_" + this.layer.productLabel,
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

            setLayerOpacity: function(value) {
                MapUtil.prototype.changeLayerOpacity(this.mapLayer, value/100);
                topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": this.layer, "opacity": value/100});
            },

            changeLayerOpacity: function(evt) {
                if(evt.layer.productLabel === this.mapLayer.id) {
                    MapUtil.prototype.changeLayerOpacity(this.mapLayer, evt.opacity);
                    this.sliderWidget.set('value', evt.opacity * 100);
                    topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": this.layer, "opacity": evt.opacity});
                }
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

            hideIndexerButtons: function(){
                domClass.add(this.informationBtn, "hidden");
                domClass.add(this.legendBtn, "hidden");
                domClass.add(this.metadataBtn, "hidden");
                domClass.add(this.downloadBtn, "hidden");
                domClass.add(this.removeBtn, "hidden");
            }
    });

});

