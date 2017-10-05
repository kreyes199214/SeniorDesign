define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/string",
    "dojo/on",
    "dojo/i18n!./nls/textContent",
    "dojo/topic",
    "dojo/query",
    "dijit/registry",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/request/xhr",
    "dojo/dom-style",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/LayerSearchResults.html',
    "xstyle/css!./css/LayerSearchResults.css",
    "jpl/dijit/LayerControl",
    "jpl/dijit/SearchResultItem",
    "jpl/data/Layer",
    "jpl/data/Layers",
    "jpl/utils/MapUtil",
    "jpl/events/BrowserEvent",
    "jpl/events/SearchEvent",
    "jpl/events/LayerEvent",
    "jpl/events/MapEvent",
    "jpl/utils/DOMUtil",
    "jpl/config/Config",
    "jpl/utils/FeatureDetector"
], function (declare, lang, string, on, textContent, topic, query, registry, dom, domAttr, domConstruct,
             domClass, xhr, domStyle, _WidgetBase, _TemplatedMixin, template, css, LayerControl,
             SearchResultItem, Layer, Layers, MapUtil, BrowserEvent, SearchEvent,
             LayerEvent, MapEvent, DOMUtil, Config, FeatureDetector) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,
            missionResults: [],
            instrumentResult: [],
            productResults: [],
            layerResults: [],
            myDataLayers: [],
            resultItemNodes: [],
            rawSearchData: [],
            selectedCategory: "mission",
            selectedCategoryValue: "",
            selectedProjectionIAU: "",
            selectedProjection: "",
            currentResultScreen: "category",
            searchType: "",
            missionFilter: "",
            instrumentFilter: "",
            productTypeFilter: "",

            containerSource: {},
            categoryType: "mission",
            projection: "",
            isTourActive: false,

            constructor: function () {
                this.detectedFeatures = FeatureDetector.getInstance();
            },

            postCreate: function () {
            },

            startup: function () {
                this.layersInstance = Layers.getInstance();
                this.mapDijit = registry.byId("mainSearchMap");
                this.config = Config.getInstance();

                topic.subscribe(LayerEvent.prototype.SET_UP_CATALOG_DATA, lang.hitch(this, this.addDefaultOptionsData));
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
                topic.subscribe(MapEvent.prototype.VIEW_3D, lang.hitch(this, this.view3DEnabled));
                topic.subscribe(MapEvent.prototype.TERRAIN_VIEW, lang.hitch(this, this.view3DEnabled));
                topic.subscribe(MapEvent.prototype.BEGIN_TOUR_3D, lang.hitch(this, this.begin3DTour));
                topic.subscribe(MapEvent.prototype.EXIT_TOUR_3D, lang.hitch(this, this.exit3DTour));

                on(this.layerSearchInput, "keyup", lang.hitch(this, this.submitSearch));
                on(this.layerSearchInputForm, "submit", lang.hitch(this, this.submitSearch));
                on(this.layerSearchBackBtn, "click", lang.hitch(this, this.returnToCategories));
                on(this.missionCategoryBtn, "click", lang.hitch(this, this.setCategoryTypeOnClick));
                on(this.instrumentCategoryBtn, "click", lang.hitch(this, this.setCategoryTypeOnClick));
                this.setTextContent();
            },

             setTextContent: function() {
                domAttr.set(this.missionCategoryBtn, "innerHTML", textContent.LayerSearchResults_missionCategoryBtn);
                domAttr.set(this.instrumentCategoryBtn, "innerHTML", textContent.LayerSearchResults_instrumentCategoryBtn);
                domAttr.set(this.layerSearchBackBtnText, "innerHTML", textContent.LayerSearchResults_layerSearchBackBtnText);
                domAttr.set(this.searchNoResultString, "innerHTML", textContent.LayerSearchResults_searchNoResultString);
            },

            submitSearch: function(evt) {
                if(evt.preventDefault){
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                if(this.layerSearchInput.value.length > 0){
                    this.showLayerSearchStatement(true);
                }
                else{
                    this.showLayerSearchStatement(false);
                }


                this.doSearch(this.layerSearchInput.value);
            },

            showLayerSearchStatement: function(show){
                if(show){
                    domStyle.set(this.resultStatement, "display", "");
                }
                else{
                    domStyle.set(this.resultStatement, "display", "none");
                }
            },

            doSearch: function(string) {
                var results = {};
                var layers = this.getLayersForCurrentProjection();
                var relevantLayers = [];

                for(var i = 0; i < layers.length; i++){
                    if (this.fieldsHaveQuery(layers[i], string)){
                        relevantLayers.push(layers[i]);
                    }
                }

                if(this.categoryType === "mission"){
                    for(var l = 0; l < relevantLayers.length; l++){
                        if(relevantLayers[l].mission.toLowerCase() !== ""){
                            if (!(relevantLayers[l].mission in results)){
                                results[relevantLayers[l].mission] = [relevantLayers[l]];
                            }
                            else{
                                results[relevantLayers[l].mission].push(relevantLayers[l]);
                            }
                        }
                    }

                    //this.displayResults(results);
                }
                else if(this.categoryType === "instrument"){
                    for(var l = 0; l < relevantLayers.length; l++){
                        if(relevantLayers[l].instrument.toLowerCase() !== ""){
                            if (!(relevantLayers[l].instrument in results)){
                                results[relevantLayers[l].instrument] = [relevantLayers[l]];
                            }
                            else{
                                results[relevantLayers[l].instrument].push(relevantLayers[l]);
                            }
                        }
                    }
                }
                else{}

                var keyLength = 0;
                for (var key in results) {
                    keyLength++;
                }

                if(keyLength > 0){
                    domStyle.set(this.searchNoResultString, "display", "none");
                }
                else{
                    domStyle.set(this.searchNoResultString, "display", "");
                    this.showLayerSearchStatement(false);
                }

                this.displayResults(results, string);
            },

            fieldsHaveQuery: function(layer, string){
                if(this.categoryType ==="mission"){
                    if(layer.mission !== undefined){
                        if(layer.mission.toLowerCase().indexOf(string.toLowerCase()) !== -1)
                            return true;
                    }
                }
                else if(this.categoryType === "instrument"){
                    if(layer.instrument !== undefined){
                        if(layer.instrument.toLowerCase().indexOf(string.toLowerCase()) !== -1)
                            return true;
                    }
                }

                if(layer.layerTitle !== undefined){
                    if(layer.layerTitle.toLowerCase().indexOf(string.toLowerCase()) !== -1)
                        return true;
                }
                if(layer.subtitle !== undefined){
                    if(layer.subtitle.toLowerCase().indexOf(string.toLowerCase()) !== -1)
                        return true;
                }

                return false;
            },

            displayResults: function(results, string){
                domConstruct.empty(this.searchResultsCategoriesList);

                //Sort groupings alphabetically
                var keys = [];
                for (k in results){
                    if (results.hasOwnProperty(k)){
                        keys.push(k);
                    }
                }
                keys.sort(function(a, b) {
                    if (a.toLowerCase() < b.toLowerCase())
                        return -1;
                    if (a.toLowerCase() > b.toLowerCase())
                        return 1;

                        return 0;
                    }
                );

                this.setResultStatement(results, string);

                //Create clickable list of sortings
                for (var i = 0; i < keys.length; i++) {
                    var node = domConstruct.toDom('<div class="searchResultsLayer list-group-item" style="height:45.2px;" value="' + keys[i] + '">' +
                        '<div class="searchResultsLayer-item">' +
                            '<div style="position:relative;top:50%;transform:translateY(-50%);">' +
                                keys[i] +
                            '</div>' +
                            '<div style="right:5px;position:absolute;top:15px;">' +
                                    '<span class="glyphicon glyphicon-chevron-right pull-right"></span>' +
                                    '<span class="badge pull-right search-result-badge">' + results[keys[i]].length + '</span>' +
                            '<div>' +
                        '</div>' +
                    '</div>');

                    domConstruct.place(node, this.searchResultsCategoriesList, "last");

                    self = this;
                    on(node, "click", function(){
                        self.showLayerSearchStatement(false);

                        var nodeKey = domAttr.get(this, "value");
                        domConstruct.empty(self.searchResultsLayerList);
                        domStyle.set(self.layerSearchInputForm, "display", "none");
                        domStyle.set(self.searchResultsCategoriesList, "display", "none");
                        domStyle.set(self.searchResultsLayerList, "display", "");
                        domStyle.set(self.layerSearchBackBtn, "display", "");

                        for(var l = 0; l < results[nodeKey].length; l++){
                            self.addLayerToList(results[nodeKey][l]);
                        }
                    });
                }

            },

            addLayerToList: function(layer) {
                var map = null,
                layerOutline = null,
                newLayerId = "optionalLayer_" + layer.productLabel;

                //hack for now
                if(layer.layerProjection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if(layer.layerProjection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                } else {
                    map = this.mapDijit.equirectMap;
                }

                var newLayerControl = new OptionalLayerControl({
                    //id: newLayerId,
                    productLabel: layer.productLabel,
                    thumbnailURL: layer.thumbnailURL,
                    layer: layer,
                    map: map,
                    outline: layerOutline,
                    projection: layer.layerProjection,
                    isTourActive: this.isTourActive
                });


                newLayerControl.startup();

                domConstruct.place (newLayerControl.domNode, this.searchResultsLayerList);

                if(!this.detectedFeatures.mobileDevice) {
                    $('[class="myLayerHeaderButtonGroup"]').tooltip({trigger: "hover",selector: "a[rel=tooltip]"});
                }

            },

            returnToCategories: function(){
                domConstruct.empty(this.searchResultsLayerList);
                domStyle.set(this.layerSearchInputForm, "display", "");
                domStyle.set(this.searchResultsCategoriesList, "display", "");
                domStyle.set(this.searchResultsLayerList, "display", "none");
                domStyle.set(this.layerSearchBackBtn, "display", "none");

                if(this.layerSearchInput.value.length > 0){
                    this.showLayerSearchStatement(true);
                }
                else{
                    this.showLayerSearchStatement(false);
                }
            },

            addDefaultOptionsData: function(evt){
                this.doSearch("");
                this.projection = this.config.projection.EQUIRECT;
            },

            setCategoryTypeOnClick: function(evt){
                this.categoryType = evt.target.value;
                this.doSearch(this.layerSearchInput.value);

                domAttr.set(this.missionCategoryBtn, "class", "btn btn-default");
                domAttr.set(this.instrumentCategoryBtn, "class", "btn btn-default");

                domAttr.set(evt.target, "class", "btn btn-default active");
            },

            projectionChanged: function(evt) {
                if(evt.projection === this.config.projection.N_POLE) {
                    this.projection = this.config.projection.N_POLE;
                } else if(evt.projection === this.config.projection.S_POLE) {
                    this.projection = this.config.projection.S_POLE;
                } else {
                    this.projection = this.config.projection.EQUIRECT;
                }

                this.returnToCategories();
                this.doSearch(this.layerSearchInput.value);
            },

            view3DEnabled: function(evt) {
                this.projectionChanged({projection: this.config.projection.EQUIRECT});
            },

            getLayersForCurrentProjection: function(){
                if (this.projection === this.config.projection.N_POLE){
                    return this.layersInstance.northLayerList;
                }
                else if(this.projection === this.config.projection.S_POLE){
                    return this.layersInstance.southLayerList;
                }
                else{
                    return this.layersInstance.centerLayerList;
                }
            },

            setCategoryButton: function(){
                if(this.getCategoryType() === "mission"){
                    domAttr.set(this.missionCategoryBtn, "class", "btn btn-default active");
                    domAttr.set(this.instrumentCategoryBtn, "class", "btn btn-default");
                }
                else{
                    domAttr.set(this.instrumentCategoryBtn, "class", "btn btn-default active");
                    domAttr.set(this.missionCategoryBtn, "class", "btn btn-default");
                }
            },

            setResultStatement: function(results, string){
                var layerResults = 0;
                var groupsContainingLayersResults = 0;
                var missionResults = 0;
                var instrumentResults = 0;

                //Count layers
                var groups = [];
                for (k in results){
                    if (results.hasOwnProperty(k)){
                        for(var i = 0; i < results[k].length; i++){
                            var layer = results[k][i];

                            var isLayerTitle = false;
                            if(layer.layerTitle !== undefined){
                                if(layer.layerTitle.toLowerCase().indexOf(string.toLowerCase()) !== -1){
                                    layerResults++;
                                    if(this.categoryType === "mission"){
                                        if (groups.indexOf(layer.mission) < 0){
                                            groups.push(layer.mission);
                                        }
                                    }
                                    else if(this.categoryType === "instrument"){
                                        if (groups.indexOf(layer.instrument) < 0){
                                            groups.push(layer.instrument);
                                        }
                                    }
                                    isLayerTitle = true;
                                }
                            }
                            if(!isLayerTitle){
                                if(layer.subtitle !== undefined){
                                    if(layer.subtitle.toLowerCase().indexOf(string.toLowerCase()) !== -1){
                                        layerResults++;
                                        if(this.categoryType === "mission"){
                                            if (groups.indexOf(layer.mission) < 0){
                                                groups.push(layer.mission);
                                            }
                                        }
                                        else if(this.categoryType === "instrument"){
                                            if (groups.indexOf(layer.instrument) < 0){
                                                groups.push(layer.instrument);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                //Count missions or instruments
                if(this.categoryType === "mission"){
                    for (var key in results) {
                        if(key.toLowerCase().indexOf(string.toLowerCase()) !== -1){
                            missionResults++;
                        }
                    }
                }
                else if(this.categoryType === "instrument"){
                    for (var key in results) {
                        if(key.toLowerCase().indexOf(string.toLowerCase()) !== -1){
                            instrumentResults++;
                        }
                    }
                }

                groupsContainingLayersResults = groups.length;

                var resultsString = "";
                if (layerResults == 1){
                    resultsString += layerResults + " Layer And ";
                }
                else{
                    resultsString += layerResults + " Layers And ";
                }

                if(this.categoryType === "mission"){
                    if (missionResults == 1){
                        resultsString += missionResults + " Mission Found";
                    }
                    else{
                        resultsString += missionResults + " Missions Found";
                    }
                }
                else if(this.categoryType === "instrument"){
                    if (instrumentResults == 1){
                        resultsString += instrumentResults + " Instrument Found";
                    }
                    else{
                        resultsString += instrumentResults + " Instruments Found";
                    }
                }
                this.resultStatement.innerHTML = resultsString;
            },

            //Hide the components that may interrupt the 3D flyover.
            begin3DTour: function() {
                this.isTourActive = true;
            },

            //Shows the components that were hidden during the 3D flyover.
            exit3DTour: function() {
                this.isTourActive = false;
            }

    });
});
