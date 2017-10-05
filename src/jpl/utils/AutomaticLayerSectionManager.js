define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/request/xhr",
    "dojo/has",
    "esri/geometry/Extent",
    "jpl/config/Config",
    "jpl/data/Layer",
    "jpl/data/AutoLayers",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "jpl/events/LayerEvent",
    "dojo/promise/all"
], function(declare, topic, lang, array, xhr, has, Extent, Config, Layer, AutoLayers, MapUtil, IndexerUtil, LayerEvent, all){
    return declare(null,{
        config: null,
        indexerUtil: undefined,
        isOn: true,
        isFootprintOn: false,
        footprintLayer: null,
        isMultipleAutoLayerSections: false,
        facetKeys: null,
        facetValues: null,
        title: null,
        projection: null,
        startZoom: null,
        footprintService: null,
        parentManager: null,
        sectionAutoLayers: null,
        layerInfo: null,
        indexToPlaceLayers: 1,


        constructor: function (layerInfo) {
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.layerInfo = layerInfo;
            this.sectionAutoLayers = [];

            this.startZoom = layerInfo.startZoom;
            if(this.startZoom){
            }
            else{
                this.startZoom = 5;
            }
        },

        setParentManager: function(parentManager){
            this.parentManager = parentManager;
        },

        createSectionInLayerSidebarNp: function(){
            topic.publish(LayerEvent.prototype.ADD_SECTION_TO_AUTO_LAYERS, {
                "facetKeys": this.facetKeys,
                "facetValues": this.facetValues,
                "name": this.name,
                "projectionString": "northpole",
                "isOn": this.isOn
            });
        },

        createSectionInLayerSidebarEq: function(){
            topic.publish(LayerEvent.prototype.ADD_SECTION_TO_AUTO_LAYERS, {
                "facetKeys": this.facetKeys,
                "facetValues": this.facetValues,
                "name": this.name,
                "projectionString": "equirect",
                "isOn": this.isOn
            });
        },

        createSectionInLayerSidebarSp: function(){
            topic.publish(LayerEvent.prototype.ADD_SECTION_TO_AUTO_LAYERS, {
                "facetKeys": this.facetKeys,
                "facetValues": this.facetValues,
                "name": this.name,
                "projectionString": "southpole",
                "isOn": this.isOn
            });
        },

        updateLayers: function(map, projectionId, layerData){
            var self = this;
            var newAutoLayers = [];
            var xhrPromises = [];
            for (var i = 0; i < layerData.length; i++) {
                if(!this.isInSectionLayerList(layerData[i].productLabel)) {

                    var servicesUrl = this.indexerUtil.createLayerServicesUrl(layerData[i].item_UUID);
                    var xhrPromise = xhr(servicesUrl, {
                        handleAs: "json",
                        headers: {"X-Requested-With": null}
                    }).then(lang.hitch(this, function (service) {
                        var layerService = service.response.docs[0];

                        var item = null;
                        for (var j = 0; j < layerData.length; j++) {
                            if (layerData[j].item_UUID == layerService.item_UUID) {
                                item = layerData[j];
                                break;
                            }
                        }

                        var layer = self.indexerUtil.createLayerByDocs(item, layerService);

                        newAutoLayers.push({
                            "layer": layer
                        });

                        return service;
                    }), function (error) {
                        throw new Error(err);
                    });
                    xhrPromises.push(xhrPromise);
                }
            }

            all(xhrPromises).then(function (results) {
                self.removeOutOfRangeLayers(map, layerData);
                for(var i = 0; i < newAutoLayers.length; i++){
                    self.sectionAutoLayers.push(newAutoLayers[i]);
                }

                topic.publish(LayerEvent.prototype.ADD_TO_AUTO_LAYERS, {
                    "layers": self.sectionAutoLayers,
                    "layerInfo": self.layerInfo,
                    "projection": projectionId,
                    "map": map
                });
            });
        },

        removeOutOfRangeLayers: function(map, layerData){
            if (layerData.length <= 0) {
                this.removeAllLayers(map);
            }
            else {
                var removeList = [];
                for(var i = 0; i< this.sectionAutoLayers.length; i++){
                    if(!this.isInLayerDataList(this.sectionAutoLayers[i].layer.productLabel, layerData)){
                        var layer = this.sectionAutoLayers[i].layer;
                        var extent = new Extent(layer.boundingBox.west, layer.boundingBox.south, layer.boundingBox.east, layer.boundingBox.north, map.extent.spatialReference);
                        if (!extent.contains(map.extent)) {
                            MapUtil.prototype.removeLayerFromMap(this.sectionAutoLayers[i].layer.productLabel, map);
                            topic.publish(LayerEvent.prototype.REMOVE_FROM_AUTO_LAYERS, {"productLabel": this.sectionAutoLayers[i].layer.productLabel, "map":map});
                            removeList.push(this.sectionAutoLayers[i].layer.productLabel);
                        }
                    }
                }
                this.removeLayersFromArrayList(removeList);
            }
        },

        isInSectionLayerList: function(productLabel){
            for(var i = 0; i < this.sectionAutoLayers.length; i++){
                if(productLabel === this.sectionAutoLayers[i].layer.productLabel){
                    return true;
                }
            }
            return false;
        },

        isInLayerDataList: function(productLabel, layerDataList){
            for(var i = 0; i < layerDataList.length; i++){
                if(productLabel === layerDataList[i].productLabel){
                    return true;
                }
            }
            return false;
        },

        removeLayersFromArrayList: function(removeList){
            for(var i = 0; i < removeList.length; i++){
                var layerToRemoveIndex = null;
                for(var j = 0, exit = false; j < this.sectionAutoLayers.length && !exit; j++){
                    if(removeList[i] === this.sectionAutoLayers[j].layer.productLabel){
                        this.sectionAutoLayers.splice(j, 1);
                        exit = true;
                    }
                }
            }
        },

        removeAllLayers: function(map){
            var removeList = [];
            for(var i = 0; i < this.sectionAutoLayers.length; i++){
                MapUtil.prototype.removeLayerFromMap(this.sectionAutoLayers[i].layer.productLabel, map);
                topic.publish(LayerEvent.prototype.REMOVE_FROM_AUTO_LAYERS, {"productLabel": String(this.sectionAutoLayers[i].layer.productLabel), "map":map});
                removeList.push(this.sectionAutoLayers[i].layer.productLabel);
            }
            this.removeLayersFromArrayList(removeList);
        },

        isGlobalData: function (doc) {
            var bboxArray = doc.bbox.split(",");
            var left = Number(bboxArray[0]);
            var bottom = Number(bboxArray[1]);
            var right = Number(bboxArray[2]);
            var top = Number(bboxArray[3]);

            if (doc.dataProjection === this.config.projection.EQUIRECT) {
                if (left == Number(this.config.projection.EXTENTS. EQUIRECT.xmin) &&
                    right == Number(this.config.projection.EXTENTS.EQUIRECT.xmax) &&
                    bottom == Number(this.config.projection.EXTENTS.EQUIRECT.ymin) &&
                    top == Number(this.config.projection.EXTENTS.EQUIRECT.ymax)) {
                    return true;
                } else {
                    return false;
                }
            } else if (doc.dataProjection === this.config.projection.S_POLE) {
                if (left == Number(this.config.projection.EXTENTS. S_POLE.xmin) &&
                    right == Number(this.config.projection.EXTENTS.S_POLE.xmax) &&
                    bottom == Number(this.config.projection.EXTENTS.S_POLE.ymin) &&
                    top == Number(this.config.projection.EXTENTS.S_POLE.ymax)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (left == Number(this.config.projection.EXTENTS. N_POLE.xmin) &&
                    right == Number(this.config.projection.EXTENTS.N_POLE.xmax) &&
                    bottom == Number(this.config.projection.EXTENTS.N_POLE.ymin) &&
                    top == Number(this.config.projection.EXTENTS.N_POLE.ymax)) {
                    return true;
                } else {
                    return false;
                }
            }
        },

        hideAllLayers: function(){
            for(var i = 0; i < this.sectionAutoLayers.length; i++){
                topic.publish(LayerEvent.prototype.TOGGLE_AUTO_LAYER_VISIBILITY, {
                    "layer": this.sectionAutoLayers[i].layer,
                    "toggle": false
                });
            }
        },

        showAllLayers: function(){
            for(var i = 0; i < this.sectionAutoLayers.length; i++){
                topic.publish(LayerEvent.prototype.TOGGLE_AUTO_LAYER_VISIBILITY, {
                    "layer": this.sectionAutoLayers[i].layer,
                    "toggle": true
                });
            }
        },

        changeAllLayerOpacities: function(evt){
            for(var i = 0; i < this.sectionAutoLayers.length; i++){
                topic.publish(LayerEvent.prototype.CHANGE_OPACITY, {
                    "layer": this.sectionAutoLayers[i].layer,
                    "opacity": evt.opacity
                });
            }
        }

    });
});
