define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/parser",
    "dojo/on",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/LayersSidebar.html',
    "xstyle/css!./css/LayersSidebar.css",
    "jpl/events/NavigationEvent",
    "jpl/events/LayerEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    "jpl/data/BaseMaps",
    "jpl/data/Layers",
    "jpl/data/AutoLayers",
    "jpl/dijit/LayerItem",
    "jpl/dijit/LayerSetItem",
    "jpl/dijit/LayerItemAuto",
    "jpl/dijit/BasemapItem",
    "jpl/dijit/StaticLayerItem",
    "jpl/dijit/NonIndexerLayerItem",
    "dojo/dnd/Source",
    "dojo/_base/window",
    "dojo/NodeList-traverse"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, registry, _WidgetBase, _TemplatedMixin,
             template, css, NavigationEvent, LayerEvent, MapEvent, MapUtil, StackContainer, ContentPane, FeatureDetector,
             Config, BaseMaps, Layers, AutoLayers, LayerItem, LayerSetItem, LayerItemAuto, BasemapItem, StaticLayerItem, NonIndexerLayerItem,
             Source, win) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        containerSource: {},
        draggableContainer: null,
        currentProjection: null,

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.basemapsInstance = BaseMaps.getInstance();
            this.layersInstance = Layers.getInstance();
            this.initStackContainer();
            this.setEventHandlers();

            if(this.config.useIndexerLayers){
                this.containerSource[this.config.data.projections.northpole] = new Source("npLayersContainer", {withHandles: true});
                this.containerSource[this.config.data.projections.southpole] = new Source("spLayersContainer", {withHandles: true});
                this.containerSource[this.config.data.projections.equirect] = new Source("layersContainer", {withHandles: true});
            }
            else{
                this.containerSource[this.config.data.projections.northpole] = new Source("nonIndexerNpLayersContainer", {withHandles: true});
                this.containerSource[this.config.data.projections.southpole] = new Source("nonIndexerSpLayersContainer", {withHandles: true});
                this.containerSource[this.config.data.projections.equirect] = new Source("nonIndexerEqLayersContainer", {withHandles: true});
            }

            //default to equirect
            this.draggableContainer = this.containerSource[this.config.data.projections.equirect];
            this.currentProjection = this.config.data.projections.equirect;

            on(this.containerSource[this.config.data.projections.northpole], "Drop", lang.hitch(this, this.dropCompleted));
            on(this.containerSource[this.config.data.projections.southpole], "Drop", lang.hitch(this, this.dropCompleted));
            on(this.containerSource[this.config.data.projections.equirect], "Drop", lang.hitch(this, this.dropCompleted));

            on(this.autoLayersCheckbox, "click", lang.hitch(this, this.autoLayerCheckboxClicked));

            domClass.add(this.currentLayersListBtn, "active");

            if (!this.config.autoLayerConfig.useAutoLayers) {
                domClass.add(this.autoLayersListBtnDiv, "hidden");
            }

            this.showOrHideIndexerLayerComponents();
        },

        initStackContainer: function () {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "layersSidebarStackContainer"
            }, "layersscontainer");
        },

        addStackContainerItem: function (item, title, id) {
            this.sidebarStackContainer.addChild(
                new ContentPane({
                    title: title,
                    content: item,
                    id: id
                })
            );
        },

        setEventHandlers: function () {
            //on(this.menuSideBarLinkBack, "click", lang.hitch(this, this.backBtnPressed));

            topic.subscribe(LayerEvent.prototype.BASEMAPS_LOADED, lang.hitch(this, this.createBasemapList));
            topic.subscribe(MapEvent.prototype.MAP_INITIALIZED, lang.hitch(this, this.createStaticLayersList));
            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            topic.subscribe(MapEvent.prototype.MAXIMIZE_3D_CONTAINER, lang.hitch(this, this.projectionIn3d));
            topic.subscribe(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, lang.hitch(this, this.addToActiveLayers));
            topic.subscribe(LayerEvent.prototype.ADD_SET_TO_ACTIVE_LAYERS, lang.hitch(this, this.addSetToActiveLayers));


            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));
            on(this.currentLayersListBtn, "click", lang.hitch(this, this.openCurrentLayersList));
            on(this.autoLayersListBtn, "click", lang.hitch(this, this.openAutoLayersList));
            on(this.basemapLayersListBtn, "click", lang.hitch(this, this.openBasemapLayersList));
            on(this.addLayerBtn, "click", lang.hitch(this, this.openSearchSidebar));
        },

        showOrHideIndexerLayerComponents: function(){
            if(this.config.useIndexerLayers){
                this.showComponentsForIndexerLayers();
                this.hideComponentsForNonIndexerLayers();
            }
            else{
                this.showComponentsForNonIndexerLayers();
                this.hideComponentsForIndexerLayers();
            }
        },

        showComponentsForIndexerLayers: function(){
            //domClass.remove(this.basemapLayersListDiv, "hidden");
            domClass.remove(this.autoLayersListDiv, "hidden");
            domClass.remove(this.currentLayersListDiv, "hidden");
            domClass.remove(this.layerSectionButtons, "hidden");
            domClass.remove(this.addLayerBtn, "hidden");
        },

        hideComponentsForNonIndexerLayers: function(){
            domClass.add(this.nonindexerLayerList, "hidden");
        },

        showComponentsForNonIndexerLayers: function(){
            domClass.remove(this.nonindexerLayerList, "hidden");
        },

        hideComponentsForIndexerLayers: function(){
            domClass.add(this.layerSectionButtons, "hidden");
            domClass.add(this.basemapLayersListDiv, "hidden");
            domClass.add(this.autoLayersListDiv, "hidden");
            domClass.add(this.currentLayersListDiv, "hidden");
            domClass.add(this.addLayerBtn, "hidden");
        },

        openLayersSidebar: function (evt) {
            domClass.add(document.body, "layers-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeLayersSidebar: function (evt) {
            domClass.remove(document.body, "layers-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeThisSidebar: function () {
            this.controlBar.activateLayers();
        },

        setControlBar: function (controlBar) {
            this.controlBar = controlBar;
        },

        openCurrentLayersList: function () {
            this.closeAllLayerListButtons();
            domClass.add(query(this.basemapLayersListDiv)[0], "hidden");
            domClass.add(query(this.autoLayersListDiv)[0], "hidden");
            domClass.remove(query(this.currentLayersListDiv)[0], "hidden");
            domClass.add(this.currentLayersListBtn, "active");
            domClass.remove(this.addLayerBtn, "hidden");
        },

        openAutoLayersList: function () {
            this.closeAllLayerListButtons();
            domClass.add(query(this.basemapLayersListDiv)[0], "hidden");
            domClass.add(query(this.currentLayersListDiv)[0], "hidden");
            domClass.remove(query(this.autoLayersListDiv)[0], "hidden");
            domClass.add(this.autoLayersListBtn, "active");
            domClass.remove(this.autoLayersCheckboxContainer, "hidden");
        },

        openBasemapLayersList: function () {
            this.closeAllLayerListButtons();
            domClass.add(query(this.currentLayersListDiv)[0], "hidden");
            domClass.add(query(this.autoLayersListDiv)[0], "hidden");
            domClass.remove(query(this.basemapLayersListDiv)[0], "hidden");
            domClass.add(this.basemapLayersListBtn, "active");
        },

        closeAllLayerListButtons: function () {
            domClass.remove(this.currentLayersListBtn, "active");
            domClass.remove(this.basemapLayersListBtn, "active");
            domClass.remove(this.autoLayersListBtn, "active");

            domClass.add(this.addLayerBtn, "hidden");
            domClass.add(this.autoLayersCheckboxContainer, "hidden");
        },

        openSearchSidebar: function () {
            this.controlBar.activateSearch();
        },

        createBasemapList: function () {
            var basemapsCenter = this.basemapsInstance.centerLayerList;
            var basemapsSP = this.basemapsInstance.southLayerList;
            var basemapsNP = this.basemapsInstance.northLayerList;

            var northPoleBasemapContainer = this.nonIndexerNpBasemapContainer;
            var equirectBasemapContainer = this.nonIndexerBasemapContainer;
            var southPoleBasemapContainer = this.nonIndexerSpBasemapContainer;
            if(this.config.useIndexerLayers){
                northPoleBasemapContainer = this.npBasemapContainer;
                equirectBasemapContainer = this.basemapContainer;
                southPoleBasemapContainer = this.spBasemapContainer;
            }

            for (var i = 0; i < basemapsCenter.length; i++) {
                var basemapItem = new BasemapItem({layer: basemapsCenter[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, equirectBasemapContainer, "last");
            }
            for (var i = 0; i < basemapsNP.length; i++) {
                var basemapItem = new BasemapItem({layer: basemapsNP[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, northPoleBasemapContainer, "last");
            }
            for (var i = 0; i < basemapsSP.length; i++) {
                var basemapItem = new BasemapItem({layer: basemapsSP[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, southPoleBasemapContainer, "last");
            }
        },

        changeBasemap: function (evt) {
            console.log("changedBasemap", evt);
        },

        projectionIn3d: function (evt) {
            this.projectionChanged({"projection": this.config.data.projections.equirect});
        },

        projectionChanged: function (evt) {
            domClass.add(query(this.npBasemapContainer)[0], "hidden");
            domClass.add(query(this.spBasemapContainer)[0], "hidden");
            domClass.add(query(this.basemapContainer)[0], "hidden");

            domClass.add(query(this.npLayersContainer)[0], "hidden");
            domClass.add(query(this.spLayersContainer)[0], "hidden");
            domClass.add(query(this.layersContainer)[0], "hidden");

            domClass.add(query(this.npAutoLayersContainer)[0], "hidden");
            domClass.add(query(this.spAutoLayersContainer)[0], "hidden");
            domClass.add(query(this.autoLayersContainer)[0], "hidden");

            domClass.add(query(this.staticNpLayersContainer)[0], "hidden");
            domClass.add(query(this.staticSpLayersContainer)[0], "hidden");
            domClass.add(query(this.staticEqLayersContainer)[0], "hidden");

            domClass.add(query(this.nonIndexerNpLayersContainer)[0], "hidden");
            domClass.add(query(this.nonIndexerSpLayersContainer)[0], "hidden");
            domClass.add(query(this.nonIndexerEqLayersContainer)[0], "hidden");

            if (evt.projection === this.config.data.projections.northpole) {
                this.draggableContainer = this.containerSource[this.config.data.projections.northpole];
                this.currentProjection = this.config.data.projections.northpole;

                if(this.config.useIndexerLayers){
                    domClass.remove(query(this.npBasemapContainer)[0], "hidden");
                    domClass.remove(query(this.npLayersContainer)[0], "hidden");
                    domClass.remove(query(this.staticNpLayersContainer)[0], "hidden");
                    domClass.remove(query(this.npAutoLayersContainer)[0], "hidden");
                }
                else{
                    domClass.remove(this.nonIndexerNpLayersContainer, "hidden");
                }

            } else if (evt.projection === this.config.data.projections.southpole) {
                this.draggableContainer = this.containerSource[this.config.data.projections.southpole];
                this.currentProjection = this.config.data.projections.southpole;

                if(this.config.useIndexerLayers) {
                    domClass.remove(query(this.spBasemapContainer)[0], "hidden");
                    domClass.remove(query(this.spLayersContainer)[0], "hidden");
                    domClass.remove(query(this.spAutoLayersContainer)[0], "hidden");
                    domClass.remove(query(this.staticSpLayersContainer)[0], "hidden");
                }
                else{
                    domClass.remove(this.nonIndexerSpLayersContainer, "hidden");
                }
            } else {
                this.draggableContainer = this.containerSource[this.config.data.projections.equirect];
                this.currentProjection = this.config.data.projections.equirect;

                if(this.config.useIndexerLayers) {
                    domClass.remove(query(this.basemapContainer)[0], "hidden");
                    domClass.remove(query(this.layersContainer)[0], "hidden");
                    domClass.remove(query(this.autoLayersContainer)[0], "hidden");
                    domClass.remove(query(this.staticEqLayersContainer)[0], "hidden");
                }
                else{
                    domClass.remove(this.nonIndexerEqLayersContainer, "hidden");
                }
            }

        },

        createStaticLayersList: function (evt) {
            if(this.config.useIndexerLayers){
                this.createStaticLayerListForIndexerLayers();
            }
            else{
                this.createStaticLayerListForNonIndexerLayers();
            }
        },

        createStaticLayerListForIndexerLayers: function(){
            var staticLayersCenter = this.layersInstance.centerLayerList;
            var staticLayersSP = this.layersInstance.southLayerList;
            var staticLayersNP = this.layersInstance.northLayerList;

            for (var i = 0; i < staticLayersCenter.length; i++) {
                var staticLayerItem = new StaticLayerItem({layer: staticLayersCenter[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticEqLayersContainer, "last");
            }
            for (var i = 0; i < staticLayersNP.length; i++) {
                var staticLayerItem = new StaticLayerItem({layer: staticLayersNP[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticNpLayersContainer, "last");
            }
            for (var i = 0; i < staticLayersSP.length; i++) {
                var staticLayerItem = new StaticLayerItem({layer: staticLayersSP[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticSpLayersContainer, "last");
            }
        },

        createStaticLayerListForNonIndexerLayers: function(){
            var staticLayersCenter = this.layersInstance.centerLayerList;
            var staticLayersSP = this.layersInstance.southLayerList;
            var staticLayersNP = this.layersInstance.northLayerList;

            for (var i = 0; i < staticLayersCenter.length; i++) {
                var layerItem = this.createNonIndexerStaticLayerItem(staticLayersCenter[i]);
                this.addNonindexerLayerToContainerDiv(layerItem, this.nonIndexerEqLayersContainer);
            }
            for (var i = 0; i < staticLayersNP.length; i++) {
                var layerItem = this.createNonIndexerStaticLayerItem(staticLayersNP[i]);
                this.addNonindexerLayerToContainerDiv(layerItem, this.nonIndexerNpLayersContainer);
            }
            for (var i = 0; i < staticLayersSP.length; i++) {
                var layerItem = this.createNonIndexerStaticLayerItem(staticLayersSP[i]);
                this.addNonindexerLayerToContainerDiv(layerItem, this.nonIndexerSpLayersContainer);
            }
        },

        getMapFromLayer: function(layer){
            var map = null;
            if(layer.projection === this.config.data.projections.northpole) {
                return this.mapDijit.northPoleMap;
            }
            if(layer.projection === this.config.data.projections.southpole) {
                return this.mapDijit.southPoleMap;
            }
            if(layer.projection === this.config.data.projections.equirect){
                return this.mapDijit.equirectMap;
            }
        },

        createNonIndexerStaticLayerItem: function(layer){
            var map = this.getMapFromLayer(layer);
            return new NonIndexerLayerItem({"layer": layer, "map": map});
        },

        addNonindexerLayerToContainerDiv: function(layerItem, containerDiv){
            layerItem.startup();
            domConstruct.place(layerItem.domNode, containerDiv, "last");
            this.containerSource[layerItem.layer.layerProjection].insertNodes(false, [layerItem.domNode], true);
        },

        isInAutoLayerContainer: function (domContainer, layer) {
            var existsInContainer = false;
            if (domContainer.length > 0) {
                for (var i = 0; i < domContainer.children().length; i++) {
                    if (domContainer.children()[i].dataset.productlabel === layer.productLabel) {
                        existsInContainer = true;
                    }
                }
            }
            return existsInContainer;
        },

        addToActiveLayers: function (evt) {
            if (!evt.isBasemap) {
                var map = null;
                var layerContainerDiv = null;

                //hack for now
                if (evt.layer.projection === this.config.data.projections.northpole) {
                    map = this.mapDijit.northPoleMap;
                    layerContainerDiv = this.npLayersContainer;
                } else if (evt.layer.projection === this.config.data.projections.southpole) {
                    map = this.mapDijit.southPoleMap;
                    layerContainerDiv = this.spLayersContainer;
                } else {
                    map = this.mapDijit.equirectMap;
                    layerContainerDiv = this.layersContainer;
                }

                var layerItem = new LayerItem({layer: evt.layer, map: map});
                layerItem.startup();

                domConstruct.place(layerItem.domNode, layerContainerDiv, "last");

                this.containerSource[evt.layer.layerProjection].insertNodes(false, [layerItem.domNode], true);
            }
        },

        addSetToActiveLayers: function (evt) {
            var map = null;
            var layerContainerDiv = null;

            if (evt.layerInfo.dataProjection === this.config.data.projections.northpole) {
                map = this.mapDijit.northPoleMap;
                layerContainerDiv = this.npLayersContainer;
            }
            if (evt.layerInfo.dataProjection === this.config.data.projections.southpole) {
                map = this.mapDijit.southPoleMap;
                layerContainerDiv = this.spLayersContainer;
            }
            if (evt.layerInfo.dataProjection === this.config.data.projections.equirect) {
                map = this.mapDijit.equirectMap;
                layerContainerDiv = this.layersContainer;
            }

            layerContainerDiv = this.layersContainer;

            var layerSetItem = new LayerSetItem({layerInfo: evt.layerInfo, map: map});
            layerSetItem.startup();

            domConstruct.place(layerSetItem.domNode, layerContainerDiv, "last");

            //this.containerSource[evt.layer.layerProjection].insertNodes(false,[layerSetItem.domNode],true);
            this.containerSource[this.config.data.projections.equirect].insertNodes(false, [layerSetItem.domNode], true);
        },

        dropCompleted: function(evt) {
            var addedLayers = this.draggableContainer.getAllNodes();
            var layerList = [];

            for(var i=0; i<addedLayers.length; i++) {
                if(addedLayers[addedLayers.length-i-1].dataset.isautolayerset == "true"){

                    var setDomList = addedLayers[addedLayers.length-i-1].children[1].children[4].children[0].children;
                    var setLayerList = [];
                    for(var j = 0; j < setDomList.length; j++){
                        setLayerList.push(setDomList[j].dataset.productlabel);
                    }

                    for(var j = 0; j < setLayerList.length; j++){
                        layerList.push(setLayerList[j]);
                    }
                }
                else{
                    var pLabel = addedLayers[addedLayers.length-i-1].dataset.productlabel;
                    layerList.push(pLabel);
                }

            }

            var map = null;
            if(this.currentProjection === this.config.data.projections.northpole) {
                map = this.mapDijit.northPoleMap;
            } else if(this.currentProjection === this.config.data.projections.southpole) {
                map = this.mapDijit.southPoleMap;
            } else {
                map = this.mapDijit.equirectMap;
            }

            MapUtil.prototype.reorderLayers(layerList, map);

            topic.publish(LayerEvent.prototype.REORDER_LAYERS, {"layerList": layerList, "projection": this.currentProjection});
        },

        autoLayerCheckboxClicked: function(evt){
            var isChecked = this.autoLayersCheckbox.checked;
            topic.publish(LayerEvent.prototype.TOGGLE_AUTO_LAYERS, {"useAutoLayers":isChecked});
        }
    });
});