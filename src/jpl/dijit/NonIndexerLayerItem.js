define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/request/xhr",
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
], function (declare, lang, on, xhr, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, Config, Layers, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            layer: null,
            imgUrl: "",
            isCollapsed: true,
            mapDijit: "",
            map: null,
            layerVisible: true,
            currentOpacity: 100,

            constructor: function(layer, config, mapDijit){
                this.layer = layer.layer;
            },

            startup: function(){
                this.mapDijit = registry.byId("mainSearchMap");
                this.indexerUtil = new IndexerUtil();
                this.config = Config.getInstance();
                this.setListeners();

                if(this.layer.layerTitle === null ||
                    this.layer.layerTitle === "" ||
                    typeof this.layer.layerTitle === "undefined") {
                    this.layerTitle.innerHTML = "Layer title unavailable";
                }else {
                    this.layerTitle.innerHTML = this.layer.layerTitle;
                }

                if(this.layer.legendURL){
                    var legendUrl = this.layer.legendURL;
                    domClass.remove(this.legendBtn, "hidden");
                    domAttr.set(this.legendImage, "src", legendUrl);
                    domAttr.set(this.legendImageLink, "href", legendUrl);
                    on(this.legendBtn, "click", lang.hitch(this, this.toggleLegend));
                }

                if(this.layer.description){
                    if(this.layer.description.length > 0){
                        domClass.remove(this.informationBtn, "hidden");
                        on(this.informationBtn, "click", lang.hitch(this, this.showLayerInfo));
                    }
                }

                this.hideUnusedButtons();

                this.createTransparencySlider();
                domAttr.set(this.img, "src", this.indexerUtil.createThumbnailUrl(this.layer.thumbnailImage, "120"));

                this.addLayerOnStartup();
            },

            setListeners: function(){
                topic.subscribe(LayerEvent.prototype.TOGGLE_VISIBILITY, lang.hitch(this, this.toggleVisibility));
                topic.subscribe(LayerEvent.prototype.HIDE_LAYER, lang.hitch(this, this.hideLayer));
                topic.subscribe(LayerEvent.prototype.SHOW_LAYER, lang.hitch(this, this.showLayer));
                topic.subscribe(MapEvent.prototype.VIEW_3D, lang.hitch(this, this.hideUnavailableLayersDuring3d));
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.showUnavailableLayersDuring2d));

                on(this.toggleVisibilityBtn, "click", lang.hitch(this, this.toggleVisibilityBoxClicked));
            },

            toggleVisibilityBoxClicked: function(evt) {
                if(!this.layerVisible) {
                    this.checkExtent();
                    topic.publish(LayerEvent.prototype.SHOW_LAYER, {"layer": this.layer});
                } else {
                    topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": this.layer});
                }
            },

            showLayer: function(evt) {
                if(evt.layer.productLabel === this.layer.productLabel) {
                    this.addLayerToMap();
                    this.toggleVisibilityButtonToOn();
                    this.resetOpacityBar();
                    this.showOpacityBar();
                }
            },

            addLayerToMap: function(){
                var map = this.getMapFromProjection();

                if(this.layer.productType === "FeatureLabel" && this.layer.layerTitle === "Nomenclature") {
                    MapUtil.prototype.addNomenclatureToMap(this.layer, map, false);
                }
                if(this.layer.productType === "FeaturePoint") {
                    MapUtil.prototype.addPointFeatureToMap(this.layer, map, this.layer.layerTitle, false);
                }
                if (this.layer.productType === "region") {
                    MapUtil.prototype.addRegionLayerToMap(this.layer, map, false);
                }
                if (this.layer.productType === "featureLayer") {
                    MapUtil.prototype.addFeatureLayerToMap(this.layer, map, false);
                    this.publishAddLayer();
                }
                if (this.layer.productType === "featureGroupLayer") {
                    MapUtil.prototype.addFeatureGroupLayerToMap(this.layer, map, false);
                    this.publishAddLayer();
                }
                if (this.layer.productType === "Mosaic") {
                    MapUtil.prototype.addLayerToMap(this.layer, map, false);
                    this.publishAddLayer();
                }
                if (this.layer.productType === "imagery") {
                    MapUtil.prototype.addLayerToMap(this.layer, map, false);
                }
            },

            toggleVisibilityButtonToOn: function(){
                this.layerVisible = true;

                if (this.toggleVisibilityBtn) {
                    domClass.remove(this.toggleVisibilityBtn, "fa-eye-slash");
                    domClass.add(this.toggleVisibilityBtn, "fa-eye");
                }
            },

            resetOpacityBar: function(){
                this.setLayerOpacity(this.currentOpacity);
            },

            toggleVisibilityButtonToOff: function(){
                this.layerVisible = false;

                if (this.toggleVisibilityBtn) {
                    domClass.remove(this.toggleVisibilityBtn, "fa-eye");
                    domClass.add(this.toggleVisibilityBtn, "fa-eye-slash");
                }
            },

            hideLayer: function(evt) {
                if(evt.layer.productLabel === this.layer.productLabel) {
                    this.removeLayerFromMap();
                    this.toggleVisibilityButtonToOff();
                    this.hideOpacityBar();
                }
            },

            removeLayerFromMap: function(){
                var map = this.getMapFromProjection();

                if(this.layer.productType === "FeatureLabel" && this.layer.layerTitle === "Nomenclature") {
                    MapUtil.prototype.removeNomenclatureLayer(this.layer, map, false);
                }
                else if (this.layer.productType == "featureGroupLayer") {
                    MapUtil.prototype.removeFeatureGroupLayer(this.layer.productLabel, map);
                    this.publishRemoveLayer();
                }
                else if (this.layer.productType === "featureLayer" && this.layer.productLabel === "mars2020"){
                    MapUtil.prototype.removeMars2020WorkaroundLayer(this.layer.productLabel, map);
                    this.publishRemoveLayer();
                }
                else{
                    MapUtil.prototype.removeLayerFromMap(this.layer.productLabel, map, false);
                    this.publishRemoveLayer();
                }
            },

            getMapFromProjection: function() {
                var map;
                if (this.layer.layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                }
                if(this.layer.layerProjection === this.config.projection.S_POLE){
                    map = this.mapDijit.southPoleMap;
                }
                if(this.layer.layerProjection === this.config.projection.EQUIRECT){
                    map = this.mapDijit.equirectMap;
                }
                return map;
            },

            toggleLegend: function(evt){
                if(this.isCollapsed) {
                    domClass.remove(this.legendContainer, "hidden");
                    domClass.remove(this.legendBtn, "legendIconClosed");
                    domClass.add(this.legendBtn, "legendIconOpen");
                    AnimationUtil.prototype.wipeInAnimation(this.legendContainer);
                    this.isCollapsed = false;
                } else {
                    AnimationUtil.prototype.wipeOutAnimation(this.legendContainer);
                    domClass.remove(this.legendBtn, "legendIconOpen");
                    domClass.add(this.legendBtn, "legendIconClosed");
                    domClass.add(this.legendContainer, "hidden");
                    this.isCollapsed = true;
                }
            },

            showLayerInfo: function(evt) {
                var self = this;
                xhr(this.layer.description, {
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
                    console.log("error retrieving layer info results:" + err);
                });
            },

            hideUnavailableLayersDuring3d: function(){
                if(this.layer.layerTitle === "Graticule"){
                    domClass.add(this.domNode, "hidden");
                }
                if(this.layer.layerTitle === "Nomenclature"){
                    domClass.add(this.domNode, "hidden");
                }
            },

            showUnavailableLayersDuring2d: function(){
                if(this.layer.layerTitle === "Graticule"){
                    domClass.remove(this.domNode, "hidden");
                }
                if(this.layer.layerTitle === "Nomenclature"){
                    domClass.remove(this.domNode, "hidden");
                }
            },

            checkExtent: function(){
                if(this.layer.boundingBox.west === -180 &&
                    this.layer.boundingBox.south === -90 &&
                    this.layer.boundingBox.east === 180 &&
                    this.layer.boundingBox.north === 90){
                }
                else{
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
                }
            },

            addLayerOnStartup: function(){
                if(this.layer.show){
                    this.addLayerToMap();
                    this.toggleVisibilityButtonToOn();
                    this.showOpacityBar();
                }
                else{
                    this.toggleVisibilityButtonToOff();
                    this.hideOpacityBar();
                }
            },

            hideUnusedButtons: function(){
                domClass.add(this.informationBtn, "hidden");
                domClass.add(this.legendBtn, "hidden");
                domClass.add(this.metadataBtn, "hidden");
                domClass.add(this.downloadBtn, "hidden");
                domClass.add(this.removeBtn, "hidden");
            },

            publishAddLayer: function(){
                topic.publish(LayerEvent.prototype.ADD_TO_STATIC_LAYERS, {
                    "layer": this.layer
                });
            },

            publishRemoveLayer: function(){
                topic.publish(LayerEvent.prototype.REMOVE_FROM_STATIC_LAYERS, this.layer);
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

                on(this.sliderWidget, "change", lang.hitch(this, this.setLayerOpacity));
            },

            setLayerOpacity: function(value) {
                var map = this.getMapFromProjection();
                var mapLayer = MapUtil.prototype.getLayerFromMap(this.layer.productLabel, map);

                MapUtil.prototype.changeLayerOpacity(mapLayer, value/100);
                this.currentOpacity = value;
                topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": this.layer, "opacity": value/100});
            },

            changeLayerOpacity: function(evt) {
                if(evt.layer.productLabel === this.layer.id) {
                    var map = this.getMapFromProjection();
                    var mapLayer = MapUtil.prototype.getLayerFromMap(this.layer.productLabel, map);

                    MapUtil.prototype.changeLayerOpacity(mapLayer, evt.opacity);
                    this.sliderWidget.set('value', evt.opacity * 100);
                    this.currentOpacity = evt.opacity;
                    topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": this.layer, "opacity": evt.opacity});
                }
            },

            showOpacityBar: function(){
                domClass.remove(this.layerSliderHolder, "hidden");
            },

            hideOpacityBar: function(){
                domClass.add(this.layerSliderHolder, "hidden");
            }
    });

});
