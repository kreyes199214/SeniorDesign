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
    'dojo/text!./templates/TreeListItem.html',
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
    "jpl/dijit/TreeListLeafItem"
], function (declare, lang, on, xhr, dom, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, Config, Layers, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil,
             AnimationUtil, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl, TreeListLeafItem) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        treeSidebar: null,
        treeListItem: null,
        imgUrl: "",
        isContentsCollapsed: true,
        mapDijit: "",
        childListItems: [],
        TreeListItem: null,
        isLeafParent: false,
        childLeafListItems: [],
        parentItem: null,
        sliderWidget: null,

        constructor: function (treeListItem, TreeListItem) {
            this.treeListItem = treeListItem;
            this.TreeListItem = TreeListItem;
        },

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");
            this.indexerUtil = new IndexerUtil();
            this.config = Config.getInstance();
            this.layersInstance = Layers.getInstance();

            if (this.treeListItem.list) {
                if (this.treeListItem.list.length < 1) {
                    domClass.add(this.openContentsBtn, "hidden");
                    domClass.add(this.closeContentsBtn, "hidden");
                }
                else {

                    this.areChildrenOnlyLeaves = true;

                    for (var i = 0; i < this.treeListItem.list.length; i++) {
                        if (this.treeListItem.list[i].list) {
                            this.areChildrenOnlyLeaves = false;
                            i = this.treeListItem.list.length + 1;
                        }
                    }

                    if (this.areChildrenOnlyLeaves) {
                        domClass.add(this.openContentsBtn, "hidden");
                        domClass.add(this.closeContentsBtn, "hidden");

                        if (this.treeListItem.list[0].nodeType === "layerService") {
                            if(!this.treeListItem.list[0].productLabel.includes("nomenclature")){
                                this.createTransparencySlider();
                                on(this.sliderWidget, "change", lang.hitch(this, this.setLayerOpacity));
                            }
                        }
                        if (this.treeListItem.list[0].nodeType === "featureItem") {
                            domClass.add(this.title, "hidden");
                            domClass.remove(this.clickableTitle, "hidden");

                            this.childLeafListItems = [];
                            for (var i = 0; i < this.treeListItem.list.length; i++) {
                                var leafItem = this.createListLeafItem(this.treeListItem.list[i]);
                                this.childLeafListItems.push(leafItem);
                            }

                            on(this.clickableTitle, "click", lang.hitch(this, this.openItem));
                        }

                        this.isLeafParent = true;
                    }
                }

            }
            else {
            }

            this.title.innerHTML = this.treeListItem.title;
            this.clickableTitle.innerHTML = this.treeListItem.title;

            this.setContent();
            this.setListeners();
        },

        setContent: function () {
            if (this.treeListItem.list) {
                this.childListItems = [];
                var list = this.treeListItem.list;
                for (var i = 0; i < this.list.length; i++) {
                    var treeListItem = this.treeSidebar.createTreeListItem(this.list[i]);
                    treeListItem.setParent(this);
                    treeListItem.startup();
                    this.childListItems.push(treeListItem);
                    domConstruct.place(treeListItem.domNode, this.content, "last");
                }
            }
        },

        setListeners: function () {
            on(this.openContentsBtn, "click", lang.hitch(this, this.openContents));
            on(this.closeContentsBtn, "click", lang.hitch(this, this.closeContents));
            on(this.checkbox, "click", lang.hitch(this, this.checkboxClicked));
            topic.subscribe(LayerEvent.prototype.OPACITY_CHANGED, lang.hitch(this, this.changeLayerOpacity));
        },

        openContents: function () {
            domClass.add(this.openContentsBtn, "hidden");
            domClass.remove(this.closeContentsBtn, "hidden");
            domClass.remove(this.content, "hidden");
        },

        closeContents: function () {
            domClass.add(this.closeContentsBtn, "hidden");
            domClass.remove(this.openContentsBtn, "hidden");
            domClass.add(this.content, "hidden");
        },

        setTreeSidebar: function (treeSidebar) {
            this.treeSidebar = treeSidebar;
        },

        addToChildren: function (child) {
            this.childListItems.push(child);
        },

        openItem: function () {
            this.treeSidebar.openTreeListItemList(this.treeListItem, this.childLeafListItems);
        },

        checkboxClicked: function() {
            this.handleItem(this.checkbox.checked);

            this.checkChildren(this.checkbox.checked);

            if(this.parentItem) {
                this.parentItem.showCorrespondingCheckMarker();
            }
        },

        checkChildren: function(isChecked){
            for (var i=0;i<this.childListItems.length;i++) {
                this.childListItems[i].handleItem(isChecked);
                this.childListItems[i].checkChildren(isChecked);
            }
        },

        showCorrespondingCheckMarker: function(){
            var childList = [];

            if(this.isLeafParent){
                childList = this.childLeafListItems;
            }
            else {
                childList = this.childListItems;
            }

            var allChildrenAreSelected = false;
            if(childList.length > 0){
                allChildrenAreSelected = true;
                for (var i=0;i<childList.length;i++){
                    if(!childList[i].checkbox.checked){
                        allChildrenAreSelected = false;
                    }
                }
            }

            var atLeastOneChildIsSelected = false;
            for (var i=0;i<childList.length;i++){
                if(childList[i].checkbox.checked === true || childList[i].checkbox.indeterminate === true){
                    atLeastOneChildIsSelected = true;
                    i = childList.length + 1;
                }
            }

            var noChildrenAreSelected = false;
            if(childList.length > 0){
                noChildrenAreSelected = true;
                for (var i=0;i<childList.length;i++){
                    if(childList[i].checkbox.checked || childList[i].checkbox.indeterminate){
                        noChildrenAreSelected = false;
                    }
                }
            }

            if (allChildrenAreSelected) {
                this.checkbox.indeterminate = false;
                this.checkbox.checked = true;
            }

            if(!allChildrenAreSelected && atLeastOneChildIsSelected){
                this.checkbox.indeterminate = true;
                this.checkbox.checked = false;
            }

            if(!allChildrenAreSelected && !atLeastOneChildIsSelected && noChildrenAreSelected){
                this.checkbox.indeterminate = false;
                this.checkbox.checked = false;
            }

            if (this.parentItem){
                this.parentItem.showCorrespondingCheckMarker();
            }
        },

        handleItem: function (isChecked){
            this.checkbox.indeterminate = false;
            this.checkbox.checked = isChecked;

            if (this.treeListItem.list) {
                if (this.treeListItem.list.length > 0) {
                    var treeItem = this.treeListItem.list[0];

                    if (isChecked) {
                        if (treeItem.nodeType === "layerService") {
                            this.addLayer(treeItem);
                            domClass.remove(this.sliderContainerDiv, "hidden");
                        }
                    }
                    if (!isChecked) {
                        if (treeItem.nodeType === "layerService") {
                            this.removeLayer(treeItem);
                            domClass.add(this.sliderContainerDiv, "hidden");
                        }
                    }
                }
            }

            if (this.isLeafParent) {
                for (var i=0;i<this.childLeafListItems.length;i++){
                    this.childLeafListItems[i].handleItem(isChecked);
                }
            }
        },

        checkCheckboxRecursively: function () {
            for (var i = 0; i < this.childListItems.length; i++) {
                this.childListItems[i].checkbox.checked = true;
                this.childListItems[i].checkCheckboxRecursively();
            }

            this.handleItem(true);
        },

        uncheckCheckboxRecursively: function () {
            for (var i = 0; i < this.childListItems.length; i++) {
                this.childListItems[i].checkbox.checked = false;
                this.childListItems[i].uncheckCheckboxRecursively();
            }

            this.handleItem(false);
        },

        createListLeafItem: function (leafItem) {
            var treeListLeafItem = new TreeListLeafItem(leafItem);
            treeListLeafItem.setParent(this);
            treeListLeafItem.startup();
            return treeListLeafItem;
        },

        addLayer: function (treeItem) {
            var self = this;

            var projection = this.config.data.projections.equirect;
            var map = self.getMap(projection);

            if (treeItem.productLabel.includes("nomenclature")) {
                var layer = this.layersInstance.getLayerByProductLabel(treeItem.productLabel, projection, this.config.data.projections);
                MapUtil.prototype.showNomenclatureLayer(treeItem.productLabel, map);
            } else if (treeItem.layerType.includes("featureLayer")) {
                var layer = this.layersInstance.getLayerByProductLabel(treeItem.productLabel, projection, this.config.data.projections);
                MapUtil.prototype.addRegionLayerToMap(layer, map);
            } else {
                xhr(this.config.treeLayersUrl, {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function (data) {
                    var layers = data.Layers;
                    var layer;
                    for(var i = 0; i < layers.length; i++){
                        if(layers[i].productLabel === treeItem.productLabel){
                            layer = layers[i];
                            i = layers.length;
                        }
                    }

                    if (layer == null){
                        console.error("Product Label: " + treeItem.productLabel + " does not exist in tree json: " + self.config.treeLayersUrl);
                        return;
                    }

                    layer = self.indexerUtil.createLayerFromOldJson(layer);
                    MapUtil.prototype.addLayerToMap(layer, map);
                    topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer": layer});

                }, function (err) {
                    console.log("error retrieving tree layer service:" + err);
                });
            }
        },

        removeLayer: function (treeItem) {
            var self = this;
            var projection = this.config.data.projections.equirect;
            var map = self.getMap(projection);

            if (treeItem.productLabel.includes("nomenclature")) {
                MapUtil.prototype.hideNomenclatureLayer(treeItem.productLabel, map);
            } else if (treeItem.layerType.includes("featureLayer")) {
                MapUtil.prototype.removeRegionLayerFromMap(treeItem.productLabel, map);
            } else {
                MapUtil.prototype.removeLayerFromMap(treeItem.productLabel, map);
            }

            topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
                "productLabel": treeItem.productLabel,
                "projection": projection
            });
        },

        getMap: function (projection) {
            var map;
            if (projection === this.config.projection.EQUIRECT) {
                map = this.mapDijit.equirectMap;
            } else if (projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if (projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        },


        setCheckedOnAppStart: function () {
            if (this.checkbox.checked === true) {
                this.handleItem(true);
            }
            else {
                this.handleItem(false);
            }
        },

        setParent: function(treeListItem){
            this.parentItem = treeListItem;
        },

        recursivelySetIndeterminateCheckbox: function () {
            var childIsCheckedOrIndeterminate = false;

            if(this.isLeafParent){
                for (var i = 0; i < this.childLeafListItems.length; i++) {
                    if (this.childLeafListItems[i].checkbox.checked === true || this.childLeafListItems[i].checkbox.indeterminate === true) {
                        childIsCheckedOrIndeterminate = true;
                        i = this.childLeafListItems.length + 1;
                    }
                }
            }
            else {
                for (var i = 0; i < this.childListItems.length; i++) {
                    if (this.childListItems[i].checkbox.checked === true || this.childListItems[i].checkbox.indeterminate === true) {
                        childIsCheckedOrIndeterminate = true;
                        i = this.childListItems.length + 1;
                    }
                }
            }

            if(childIsCheckedOrIndeterminate){
                if(this.checkbox.checked === false){
                    this.checkbox.indeterminate = true;
                }
            }
            else{
                this.checkbox.indeterminate = false;
            }

            if (this.parentItem) {
                this.parentItem.recursivelySetIndeterminateCheckbox();
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
                style: "height: 4px;"
            }, rulesNode);

            var labelsNode = domConstruct.place("<div></div>", this.sliderContainer, "after");
            var sliderLabels = new HorizontalRuleLabels({
                container: "rightDecoration",
                labelStyle: "padding-top:4px;font-size:12px;"
            }, labelsNode);

            this.sliderWidget = new HorizontalSlider({
                id: "treeItemSlider_" + this.treeListItem.list[0].productLabel,
                name: "treeItemSlider_" + this.treeListItem.list[0].productLabel,
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
            var layer = MapUtil.prototype.getLayerFromMap(this.treeListItem.list[0].productLabel, this.getMap(this.config.data.projections.equirect));

            MapUtil.prototype.changeLayerOpacity(layer, value/100);
            topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": this.layer, "opacity": value/100});

        },

        changeLayerOpacity: function(evt) {
            var layer = MapUtil.prototype.getLayerFromMap(this.treeListItem.list[0].productLabel, this.getMap(this.config.data.projections.equirect));

            if(evt.layer.productLabel === this.treeListItem.list[0].productLabel) {
                MapUtil.prototype.changeLayerOpacity(layer, evt.opacity);
                this.sliderWidget.set('value', evt.opacity * 100);
                topic.publish(LayerEvent.prototype.OPACITY_CHANGED, {"layer": layer, "opacity": evt.opacity});
            }
        }

    });

});

