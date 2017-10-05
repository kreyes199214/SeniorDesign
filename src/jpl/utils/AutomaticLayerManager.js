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
    "jpl/utils/AutomaticLayerSectionManager",
    "jpl/events/LayerEvent",
    "dojo/promise/all"
], function(declare, topic, lang, array, xhr, has, Extent, Config, Layer, AutoLayers, MapUtil, IndexerUtil,
            AutomaticLayerSectionManager, LayerEvent, all){
    return declare(null,{
        config: null,
        isOn: true,
        areSectionManagersCreated: false,
        eqLayerSectionManagers: null,
        npLayerSectionManagers: null,
        spLayerSectionManagers: null,

        constructor: function () {
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();

            this.npLayerSectionManagers = [];
            this.eqLayerSectionManagers = [];
            this.spLayerSectionManagers = [];
        },

        startup: function(){
            topic.subscribe(LayerEvent.prototype.CREATE_MANAGER_FOR_AUTO_LAYER_SET, lang.hitch(this, this.createAutomaticLayerSectionManager));
            topic.subscribe(LayerEvent.prototype.REMOVE_MANAGER_FOR_AUTO_LAYER_SET, lang.hitch(this, this.removeAutomaticLayerSectionManager));
            topic.subscribe(LayerEvent.prototype.SHOW_ALL_AUTO_LAYERS_IN_SET, lang.hitch(this, this.showAllAutoLayersInSet));
            topic.subscribe(LayerEvent.prototype.HIDE_ALL_AUTO_LAYERS_IN_SET, lang.hitch(this, this.hideAllAutoLayersInSet));
            topic.subscribe(LayerEvent.prototype.CHANGE_AUTO_LAYER_SECTION_OPACITIES, lang.hitch(this, this.changeAllLayerOpacities));
            topic.subscribe(LayerEvent.prototype.CHECK_IF_LAYER_SET_ADDED, lang.hitch(this, this.checkIfLayerSetAdded));
        },

        createAutomaticLayerSectionManager: function(evt){
            var layerSectionManager = new AutomaticLayerSectionManager(evt.layerInfo);
            layerSectionManager.setParentManager(this);

            var managerArray = this.getAutoLayerManagerArrayForProjection(evt.layerInfo.dataProjection);
            managerArray.push(layerSectionManager);

            this.updateAutomaticLayerSectionManagers(evt.map, evt.layerInfo.dataProjection);
        },

        removeAutomaticLayerSectionManager: function(evt){
            var managerArray = this.getAutoLayerManagerArrayForProjection(evt.layerInfo.dataProjection);
            var sectionManagerItem = this.getAutoLayerSection(evt.layerInfo);

            var sectionManager = sectionManagerItem.autoLayerSection;
            var sectionManagerIndex = sectionManagerItem.autoLayerSectionIndex;

            if(sectionManagerIndex >= 0){
                sectionManager.removeAllLayers(evt.map);
                managerArray.splice(sectionManagerItem.autoLayerSectionIndex, 1);
            }
        },

        createSectionsInLayerSidebar: function(){
            for(var i = 0; i < this.eqLayerSectionManagers.length; i++){
                this.eqLayerSectionManagers[i].createSectionInLayerSidebarEq();
            }
            for(var i = 0; i < this.npLayerSectionManagers.length; i++){
                this.npLayerSectionManagers[i].createSectionInLayerSidebarNp();
            }
            for(var i = 0; i < this.spLayerSectionManagers.length; i++){
                this.spLayerSectionManagers[i].createSectionInLayerSidebarSp();
            }
        },

        mapChanged: function(map, projectionId){
            if(this.isOn) {
                this.updateAutomaticLayerSectionManagers(map, projectionId);
            }
        },

        updateAutomaticLayerSectionManagers: function(map, projectionId){
            if(this.isOn) {
                var managerList = this.getAutoLayerManagerArrayForProjection(projectionId);

                if (managerList === null) {
                    console.log("ERROR: No auto layer manager found for projection " + projectionId);
                }

                var idListString = "";
                for (var i = 0; i < managerList.length; i++){
                    if(map.getZoom() >= managerList[i].startZoom){
                        if(idListString.length < 1){
                            idListString = managerList[i].layerInfo.productLabel;
                        }
                        else{
                            idListString = idListString + "," + managerList[i].layerInfo.productLabel;
                        }
                    }
                    else{
                       if(managerList[i].sectionAutoLayers){
                           if(managerList[i].sectionAutoLayers.length > 0){
                               managerList[i].removeAllLayers(map);
                           }
                       }
                    }
                }

                if(idListString.length > 0){
                    var projName = null;
                    if (projectionId === this.config.data.projections.northpole) {
                        projName = "northpole";
                    }
                    if (projectionId === this.config.data.projections.southpole) {
                        projName = "southpole";
                    }
                    if (projectionId === this.config.data.projections.equirect) {
                        var projName = "equirect";
                    }

                    if (map.extent == undefined)
                        return;

                    var xmin = Math.max(map.extent.xmin, this.config.data.extents[projName].xmin);
                    var ymin = Math.max(map.extent.ymin, this.config.data.extents[projName].ymin);
                    var xmax = Math.min(map.extent.xmax, this.config.data.extents[projName].xmax);
                    var ymax = Math.min(map.extent.ymax, this.config.data.extents[projName].ymax);
                    var cResolution = map.getLayer(map.layerIds[0]).tileInfo.lods[map.getLevel()].resolution;
                    var minResolution = cResolution / Math.pow(2, 11);

                    var autoLayerUrl = this.indexerUtil.createGetAutoLayersUrl({
                        "projection": projectionId,
                        "bbox": xmin + "," + ymin + "," + xmax + "," + ymax,
                        "ids": idListString,
                        "resolutionMin": minResolution,
                        "intersects": true
                    });

                    var self = this;
                    xhr(autoLayerUrl, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(function (data) {
                        if (data !== null) {

                            var docs = data.response.docs;
                            var layerData = self.arrangeLayerData(docs);
                            self.updateAutomaticLayerSectionManagerLayers(layerData, map, projectionId);
                        }
                    });
                }

            }
        },

        arrangeLayerData: function(docs){
            var layerData = {};
            for(var i = 0; i < docs.length; i++){
                if(docs[i].collectionParent[0] in layerData){
                    layerData[docs[i].collectionParent[0]].push(docs[i]);
                }
                else{
                    layerData[docs[i].collectionParent[0]] = [];
                    layerData[docs[i].collectionParent[0]].push(docs[i]);
                }
            }

            return layerData;
        },

        updateAutomaticLayerSectionManagerLayers: function(layerData, map, projectionId){
            var managersList = this.getAutoLayerManagerArrayForProjection(projectionId);

            for(var i = 0; i < managersList.length; i++){
                if(managersList[i].layerInfo.item_UUID in layerData){
                    managersList[i].updateLayers(map, projectionId, layerData[managersList[i].layerInfo.item_UUID]);
                }
                else{
                    managersList[i].updateLayers(map, projectionId, []);
                }
            }
        },

        showAllAutoLayersInSet: function(evt){
            var autoLayerSectionManagerItem = this.getAutoLayerSection(evt.layerInfo);
            autoLayerSectionManagerItem.autoLayerSection.showAllLayers();
        },

        hideAllAutoLayersInSet: function(evt){
            var autoLayerSectionManagerItem = this.getAutoLayerSection(evt.layerInfo);
            autoLayerSectionManagerItem.autoLayerSection.hideAllLayers();
        },

        changeAllLayerOpacities: function(evt){
            var autoLayerSectionManagerItem = this.getAutoLayerSection(evt.layerInfo);
            autoLayerSectionManagerItem.autoLayerSection.changeAllLayerOpacities(evt);
        },

        checkIfLayerSetAdded: function(evt){
            var autoLayerSectionsArray = this.getAutoLayerManagerArrayForProjection(evt.layerInfo.dataProjection);
            for(var i = 0; i < autoLayerSectionsArray.length; i++){
                if(autoLayerSectionsArray[i].layerInfo.productLabel === evt.layerInfo.productLabel){
                    topic.publish(LayerEvent.prototype.CHECK_IF_LAYER_SET_ADDED_RESPONSE, {"layerInfo": evt.layerInfo, "isAdded":true});
                    return;
                }
            }

            topic.publish(LayerEvent.prototype.CHECK_IF_LAYER_SET_ADDED_RESPONSE, {"layerInfo": evt.layerInfo, "isAdded":false});
        },

        getAutoLayerSection: function(layerInfo){
            var autoLayerSection = null;
            var autoLayerSectionIndex = -1;
            var autoLayerSectionManagers = this.getAutoLayerManagerArrayForProjection(layerInfo.dataProjection);
            for(var i = 0, exit = false; i < autoLayerSectionManagers.length && !exit; i++){
                if(autoLayerSectionManagers[i].layerInfo.productLabel === layerInfo.productLabel){
                    autoLayerSection = autoLayerSectionManagers[i];
                    autoLayerSectionIndex = i;
                    exit = true;
                }
            }

            return {
                "autoLayerSection":autoLayerSection,
                "autoLayerSectionIndex": autoLayerSectionIndex
            };
        },

        getAutoLayerSectionByProductLabel: function(productLabel, projection){
            var autoLayerSection = null;
            var autoLayerSectionIndex = -1;
            var autoLayerSectionManagers = this.getAutoLayerManagerArrayForProjection(projection);
            for(var i = 0, exit = false; i < autoLayerSectionManagers.length && !exit; i++){
                if(autoLayerSectionManagers[i].layerInfo.productLabel === productLabel){
                    autoLayerSection = autoLayerSectionManagers[i];
                    autoLayerSectionIndex = i;
                    exit = true;
                }
            }

            return autoLayerSection;
        },

        getAutoLayerManagerArrayForProjection: function(projection){
            var autoLayerSectionManagers = null;
            if(projection === this.config.data.projections.equirect) {
                autoLayerSectionManagers = this.eqLayerSectionManagers;
            } else if(projection === this.config.data.projections.northpole) {
                autoLayerSectionManagers = this.npLayerSectionManagers;
            } else if(projection === this.config.data.projections.southpole) {
                autoLayerSectionManagers = this.spLayerSectionManagers;
            }

            return autoLayerSectionManagers;
        }

    });
});
