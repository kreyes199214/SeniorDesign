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
    'dojo/text!./templates/LayerControl.html',
    "xstyle/css!./css/LayerControl.css",
    "jpl/config/Config",
    "jpl/data/Layers",
    "jpl/events/LayerEvent",
    "jpl/events/BrowserEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/AnimationUtil",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojox/charting/widget/Legend",
    "jpl/dijit/ColorLegendControl"
], function (declare, lang, on, xhr, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, css, Layers, Config, LayerEvent, BrowserEvent, MapEvent, MapUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,
            mapDijit: "",
            layerVisible: true,
            labelVisible: true,
            isCollapsed: true,
            legendVisible: false,

            constructor: function (layer, map, outline) {
                this.config = Config.getInstance();
                this.layersInstance = Layers.getInstance();
                this.layer = layer;
                this.map = map;
                this.outline = outline;
            },

            postCreate: function () {
            },

            startup: function () {
                this.mapLayer = MapUtil.prototype.getLayerFromMap(this.layer.productLabel, this.map);

                this.setLayerTitle(this.layer.layerTitle);
                this.setLayerSubtitle(this.layer.subtitle);
                this.createTransparencySlider();

                if(this.layer.thumbnailImage !== "") {
                    domAttr.set(this.myLayerThumbnail, "src", this.layer.thumbnailImage);
                    domAttr.set(this.myLayerThumbnail, "alt", this.layer.layerTitle + " thumbnail");
                } else {
                    domConstruct.destroy(this.myLayerThumbnail);
                }

                on(this.myLayerToggleBox, "click", lang.hitch(this, this.toggleBoxClicked));
                on(this.btnMyLayerCollapse, "click", lang.hitch(this, this.toggleCollapsed));
                on(this.btnLayerInfo, "click", lang.hitch(this, this.showLayerInfo));
                on(this.sliderWidget, "change", lang.hitch(this, this.setLayerOpacity));
                on(this.btnMyLayerLabelsToggleBox, "click", lang.hitch(this, this.toggleLabelsClicked));

                topic.subscribe(LayerEvent.prototype.REMOVE_LAYER_CONTROL, lang.hitch(this, this.removeLayer));
                topic.subscribe(LayerEvent.prototype.TOGGLE_VISIBILITY, lang.hitch(this, this.toggleVisibility));
                topic.subscribe(LayerEvent.prototype.HIDE_LAYER, lang.hitch(this, this.hideLayer));
                topic.subscribe(LayerEvent.prototype.SHOW_LAYER, lang.hitch(this, this.showLayer));
                topic.subscribe(LayerEvent.prototype.CHANGE_OPACITY, lang.hitch(this, this.changeLayerOpacity));

                if(this.layer.layerTitle === "Nomenclature" ||
                    this.layer.layerTitle === "Graticule" ||
                    this.layer.layerTitle === "Regions" ||
                    this.layer.layerTitle === "Quadrangles Regions") {
                    domConstruct.destroy(this.flyToLayerBtn);
                    domConstruct.destroy(this.myLayerThumbnail);
                    domConstruct.destroy(this.myLayerSubtitle);
                    domConstruct.destroy(this.btnRemoveLayer);
                    domClass.remove(this.domNode, "dojoDndHandle");
                    domStyle.set(this.domNode, "cursor", "default");
                    domClass.add(this.myLayerTitle, "nomenclatureControl");
                }else if(this.layer.productType === "FeatureWaypoints" ||
                    this.layer.productType === "FeatureLinks" ||
                    this.layer.productType === "Feature") {
                    domConstruct.destroy(this.btnRemoveLayer);
                    domConstruct.destroy(this.flyToLayerBtn);
                } else {
                    on(this.flyToLayerBtn, "click", lang.hitch(this, this.flyToLayer));
                    on(this.btnRemoveLayer, "click", lang.hitch(this, this.removeLayerClicked));
                    topic.subscribe(MapEvent.prototype.BEGIN_TOUR_3D, lang.hitch(this, this.begin3DTour));
                    topic.subscribe(MapEvent.prototype.EXIT_TOUR_3D, lang.hitch(this, this.exit3DTour));
                }

                if(this.layer.layerTitle != "Regions"){
                    domConstruct.destroy(this.btnMyLayerLabelsToggleBox);
                }else{
                  if(this.btnMyLayerLabelsToggleBox) {
                      domStyle.set(this.btnMyLayerLabelsToggleBox, "color", "#ffff00");
                  }
                }

                if (this.layer.description == undefined || this.layer.description === "") {
                    domClass.add(this.btnLayerInfo, "hidden");
                }

                if(this.layer.colorbar) {
                    var colorLegend = new ColorLegendControl(this.layer.colorbar);
                    colorLegend.startup();
                    domConstruct.place(colorLegend.domNode, this.colorLegendControlContainer);

                    this.mapLayer.colorLegend = colorLegend;
                    colorLegend.mapLayer = this.mapLayer;
                }

                this.initializeLayer();

                topic.publish(LayerEvent.prototype.LAYER_CONTROL_LOADED, {projection: this.layer.layerProjection});
            },

            setLayerTitle: function(title) {
                this.myLayerTitle.innerHTML = title;
            },

            setLayerSubtitle: function(subtitle) {
                var subtitleText = subtitle;
                if (subtitleText.length > 21){
                    subtitleText = subtitleText.substring(0, 21);
                    subtitleText += "...";
                }

                domAttr.set(this.myLayerSubtitle, "title", subtitle);
                this.myLayerSubtitle.innerHTML = subtitleText;
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

            showLayerInfo: function(evt) {
                if(this.layer.description) {
                    xhr(this.layer.description)
                    .then(lang.hitch(this, function(content) {
                        var title = "";

                        if(this.layer.mission) {
                            title += this.layer.mission;
                        }

                        if(this.layer.instrument) {
                            title += " - " + this.layer.instrument;
                        }

                        if(this.layer.layerTitle) {
                            if(title) {
                                title += " - ";
                            }
                            title += this.layer.layerTitle;
                        }

                        topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                            title: title,
                            content: content,
                            size: "lg"
                        });
                    }));
                }
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
                    style: "height: 4px;width:48%;margin-left:40.5%;"
                }, rulesNode);

                var labelsNode = domConstruct.place("<div></div>", this.sliderContainer, "after");
                var sliderLabels = new HorizontalRuleLabels({
                    container: "rightDecoration",
                    labelStyle: "color: #fff;font-size:9px;",
                    style: "width:48%;margin-left:40%"
                }, labelsNode);

                this.sliderWidget = new HorizontalSlider({
                    id: "slider_" + this.layer.productLabel,
                    name: "slider_" + this.layer.productLabel,
                    containerNode: "sliderContainer",
                    value: sliderValue,
                    minimum: 0,
                    maximum: 100,
                    style: "width:50%;margin-left:40%;",
                    showButtons: false,
                    intermediateChanges: true
                }, this.sliderContainer);

                this.sliderWidget.startup();
                sliderRules.startup();
                sliderLabels.startup();
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

            initializeLayer: function(){
                MapUtil.prototype.showLayer(this.mapLayer);
                MapUtil.prototype.addLayerPolygon(this.outline, this.map);
                topic.publish(LayerEvent.prototype.SHOW_LAYER, {"layer": this.layer});
                this.layerVisible = true;

                if(this.myLayerToggleBox) {
                    domClass.remove(this.myLayerToggleBox, "fa-eye-slash");
                    domClass.add(this.myLayerToggleBox, "fa-eye");
                    domStyle.set(this.myLayerContainer, "background-color", "#001e33");
                    domStyle.set(this.myLayerContainer, "color", "#c8c8c8");
                }
            },

            showLayer: function(evt) {
                if(evt.layer.productLabel === this.mapLayer.id) {
                    MapUtil.prototype.showLayer(this.mapLayer);
                    MapUtil.prototype.addLayerPolygon(this.outline, this.map);
                    this.layerVisible = true;

                    if(this.myLayerToggleBox) {
                        domClass.remove(this.myLayerToggleBox, "fa-eye-slash");
                        domClass.add(this.myLayerToggleBox, "fa-eye");
                        domStyle.set(this.myLayerContainer, "background-color", "#001e33");
                        domStyle.set(this.myLayerContainer, "color", "#c8c8c8");
                    }
                }
            },

            hideLayer: function(evt) {
                if(evt.layer.productLabel === this.mapLayer.id) {
                    MapUtil.prototype.removeLayerPolygon(this.outline, this.map);
                    MapUtil.prototype.hideLayer(this.mapLayer);

                    this.layerVisible = false;

                    if(this.myLayerToggleBox) {
                        domClass.remove(this.myLayerToggleBox, "fa-eye");
                        domClass.add(this.myLayerToggleBox, "fa-eye-slash");
                        domStyle.set(this.myLayerContainer, "background-color", "#003d68");
                        domStyle.set(this.myLayerContainer, "color", "#999999");
                    }
                }
            },

            toggleVisibility: function(evt) {
                if(evt.layer.productLabel === this.layer.productLabel) {
                    this.toggleBoxClicked();
                }
            },

            toggleBoxClicked: function(evt) {
                if(!this.layerVisible) {
                    this.initializeLayer();
                } else {
                    topic.publish(LayerEvent.prototype.HIDE_LAYER, {"layer": this.layer});
                }
            },

            toggleLabelsClicked: function(evt){
                var labelLayer = MapUtil.prototype.getLayerFromMap(this.layer.productLabel + "Label", this.map);
                if(!this.labelVisible){
                    this.labelVisible = true;
                    domStyle.set(this.btnMyLayerLabelsToggleBox, "color", "#ffff00");
                    labelLayer.show();
                }
                else{
                    this.labelVisible = false;
                    domStyle.set(this.btnMyLayerLabelsToggleBox, "color", "#4b79bf");
                    labelLayer.hide();
                }
            },

            toggleCollapsed: function(evt) {
                if(this.isCollapsed) {
                    domClass.remove(this.btnMyLayerCollapse, "fa-caret-right");
                    domClass.add(this.btnMyLayerCollapse, "fa-caret-down");
                    AnimationUtil.prototype.wipeInAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = false;
                } else {
                    domClass.remove(this.btnMyLayerCollapse, "fa-caret-down");
                    domClass.add(this.btnMyLayerCollapse, "fa-caret-right");
                    AnimationUtil.prototype.wipeOutAnimation(this.myLayerControlsContainer);
                    this.isCollapsed = true;
                }
            },

            toggleLegend: function(evt) {
                if(this.legendVisible) {
                    domClass.add(this.legendContainer, "hidden");
                    this.legendVisible = false;
                } else {
                    domClass.remove(this.legendContainer, "hidden");
                    this.legendVisible = true;
                }
            },

            removeLayer: function(evt){
                if (evt.layer.productLabel === this.layer.productLabel){
                    this.removeLayerClicked(evt);
                }
            },

            removeLayerClicked: function(evt) {
                //hide tooltips so they dont get orphaned and stuck on the screen
                query(".tooltip").style("display", "none");

                MapUtil.prototype.removeLayerFromMap(this.layer.productLabel, this.map);
                //MapUtil.prototype.removeLayerPolygon(this.outline, this.map);
                topic.publish(LayerEvent.prototype.REMOVE_FROM_MY_DATA, {"layer": this.layer});
                topic.publish(LayerEvent.prototype.RESET_LAYER_OPTIONAL_CONTROL,{"layer": this.layer});

                this.destroy();
            },

            //Hide the components that may interrupt the 3D flyover.
            begin3DTour: function() {
                if(this.flyToLayerBtnContainer)
                    domStyle.set(this.flyToLayerBtnContainer, "display", "none");
            },

            //Shows the components that were hidden during the 3D flyover.
            exit3DTour: function() {
                if(this.flyToLayerBtnContainer)
                    domStyle.set(this.flyToLayerBtnContainer, "display", "");
            }
        });
    });
