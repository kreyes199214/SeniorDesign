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
    "jpl/dijit/NonIndexerLayerItem",
    "jpl/dijit/BasemapItem",
    "jpl/dijit/StaticLayerItem",
    "dojo/dnd/Source"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, registry, _WidgetBase, _TemplatedMixin,
             template, css, NavigationEvent, LayerEvent, MapEvent, MapUtil, StackContainer, ContentPane, FeatureDetector,
             Config, BaseMaps, Layers, NonIndexerLayerItem, BasemapItem, StaticLayerItem, Source) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        containerSource: {},
        draggableContainer: null,

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.basemapsInstance = BaseMaps.getInstance();
            this.layersInstance = Layers.getInstance();
            this.initStackContainer();
            this.setEventHandlers();

            this.containerSource[this.config.projection.N_POLE] = new Source("npLayersContainer", {withHandles: true});
            this.containerSource[this.config.projection.S_POLE] = new Source("spLayersContainer", {withHandles: true});
            this.containerSource[this.config.projection.EQUIRECT] = new Source("layersContainer", {withHandles: true});

            //default to equirect
            this.draggableContainer = this.containerSource[this.config.projection.EQUIRECT];
            on(this.draggableContainer, "Drop", lang.hitch(this, this.dropCompleted));

            if(!this.config.autoLayerConfig.useAutoLayers){
                domClass.add(this.autoLayersListBtnDiv, "hidden");
            }
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "nonIndexerLayersSidebarStackContainer"
            }, "layersscontainer");
        },

        addStackContainerItem: function(item, title, id) {
            this.sidebarStackContainer.addChild(
                new ContentPane({
                    title: title,
                    content: item,
                    id: id
                })
            );
        },

        setEventHandlers: function(){
            //on(this.menuSideBarLinkBack, "click", lang.hitch(this, this.backBtnPressed));

            topic.subscribe(LayerEvent.prototype.BASEMAPS_LOADED, lang.hitch(this, this.createBasemapList));
            topic.subscribe(LayerEvent.prototype.LAYERS_LOADED, lang.hitch(this, this.createStaticLayersList));
            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            //topic.subscribe(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, lang.hitch(this, this.addToActiveLayers));

            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));
            on(this.currentLayersListBtn, "click", lang.hitch(this, this.openCurrentLayersList));
            on(this.basemapLayersListBtn, "click", lang.hitch(this, this.openBasemapLayersList));
        },

        openLayersSidebar: function(evt) {
            domClass.add(document.body, "layers-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeLayersSidebar: function(evt) {
            domClass.remove(document.body, "layers-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeThisSidebar: function(){
            this.controlBar.activateLayers();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        openCurrentLayersList: function(){
            domClass.add(query(this.basemapLayersListDiv)[0], "hidden");
            domClass.remove(query(this.currentLayersListDiv)[0], "hidden");
        },

        openBasemapLayersList: function(){
            domClass.add(query(this.currentLayersListDiv)[0], "hidden");
            domClass.remove(query(this.basemapLayersListDiv)[0], "hidden");
        },

        createBasemapList: function(){
            var basemapsCenter = this.basemapsInstance.centerLayerList;
            var basemapsSP = this.basemapsInstance.southLayerList;
            var basemapsNP = this.basemapsInstance.northLayerList;

            for(var i=0; i < basemapsCenter.length;i++){
                var basemapItem = new BasemapItem({layer:basemapsCenter[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, this.basemapContainer, "last");
            }
            for(var i=0; i < basemapsNP.length;i++){
                var basemapItem = new BasemapItem({layer:basemapsNP[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, this.npBasemapContainer, "last");
            }
            for(var i=0; i < basemapsSP.length;i++){
                var basemapItem = new BasemapItem({layer:basemapsSP[i]});
                basemapItem.startup();
                domConstruct.place(basemapItem.domNode, this.spBasemapContainer, "last");
            }
        },

        changeBasemap: function(evt){
          console.log("changedBasemap", evt);
        },

        projectionChanged: function(evt) {
            domClass.add(query(this.npBasemapContainer)[0], "hidden");
            domClass.add(query(this.spBasemapContainer)[0], "hidden");
            domClass.add(query(this.basemapContainer)[0], "hidden");

            domClass.add(query(this.npLayersContainer)[0], "hidden");
            domClass.add(query(this.spLayersContainer)[0], "hidden");
            domClass.add(query(this.layersContainer)[0], "hidden");

            domClass.add(query(this.staticNpLayersContainer)[0], "hidden");
            domClass.add(query(this.staticSpLayersContainer)[0], "hidden");
            domClass.add(query(this.staticLayersContainer)[0], "hidden");

            if(evt.projection === this.config.projection.N_POLE) {
                domClass.remove(query(this.npBasemapContainer)[0], "hidden");
                domClass.remove(query(this.npLayersContainer)[0], "hidden");
                domClass.remove(query(this.staticNpLayersContainer)[0], "hidden");
            } else if(evt.projection === this.config.projection.S_POLE) {
                domClass.remove(query(this.spBasemapContainer)[0], "hidden");
                domClass.remove(query(this.spLayersContainer)[0], "hidden");
                domClass.remove(query(this.staticSpLayersContainer)[0], "hidden");
            } else {
                domClass.remove(query(this.basemapContainer)[0], "hidden");
                domClass.remove(query(this.layersContainer)[0], "hidden");
                domClass.remove(query(this.staticLayersContainer)[0], "hidden");
            }

        },

        createStaticLayersList: function(evt){
            var staticLayersCenter = this.layersInstance.centerLayerList;
            var staticLayersSP = this.layersInstance.southLayerList;
            var staticLayersNP = this.layersInstance.northLayerList;

            var map = null;
            var layerContainerDiv = null;

            for(var i=0; i < staticLayersCenter.length;i++){
                layerContainerDiv = this.layersContainer;

                var layerItem = new NonIndexerLayerItem({layer:staticLayersCenter[i]});
                layerItem.startup();
                domConstruct.place(layerItem.domNode, layerContainerDiv , "last");
                this.containerSource[staticLayersCenter[i].layerProjection].insertNodes(false,[layerItem.domNode],true);
            }
            for(var i=0; i < staticLayersNP.length;i++){
                layerContainerDiv = this.npLayersContainer;

                var layerItem = new NonIndexerLayerItem({layer:staticLayersNP[i]});
                layerItem.startup();
                domConstruct.place(layerItem.domNode, layerContainerDiv , "last");
                this.containerSource[staticLayersNP[i].layerProjection].insertNodes(false,[layerItem.domNode],true);
            }
            for(var i=0; i < staticLayersSP.length;i++){
                layerContainerDiv = this.spLayersContainer;

                var layerItem = new NonIndexerLayerItem({layer:staticLayersSP[i]});
                layerItem.startup();
                domConstruct.place(layerItem.domNode, layerContainerDiv , "last");
                this.containerSource[staticLayersSP[i].layerProjection].insertNodes(false,[layerItem.domNode],true);
            }

            /*
            var staticLayersCenter = this.layersInstance.centerLayerList;
            var staticLayersSP = this.layersInstance.southLayerList;
            var staticLayersNP = this.layersInstance.northLayerList;

            for(var i=0; i < staticLayersCenter.length;i++){
                var staticLayerItem = new StaticLayerItem({layer:staticLayersCenter[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticLayersContainer, "last");
            }
            for(var i=0; i < staticLayersNP.length;i++){
                var staticLayerItem = new StaticLayerItem({layer:staticLayersNP[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticNpLayersContainer, "last");
            }
            for(var i=0; i < staticLayersSP.length;i++){
                var staticLayerItem = new StaticLayerItem({layer:staticLayersSP[i]});
                staticLayerItem.startup();
                domConstruct.place(staticLayerItem.domNode, this.staticSpLayersContainer, "last");
            }
            */
        },

        addToActiveLayers: function(evt){
            if(!evt.isBasemap) {
                var map = null;
                var layerContainerDiv = null;

                //hack for now
                if (evt.layer.projection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                    layerContainerDiv = this.npLayersContainer;
                } else if (evt.layer.projection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                    layerContainerDiv = this.spLayersContainer;
                } else {
                    map = this.mapDijit.equirectMap;
                    layerContainerDiv = this.layersContainer;
                }

                var layerItem = new LayerItem({layer: evt.layer, map: map});
                layerItem.startup();

                domConstruct.place(layerItem.domNode, layerContainerDiv , "last");

                this.containerSource[evt.layer.layerProjection].insertNodes(false,[layerItem.domNode],true);
            }
        },

        dropCompleted: function(evt) {
            var addedLayers = this.draggableContainer.getAllNodes();
            var layerList = [];

            for(var i=0; i<addedLayers.length; i++) {
                var pLabel = addedLayers[addedLayers.length-i-1].dataset.productlabel;
                layerList.push(pLabel);
            }

            var map = null;
            if(evt.projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(evt.projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            } else {
                evt.projection = this.config.projection.EQUIRECT;
                map = this.mapDijit.equirectMap;
            }

            MapUtil.prototype.reorderLayers(layerList, map);

            topic.publish(LayerEvent.prototype.REORDER_LAYERS, {"layerList": layerList, "projection": evt.projection});
        }
    });
});