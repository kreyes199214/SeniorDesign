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
    "dojo/request/xhr",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/NavigationEvent",
    "jpl/utils/MapUtil",
    "jpl/events/MapEvent",
    "jpl/utils/IndexerUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/registry",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    "jpl/dijit/ExplorerSidebarItem",
    "jpl/dijit/ExplorerSidebarListItem",
    'dojo/text!./templates/ExplorerSidebar.html',
    "xstyle/css!./css/ExplorerSidebar.css"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, xhr, _WidgetBase, _TemplatedMixin,
             NavigationEvent, MapUtil, MapEvent, IndexerUtil, StackContainer, ContentPane, registry, FeatureDetector,
             Config, ExplorerSidebarItem, ExplorerSidebarListItem, template, css) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        returnRows: 10,
        isOpen: false,
        listItemIndex: 0,
        isLoadingMore: false,
        loadingKey: "",
        projection: null,
        currentView: "map",
        currentMapMaxExtent: null,
        exploreMenuListBackStack: [],
        exploreMenuBackStackIndex: -1,
        currentExtentEvt: null,

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.projection = this.config.data.projections.equirect;
            this.currentMapMaxExtent = this.config.data.extents.equirect;
            this.initStackContainer();
            this.setUpExplorerTypeSwitching();
            this.setUpList();
            this.setEventHandlers();
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "explorersidebarStackContainer"
            }, "explorerscontainer");
        },

        setUpExplorerTypeSwitching: function(){
            if(this.config.explorer.defaultType === "" || this.config.explorer.defaultType === "explorer"){
                domClass.add(this.listDiv, "hidden");
                domClass.remove(this.explorerDiv, "hidden");

                if(this.config.explorer.allowSwitching){
                    domClass.add(this.explorerTypeSwitchButtonDivExplore, "hidden");
                    domClass.remove(this.explorerTypeSwitchButtonDivList, "hidden");
                }
            }
            if(this.config.explorer.defaultType === "list"){
                domClass.add(this.explorerDiv, "hidden");
                domClass.remove(this.listDiv, "hidden");

                if(this.config.explorer.allowSwitching){
                    domClass.add(this.explorerTypeSwitchButtonDivList, "hidden");
                    domClass.remove(this.explorerTypeSwitchButtonDivExplore, "hidden");
                }
            }
        },

        setEventHandlers: function(){
            topic.subscribe(MapEvent.prototype.MAP_MOVED, lang.hitch(this, this.updateContents));
            topic.subscribe(MapEvent.prototype.MAXIMIZE_3D_CONTAINER, lang.hitch(this, this.enter3dMode));
            topic.subscribe(MapEvent.prototype.MINIMIZE_3D_CONTAINER, lang.hitch(this, this.enterMapMode));
            topic.subscribe(MapEvent.prototype.SET_EXTENT, lang.hitch(this, this.updateContents));

            on(this.explorerTypeSwitchButtonExplore, "click", lang.hitch(this, this.showExploreDiv));
            on(this.explorerTypeSwitchButtonList, "click", lang.hitch(this, this.showListDiv));
            on(this.explorerListBackButton, "click", lang.hitch(this, this.explorerListBackClicked));
        },

        showExploreDiv: function(){
            domClass.add(this.listDiv, "hidden");
            domClass.remove(this.explorerDiv, "hidden");
            domClass.add(this.explorerTypeSwitchButtonDivExplore, "hidden");
            domClass.remove(this.explorerTypeSwitchButtonDivList, "hidden");
        },

        showListDiv: function(){
            domClass.add(this.explorerDiv, "hidden");
            domClass.remove(this.listDiv, "hidden");
            domClass.add(this.explorerTypeSwitchButtonDivList, "hidden");
            domClass.remove(this.explorerTypeSwitchButtonDivExplore, "hidden");
        },

        openExplorerSidebar: function(evt) {
            domClass.add(document.body, "explorer-sidebar-open");
            console.log("open explorer bar map", this.getCurrentMap().extent);
            if (this.currentExtentEvt)
                this.updateContents(this.currentExtentEvt);
            else
                this.updateContents({"extent":this.getCurrentMap().extent});
        },

        closeExplorerSidebar: function(evt) {
            domClass.remove(document.body, "explorer-sidebar-open");
            this.setIsOpen(false);
        },

        closeThisSidebar: function(){
            this.controlBar.activateMenu();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        updateContents: function(evt){
            this.currentExtentEvt = evt;
            if(this.isOpen) {
                this.isLoadingMore = false;
                var self = this;
                var shapeString;
                var polygonArray;
                self.listItemIndex = 0;

                //TODO - need to handle query that contains lat 90 or lat -90
                //for now, workaround is provided.  even this workaround doesn't give good result
                if (evt.extent.ymin === -90 || evt.extent.ymax === 90.0)
                    evt.shape = undefined;

                if (evt.shape) {
                    shapeString = "POLYGON((" + evt.shape.leftTop.x + " " + evt.shape.leftTop.y + "," + +evt.shape.rightTop.x + " " + evt.shape.rightTop.y + "," + +evt.shape.rightDown.x + " " + evt.shape.rightDown.y + "," + +evt.shape.leftDown.x + " " + evt.shape.leftDown.y + "," + +evt.shape.leftTop.x + " " + evt.shape.leftTop.y + "))";
                    // polygonArray = [evt.shape.leftTop.x, evt.shape.leftTop.y,
                    //     evt.shape.rightTop.x, evt.shape.rightTop.y,
                    //     evt.shape.rightDown.x, evt.shape.rightDown.y,
                    //     evt.shape.leftDown.x, evt.shape.leftDown.y];
                } else {
                    var explorerExtent = {
                        xmin:evt.extent.xmin,
                        ymin:evt.extent.ymin,
                        xmax:evt.extent.xmax,
                        ymax:evt.extent.ymax
                    };

                    var mapExtent = this.currentMapMaxExtent;

                    if(explorerExtent.xmin < mapExtent.xmin){
                        explorerExtent.xmin = mapExtent.xmin;
                    }
                    if(explorerExtent.xmax > mapExtent.xmax){
                        explorerExtent.xmax = mapExtent.xmax;
                    }
                    if(evt.extent.ymin < mapExtent.ymin){
                        explorerExtent.ymin = mapExtent.ymin;
                    }
                    if(evt.extent.ymax > mapExtent.ymax){
                        explorerExtent.ymax = mapExtent.ymax;
                    }

                    shapeString = "POLYGON((" + explorerExtent.xmin + " " + explorerExtent.ymin + "," + explorerExtent.xmax + " " + explorerExtent.ymin + "," +
                        explorerExtent.xmax + " " + explorerExtent.ymax + "," + explorerExtent.xmin + " " + explorerExtent.ymax + "," +
                        explorerExtent.xmin + " " + explorerExtent.ymin + "))";
                    // polygonArray = [explorerExtent.xmin, explorerExtent.ymin, explorerExtent.xmax, explorerExtent.ymin,
                    //     explorerExtent.xmax, explorerExtent.ymax, explorerExtent.xmin, explorerExtent.ymax];
                }


                var searchUrl = this.indexerUtil.createGetSearchItemsUrl({
                        "projection": self.projection,
                        "shape": shapeString,
                        "start": self.listItemIndex,
                        "rows": this.returnRows,
                        "explorerMode": true
                });

                // topic.publish(MapEvent.prototype.ADD_EXPLORER_HIGH_LIGHT_POLYGON,
                //         {"degreeArray": polygonArray, "type":"polygon"});

                self.listItemIndex = 0;

                xhr(searchUrl, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    //console.log("data", data);
                    if(data !== null) {
                        var docs = data.response.docs;

                        if(docs.length > 0) {
                            domClass.remove(self.explorerQueue, "hidden");
                            domClass.add(self.explorerNoResultsMessage, "hidden");

                            domConstruct.empty(self.explorerQueue);
                            topic.publish(MapEvent.prototype.REMOVE_ALL_EXPLORER_GRAPHICS, {});
                            self.explorerQueue.scrollLeft = 0;
                            for (var i = 0; i < docs.length; i++) {
                                var explorerItem = new ExplorerSidebarItem(docs[i]);
                                explorerItem.setExplorerSidebar(self);
                                explorerItem.startup();
                                domConstruct.place(explorerItem.domNode, self.explorerQueue, "last");

                                self.listItemIndex++;
                            }
                        }
                        else{
                            domClass.add(self.explorerQueue, "hidden");
                            domClass.remove(self.explorerNoResultsMessage, "hidden");
                        }
                    }else{
                        domConstruct.empty(self.explorerQueue);
                        domClass.add(self.explorerQueue, "hidden");
                        domClass.remove(self.explorerNoResultsMessage, "hidden");
                    }

                }, function (err) {
                    console.log("error retrieving explorer search results:" + err);
                });

                //var bboxString = explorerExtent.xmin + "," + explorerExtent.ymin + "," + explorerExtent.xmax + "," + explorerExtent.ymax;
                self.loadingKey = shapeString;
                if (this.loaderFunction)
                    this.loaderFunction.remove();

                this.loaderFunction = on(this.explorerQueue, "scroll", lang.hitch(this, this.loadMoreItems, {
                    shape: shapeString
                }));

            }
        },

        showExplorerItemDoc: function(doc){
            this.controlBar.showDoc(doc);
        },

        setIsOpen: function(isOpen){
            this.isOpen = isOpen;
        },

        loadMoreItems: function(parameters){
            var self = this;

            if(Math.round(self.explorerQueue.offsetWidth + self.explorerQueue.scrollLeft) >= self.explorerQueue.scrollWidth) {

                if(self.isLoadingMore === false && parameters.shape === self.loadingKey) {
                    self.isLoadingMore = true;

                    var searchUrl = this.indexerUtil.createGetSearchItemsUrl({
                        "projection": self.projection,
                        "shape": parameters.shape,
                        "start": self.listItemIndex,
                        "rows": this.returnRows,
                        "explorerMode": true
                    });

                    xhr(searchUrl, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(function (data) {
                        var docs = data.response.docs;

                        for (var i = 1; i < docs.length; i++) {
                            var docs = data.response.docs;

                            for (var i = 0; i < docs.length; i++) {
                                var explorerItem = new ExplorerSidebarItem(docs[i]);
                                explorerItem.setExplorerSidebar(self);
                                explorerItem.startup();
                                domConstruct.place(explorerItem.domNode, self.explorerQueue, "last");

                                self.listItemIndex++;
                            }
                        }

                        self.isLoadingMore = false;
                        self.isLoadingMoreKey = null;
                    });

                }

            }
        },

        projectionChanged: function(evt) {
            this.projection = evt.projection;
            var map = this.getCurrentMap();

            var extent = map.extent;
            this.updateContents({
                "extent":extent
            });
        },

        getCurrentMap: function(){
            var map;

            if (this.projection === this.config.data.projections.northpole) {
                this.projection = this.config.data.projections.northpole;
                this.currentMapMaxExtent = this.config.data.extents.northpole;
                map = this.mapDijit.northPoleMap;
            } else if (this.projection === this.config.data.projections.southpole) {
                this.projection = this.config.data.projections.southpole;
                this.currentMapMaxExtent = this.config.data.extents.southpole;
                map = this.mapDijit.southPoleMap;
            } else {
                this.projection = this.config.data.projections.equirect;
                this.currentMapMaxExtent = this.config.data.extents.equirect;
                map = this.mapDijit.equirectMap;
            }

            return map;
        },

        enter3dMode: function(){
            this.currentView = "3d";
            this.currentMapMaxExtent = this.config.data.extents.equirect;
            this.projection = this.config.data.projections.equirect;
        },

        enterMapMode: function(){
            this.currentView = "map";
        },

        setUpList: function(){
            var self = this;
            if(!this.config.services.explorerMenuUrl){
                console.log("No explorer menu service has been added to config. Please add service as explorerMenuUrl");

            }else {
                xhr(this.config.services.explorerMenuUrl, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    self.exploreMenuBackStackIndex++;
                    self.displayList(data);
                });
            }
        },

        displayList: function(obj){
            var self = this;

            if(obj.list) {
                if (obj.list.length > 0) {
                    domConstruct.empty(this.listQueue);
                    var list = obj.list;
                    list.forEach(function (listItem) {

                        if(listItem.list) {
                            var explorerItem = new ExplorerSidebarListItem(listItem);
                            explorerItem.setExplorerSidebar(self);
                            explorerItem.startup();
                            var explorerDomNode = domConstruct.place(explorerItem.domNode, self.listQueue, "last");

                            on(explorerDomNode, "click", lang.hitch(function () {
                                self.exploreMenuBackStackIndex++;
                                self.exploreMenuListBackStack.push(obj);
                                self.displayList(explorerItem.doc);
                            }));
                        }
                        else{
                            var explorerItem = new ExplorerSidebarListItem(listItem);
                            explorerItem.setExplorerSidebar(self);
                            explorerItem.startup();
                            var explorerDomNode = domConstruct.place(explorerItem.domNode, self.listQueue, "last");

                            on(explorerDomNode, "click", lang.hitch(function () {
                                console.log("open in sidebar");
                            }));
                        }
                    })
                } else {
                    console.log("empty");
                }

                this.checkIfShowBackButton();
            }
            else{

            }
        },

        explorerListBackClicked: function(){
            this.exploreMenuBackStackIndex--;
            this.displayList(this.exploreMenuListBackStack[this.exploreMenuBackStackIndex]);
            this.exploreMenuListBackStack.pop();

            this.checkIfShowBackButton();
        },

        checkIfShowBackButton: function(){
            if(this.exploreMenuBackStackIndex > 0){
                domClass.remove(this.listDivBackButtonDiv, "hidden");
            }else{
                domClass.add(this.listDivBackButtonDiv, "hidden");
            }
        }

    });
});