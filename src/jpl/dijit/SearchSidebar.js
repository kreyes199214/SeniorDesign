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
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/registry",
    "jpl/utils/FeatureDetector",
    "jpl/utils/IndexerUtil",
    "jpl/utils/BookmarkManager",
    "jpl/config/Config",
    "jpl/dijit/SearchResultField",
    "jpl/dijit/BookmarkViewer",
    "jpl/dijit/LandingSiteViewer",
    "jpl/dijit/NomenclatureViewer",
    "jpl/dijit/SSViewer",
    "jpl/dijit/SlideshowViewer",
    "jpl/dijit/LayerViewer",
    "jpl/dijit/LayerSetViewer",
    "jpl/dijit/ItemViewer",
    "jpl/data/Bookmarks",
    "jpl/data/LandingSites",
    "jpl/data/Slideshows",
    "jpl/data/Layers",
    'dojo/text!./templates/SearchSidebar.html',
    "xstyle/css!./css/SearchSidebar.css"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, xhr, _WidgetBase, _TemplatedMixin,
             NavigationEvent, MapEvent, MapUtil, StackContainer, ContentPane, registry, FeatureDetector, IndexerUtil, BookmarkManager,
             Config, SearchResultField, BookmarkViewer, LandingSiteViewer, NomenclatureViewer, SSViewer, SlideshowViewer, LayerViewer,
             LayerSetViewer, ItemViewer, Bookmarks, LandingSites, Slideshows, Layers, template, css) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        currentFacetIndex:null,
        listItemIndex: 0,
        totalResultsFound: 0,
        listItems: [],
        slideshowNavigation:[],
        returnRows: 30,
        loaderFunction: null,
        isLoadingMore: false,
        isLoadingMoreKey: null,
        facetsMap: [],
        selectedFacet: {"label":"itemType", "isOpen":false},
        viewerContainerContent: null,
        graphics: [],
        bookmarkManager: null,

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.layersInstance = Layers.getInstance();
            this.projection = this.config.projection.EQUIRECT;
            this.bookmarkManager = new BookmarkManager();
            this.initStackContainer();
            this.setEventHandlers();
            this.createSearchMenu("");

            this.setUpSearchMenuSwitching();
            this.setUpListMenu();
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "searchsidebarStackContainer"
            }, "searchscontainer");

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
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));
            on(this.searchInput, "keyup", lang.hitch(this, this.submitSearch));
            on(this.clearSearchBtn, "click", lang.hitch(this, this.clearSearch));
            on(this.searchMenuSwitchButtonToList, "click", lang.hitch(this, this.switchToListMenu));
            topic.subscribe(MapEvent.prototype.MAXIMIZE_3D_CONTAINER, lang.hitch(this, this.enter3dMode));

            if(this.config.search.bookmarksButton){
                on(this.bookmarkSearchBtn, "click", lang.hitch(this, this.searchForBookmarks));
            }
            else{
                domClass.add(this.bookmarkSearchBtn, "hidden");
            }
        },

        setUpSearchMenuSwitching: function(){
            if(this.config.search.defaultType === "" || this.config.search.defaultType === "search"){
                domClass.add(this.searchListContainer, "hidden");

                if(this.config.search.allowSwitching){
                    domClass.remove(this.searchMenuSwitchButtonToList, "hidden");
                }
            }
            if(this.config.search.defaultType === "list"){
                domClass.add(this.facetBtns, "hidden");
                domClass.add(this.subFacetsContainer, "hidden");
                domClass.add(this.resultsCounterDiv, "hidden");
                domClass.add(this.searchBarResults, "hidden");

                domClass.remove(this.searchListContainer, "hidden");

                if(this.config.search.allowSwitching){
                    domClass.add(this.searchMenuSwitchButtonToList, "hidden");
                }
                else{
                    domClass.add(this.searchBarInputArea, "hidden");
                }
            }
        },

        openSearchSidebar: function(evt) {
            domClass.add(document.body, "search-sidebar-open");
        },

        closeSearchSidebar: function(evt) {
            domClass.remove(document.body, "search-sidebar-open");
        },

        closeThisSidebar: function(){
            this.controlBar.activateSearch();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        searchKeyword: function(keyword) {
            if(this.loaderFunction) {
                this.loaderFunction.remove();
            }
            domClass.add(this.subFacetsContainer, "hidden");

            var searchInput = keyword;

            if(searchInput.trim().length > 0){
                searchInput = "*" + searchInput + "*";
            }

            this.updateSearchMenu(searchInput);

        },

        submitSearch: function(evt) {

            if(this.config.search.allowSwitching){
                this.switchToSearchMenu();
            }

            if(this.loaderFunction) {
                this.loaderFunction.remove();
            }
            domClass.add(this.subFacetsContainer, "hidden");

            var searchInput = "";
            if(evt) {
                if (evt.preventDefault) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                searchInput = evt.target.value;
            }

            this.updateSearchMenu(searchInput);

        },

        createSearchMenu: function(searchInput){
            if(this.detectedFeatures.mobileDevice){
                domClass.add(this.facetBtns, "searchSidebarFacetButtonsContainerMobile");
            }
            domConstruct.empty(this.facetBtns);
            domConstruct.empty(this.resultsList);

            this.facetsMap = [];

            //Create search url with user parameters
            var searchUrl = "";
            if(searchInput === "**"){
                searchUrl = this.indexerUtil.getFacetsUrl({
                    projection:this.projection
                });
            }else{
                searchUrl = this.indexerUtil.createGetSearchItemsUrl({
                    key:searchInput,
                    start:"0",
                    rows:this.returnRows,
                    itemType:"*",
                    projection:this.projection
                });
            }
            console.log("searchUrl", searchUrl);
            this.displaySearchResults(searchUrl, searchInput, true);
        },

        updateSearchMenu: function(searchInput){
            domConstruct.empty(this.facetBtns);
            domConstruct.empty(this.resultsList);

            var searchUrl = this.createSearchUrlFromFacetsMap(this.facetsMap, searchInput, false);
            console.log("searchUrl", searchUrl);
            this.displaySearchResults(searchUrl, searchInput);
        },

        createSearchUrlFromFacetsMap: function(facetsMap, searchInput, isLoadingOnScroll){
            var startString = "0";
            if(isLoadingOnScroll){
                startString = this.listItemIndex;
            }

            var searchUrlParameters = {};
            searchUrlParameters["key"] = searchInput;
            searchUrlParameters["start"] = startString;
            searchUrlParameters["rows"] = this.returnRows;
            searchUrlParameters["projection"] = this.projection;
            var facetKeys = "";
            var facetValues = "";

            for(var i = 0; i < this.facetsMap.length; i+=2){
                var facetLabel = this.facetsMap[i];
                var subFacetLabel = this.facetsMap[i + 1];

                if(subFacetLabel !== "All"){
                    facetKeys += facetLabel + ",";
                    facetValues += subFacetLabel + "|";

                    //searchUrlParameters['' + facetLabel + ''] = subFacetLabel;
                }
            }

            if (facetKeys != "")
                facetKeys = facetKeys.substring(0, facetKeys.length-1);
            if (facetValues != "")
                facetValues = facetValues.substring(0, facetValues.length-1);

            searchUrlParameters["facetKeys"] = facetKeys;
            searchUrlParameters["facetValues"] = facetValues;

            var searchUrl = this.indexerUtil.createGetSearchItemsUrl(searchUrlParameters);

            return searchUrl;
        },

        displaySearchResults: function(searchUrl, searchInput){
            var self = this;

            domClass.remove(self.searchBarLoadingNotice, "hidden");
            xhr(searchUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (data) {
                domClass.add(self.searchBarLoadingNotice, "hidden");
                domConstruct.empty(self.facetBtns);
                domConstruct.empty(self.resultsList);

                if(data.facet_counts) {
                    var facets = data.facet_counts.facet_fields;

                    if (self.facetsMap.length < 1) {
                        for (var key in facets) {
                            if (facets[key].length > 0) {
                                self.facetsMap.push(key);
                                self.facetsMap.push("All");
                            }
                        }
                    }


                    //checking to see if the result is empty.  if empty, all facet should show
                    var emptyResult = true;
                    for (var i = 0; i < self.facetsMap.length; i += 2) {
                        if (facets[self.facetsMap[i]].length > 0) {
                            emptyResult = false;
                        }
                    }

                    for (var i = 0; i < self.facetsMap.length; i += 2) {
                        if (facets[self.facetsMap[i]].length > 0 || emptyResult) {
                            var facetBtn = self.createFacetBtn(self.facetsMap[i], self.facetsMap[i + 1]);
                            var facetBtnItemNode = domConstruct.place(facetBtn, self.facetBtns);

                            on(facetBtnItemNode, "click", function (evt) {
                                var facet = evt.target.dataset.value;
                                var subFacets = facets["" + facet + ""];
                                self.selectedFacet.label = facet;
                                self.selectedFacet.isOpen = true;
                                domClass.remove(self.subFacetsContainer, "hidden");

                                self.createSubFacetList(subFacets, facet, searchInput);
                            });
                        }
                    }

                    if (self.selectedFacet.isOpen === true) {
                        var facet = self.selectedFacet.label;
                        var subFacets = facets["" + facet + ""];
                        domClass.remove(self.subFacetsContainer, "hidden");

                        self.createSubFacetList(subFacets, facet, searchInput);
                    }
                }

                self.removeAllPins();
                if (data.response.pin != undefined && data.response.pin) {
                    self.showPins(data.response.docs);
                }
                self.createResultsList(data, searchInput);
                //self.setResultsCounter(1, self.listItemIndex - 1, data.response.numFound);
            }, function (err) {
                domClass.remove(self.searchBarLoadingNotice, "hidden");
                console.log("error retrieving search results:" + err);
            });
        },

        createSubFacetList: function(subFacets, facet, searchInput){
            domConstruct.empty(this.subFacetsList);
            var totalForAll = 0;
            for(var j = 0; j < subFacets.length; j+=2){
                totalForAll += subFacets[j + 1];
            }

            for(var i = -2; i < subFacets.length; i++){
                if ((i % 2) == 0) {
                    var subFacetButton = null;
                    if (i == -2) {
                        subFacetButton = this.createSubFacetButton("All", "All");
                    } else {
                        subFacetButton = this.createSubFacetButton(subFacets[i] + " (" + subFacets[i + 1] + ")", subFacets[i]);
                    }
                    var listNode = domConstruct.place(subFacetButton, this.subFacetsList, "last");
                    domConstruct.place("<br />", this.subFacetsList, "last");

                    var self = this;
                    on(listNode, "click", function (evt) {
                        var subfacet = evt.target.dataset.value;
                        self.facetsMap[self.facetsMap.indexOf(facet) + 1] = subfacet;
                        self.selectedFacet.isOpen = false;
                        self.updateSearchMenu(searchInput);

                        domClass.add(self.subFacetsContainer, "hidden");
                    });
                }
            }

        },

        createSubFacetButton: function(label, subFacet){
            return '<button type="button" class="btn btn-link btn-lg subFacetButtonLink" data-value="' + subFacet + '">' +
                    label +
                '</button>';
        },

        createFacetBtn: function(facetKey, subFacet){
            var facetText = this.getFacetText(facetKey);
            return '<button type="button" class="btn btn-default btn-lg facetBtn" data-value="' + facetKey + '">' +
                        facetText +
                        '<br /><span class="facetBtnSubText" data-value="' + facetKey + '">'+ subFacet + '</span>' +
                    '</button>';
        },

        //workaround for now.  this should be in the configuration
        getFacetText: function(string){
            var facetText = "";
            if(string === "itemType"){
                facetText = "Item Type";
            }
            if(string === "productType"){
                facetText = "Product Type";
            }
            if(string === "mission"){
                facetText = "Mission";
            }
            if(string === "instrument"){
                facetText = "Instrument";
            }
            if(string === "bestOfMars"){
                facetText = "Best of Mars";
            }
            if(string === "landforms"){
                facetText = "Landforms";
            }
            return facetText;
        },

        createResultsList: function(data, searchInput){
            var docs = data.response.docs;
            if(this.loaderFunction) {
                this.loaderFunction.remove();
            }

            var self = this;
            var unorderedList = '<ul class="list-group"></ul>';
            var listNode = domConstruct.place(unorderedList, this.resultsList, "only");

            this.listItems = [];

            var noResults = false;
            if(docs){
                if(docs.length === 0){
                    domClass.remove(this.noResultsMessage, "hidden");
                    noResults = true;
                }
                else{
                    domClass.add(this.noResultsMessage, "hidden");
                }
            }
            else{
                domClass.add(this.noResultsMessage, "hidden");
                noResults = true;
            }

            this.listItemIndex = 0;
            this.totalResultsFound = data.response.numFound;
            for (var i = 0; i < docs.length; i++) {

                this.listItems.push(docs[i]);

                var docItem = this.createDocItem(i, docs[i]);
                var listCategoryItemNode = domConstruct.place(docItem, listNode);

                on(listCategoryItemNode, "click", function (e) {
                    var id = e.target.dataset.id;
                    var itemType = e.target.dataset.itemtype;

                    if(itemType === "product"){
                        self.openLayer(self.listItems[id]);
                    }
                    else if(itemType === "nomenclature"){
                        self.openNomenclature(self.listItems[id]);
                    }
                    else if(itemType === "slideshow"){
                        self.openItem(self.listItems[id]);
                    }
                    else if(itemType === "feature"){
                        self.openItem(self.listItems[id]);
                    }
                    else if(itemType === "manifest") {
                        self.openItem(self.listItems[id]);
                    }
                    else if(itemType === "bookmark"){
                        self.openBookmark(self.listItems[id]);
                    }
                    else if(itemType === "dataset"){
                        self.openLayerSet(self.listItems[id]);
                    }
                });

                this.listItemIndex++;

            }

            /*TESTING NEW LAYER SET*/
            /*var layerSetExample = {
                "title": "Layer set test",
                "itemType": "layerSet"
            };
            this.listItems.push(layerSetExample);
            var docItem = this.createDocItem(i, layerSetExample);
            var listCategoryItemNode = domConstruct.place(docItem, listNode);

            on(listCategoryItemNode, "click", function (e) {
                var id = e.target.dataset.id;
                var itemType = e.target.dataset.itemtype;

                if(itemType === "autolayer"){
                    self.openLayerSet(self.listItems[id]);
                }
            });*/

            /*END TESTING NEW LAYER SET*/

            self.loaderFunction = on(this.searchBarResults, "scroll", lang.hitch(this, this.loadMoreItems, {
                key:searchInput,
                listNode:listNode
            }));

            if(noResults){
                self.setResultsCounter(-1, -1, data.response.numFound);
            }
            else {
                self.setResultsCounter(0, self.listItemIndex, data.response.numFound);
            }
        },

        loadMoreItems: function(parameters){
            var self = this;

            if(self.searchBarResults.offsetHeight + self.searchBarResults.scrollTop >= self.searchBarResults.scrollHeight) {

                if(self.listItemIndex < self.totalResultsFound) {
                    if (self.isLoadingMore === false) {
                        self.isLoadingMore = true;
                        self.isLoadingMoreKey = parameters.key;

                        var searchInput = parameters.key;
                        var listNode = parameters.listNode;
                        var searchUrl = this.createSearchUrlFromFacetsMap(this.facetsMap, searchInput, true);
                        console.log("load more items url", searchUrl);


                        domClass.remove(self.resultsContainerLoadingNotice, "hidden");
                        xhr(searchUrl, {
                            handleAs: "json",
                            headers: {
                                "X-Requested-With": null
                            }
                        }).then(function (data) {
                                domClass.add(self.resultsContainerLoadingNotice, "hidden");
                                var docs = data.response.docs;

                                for (var i = 0; i < docs.length; i++) {
                                    self.listItems.push(docs[i]);

                                    var docItem = self.createDocItem(self.listItemIndex, docs[i]);
                                    var listCategoryItemNode = domConstruct.place(docItem, listNode);

                                    on(listCategoryItemNode, "click", function (e) {
                                        var id = e.target.dataset.id;
                                        var itemType = e.target.dataset.itemtype;

                                        if (itemType === "product") {
                                            self.openLayer(self.listItems[id]);
                                        }
                                        if (itemType === "nomenclature") {
                                            self.openNomenclature(self.listItems[id]);
                                        }
                                        if (itemType === "slideshow") {
                                            self.openSlideshow(self.listItems[id]);
                                        }
                                        else if (itemType === "feature") {
                                            self.openItem(self.listItems[id]);
                                        }
                                        else if (itemType === "manifest") {
                                            self.openItem(self.listItems[id]);
                                        }
                                        else if(itemType === "dataset"){
                                            self.openItem(self.listItems[id]);
                                        }
                                    });

                                    self.listItemIndex++;
                                }

                                if (docs.length > 0) {
                                    //self.setResultsCounter(1, self.listItemIndex, data.response.numFound);
                                    self.setResultsCounter(0, self.listItemIndex, data.response.numFound);
                                }
                                else {
                                    //self.setResultsCounter(0, self.listItemIndex, data.response.numFound);
                                    self.setResultsCounter(0, self.listItemIndex, data.response.numFound);
                                }

                                self.isLoadingMore = false;
                                self.isLoadingMoreKey = null;
                            },
                            function (err) {
                                domClass.remove(self.resultsContainerLoadingNotice, "hidden");
                                self.isLoadingMore = false;
                                self.isLoadingMoreKey = null;
                            });
                    }
                }

            }
        },

        createDocItem: function(listItemIndex, doc){
            if(doc.itemType === "layer"){
                return this.createLayerDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "product"){
                return this.createLayerDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "feature"){
                //to do.  need to make docitem for
                return this.createFeatureDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "manifest"){
                return this.createFeatureDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "nomenclature"){
                return this.createNomenclatureDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "slideshow"){
                return this.createItemDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "feature"){
                return this.createItemDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "manifest"){
                return this.createItemDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "bookmark"){
                return this.createBookmarkDocItem(listItemIndex, doc);
            }
            if(doc.itemType === "dataset"){
                return this.createLayerSetDocItem(listItemIndex, doc);
            }

            console.log("Search Sidbar: " + doc.itemType + " item type does not exist");
        },

        createLayerDocItem: function(listItemIndex, doc){
            var iconLine = "";
            if (doc.productType == "DEM") {
                iconLine = '<span data-dojo-attach-point="icon" class="fa fa-file bookmarkSearchResultItemIcon"></span>';
            } else {
                imgUrl = this.indexerUtil.createThumbnailUrl(doc.thumbnailURLDir, "120");
                iconLine = '<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imgUrl + '">';
            }
            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                iconLine +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        createLayerSetDocItem: function(listItemIndex, doc){
            var iconLine = "";
            iconLine = '<span data-dojo-attach-point="icon" class="icon-layers3 layerSetSearchResultItemIcon"></span>';

            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                iconLine +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
                '</li>';
        },

        createBookmarkDocItem: function(listItemIndex, doc){
            //var iconLine = "";
            //var imgUrl = "";
            // if(doc.mediaURL) {
            //     imgUrl = doc.mediaURL;
            //     //imgUrl = this.indexerUtil.createThumbnailUrl(doc.mediaUrl, "120");
            // }
            //iconLine = '<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imgUrl + '">';

            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<span data-dojo-attach-point="icon" class="fa fa-bookmark-o bookmarkSearchResultItemIcon"></span>' +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        createFeatureDocItem: function(listItemIndex, doc) {
            //should set to some default icon
            var iconLine = '<span data-dojo-attach-point="icon" class="fa fa-thumb-tack"></span>';
            if (doc.thumbnailURLDir != undefined && doc.thumbnailURLDir != "") {
                var imagePath = this.indexerUtil.createThumbnailUrl2(doc.thumbnailURLDir, doc.thumbnailType, "-hpthm");
                iconLine = '<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imagePath + '">';
            }

            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                iconLine +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        createNomenclatureDocItem: function(listItemIndex, doc){

            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<span data-dojo-attach-point="icon" class="fa fa-circle-o nomenclatureSearchResultItemIcon"></span>' +
                //'<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imgUrl + '">' +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        createItemDocItem: function(listItemIndex, doc){
            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<span data-dojo-attach-point="icon" class="fa fa-image"></span>' +
                //'<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imgUrl + '">' +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        createSlideDocItem: function(listItemIndex, doc){
            //var imgUrl = null;
            //if (doc.hasAttach) {
            //    imgUrl = "jpl/assets/images/search/image.png";
            //} else {
            //    imgUrl = "jpl/assets/images/search/circle.png";
            //}

            return '<li class="list-group-item searchResultField" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<div class="media-left" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<a href="#" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<span data-dojo-attach-point="icon" class="fa fa-image"></span>' +
                //'<img data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '" class="media-object layerListMediaImg" src="' + imgUrl + '">' +
                '</a>' +
                '</div>' +
                '<div class="media-body searchResultFieldDescription" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' +
                '<h4 class="media-heading" data-id="' + listItemIndex + '" data-itemtype="' + doc.itemType + '">' + doc.title + '</h4>' +
                //description +
                '</div>' +
                '</div>' +
            '</li>';
        },

        showSlideshowCategories: function(){
            var self = this;
            var categories = this.slideshowsInstance.categoriesList;

            var unorderedList = '<ul class="list-group"></ul>';
            var listNode = domConstruct.place(unorderedList, this.resultsList, "only");

            for(var i=0; i<categories.length; i++){
                var categoryItem = '<li class="list-group-item searchResultField" data-id="' + i + '">' +
                    '<span class="badge searchResultFieldBadge" data-id="' + i + '">' + 0 + '</span>' +
                    '<span class="searchResultFieldLabel" data-id="' + i + '">' + categories[i]._title +  '</span>' +
                    '</li>';

                var listCategoryItemNode = domConstruct.place(categoryItem, listNode);

                on(listCategoryItemNode, "click", function(e) {
                    self.slideshowNavigation.push(e.target.dataset.id);
                    self.showSlideshowSubCategories();
                });
            }
        },
        showSlideshowSubCategories: function(){
            var self = this;
            var unorderedList = '<ul class="list-group"></ul>';
            var listNode = domConstruct.place(unorderedList, self.resultsList, "only");

            var id = this.slideshowNavigation[0];
            var subcategories = this.slideshowsInstance.categoriesList[id].SubCategory;

            if(!this.isArray(subcategories)){
                var subCategoryItem = '<li class="list-group-item searchResultField" data-id="' + 0 + '">' +
                    '<span class="badge searchResultFieldBadge" data-id="' + 0 + '">' + 0 + '</span>' +
                    '<span class="searchResultFieldLabel" data-id="' + 0 + '">' + subcategories._title + '</span>' +
                    '</li>';

                var listSubCategoryItemNode = domConstruct.place(subCategoryItem, listNode);

                on(listSubCategoryItemNode, "click", function(e) {
                    self.slideshowNavigation.push(e.target.dataset.id);
                    self.showSlideshowCollection();
                });
            }else{
                for(var i=0; i<subcategories.length; i++){
                    var subCategoryItem = '<li class="list-group-item searchResultField" data-id="' + i + '">' +
                        '<span class="badge searchResultFieldBadge" data-id="' + i + '">' + 0 + '</span>' +
                        '<span class="searchResultFieldLabel" data-id="' + i + '">' + subcategories[i]._title + '</span>' +
                        '</li>';

                    var listSubCategoryItemNode = domConstruct.place(subCategoryItem, listNode);

                    on(listSubCategoryItemNode, "click", function(e) {
                        self.slideshowNavigation.push(e.target.dataset.id);
                        self.showSlideshowCollection();
                    });
                }
            }
        },
        isArray: function(subCategory){
            if(!Array.isArray(subCategory))
                return false;
            else
                return true;
        },
        showSlideshowCollection: function(){
            var self = this;
            var unorderedList = '<ul class="list-group"></ul>';
            var listNode = domConstruct.place(unorderedList, self.resultsList, "only");

            var categoryId = this.slideshowNavigation[0];
            var subCategoryId = this.slideshowNavigation[1];

            var collection = null;
            var subCategory = this.slideshowsInstance.categoriesList[categoryId].SubCategory;
            if(!this.isArray(subCategory)) {
                collection = subCategory.Collection;
            }else {
                collection = subCategory[subCategoryId].Collection;
            }

            if(!this.isArray(collection)) {
                var imgUrl = collection.ImageURL.substring(0, collection.ImageURL.lastIndexOf(".")) + "-thm" + collection.ImageURL.substring(collection.ImageURL.lastIndexOf("."), (collection.ImageURL.length));
                var description = collection.Description;
                var title = collection.Title;
                var collectionItem = '<li class="list-group-item searchResultField" data-id="' + 0 + '">' +
                                    '<div class="media" data-id="' + 0 + '">' +
                                        '<div class="media-left" data-id="' + 0 + '">' +
                                            '<a href="#" data-id="' + 0 + '">' +
                                                '<img data-id="' + 0 + '" class="media-object" src="' + imgUrl + '" alt="' + title + '">' +
                                            '</a>' +
                                        '</div>' +
                                        '<div class="media-body searchResultFieldDescription" data-id="' + 0 + '">' +
                                            '<h4 class="media-heading" data-id="' + 0 + '">' + title + '</h4>' +
                                            description +
                                        '</div>' +
                                    '</div>';
                                '</li>';

                var listCollectionItemNode = domConstruct.place(collectionItem, listNode);

                on(listCollectionItemNode, "click", function (e) {
                    self.slideshowNavigation.push(e.target.dataset.id);
                    self.showSlideshowOrManifest();
                });
            }
            else{
                for(var i=0; i<collection.length; i++){
                    var imgUrl = collection[i].ImageURL.substring(0, collection[i].ImageURL.lastIndexOf(".")) + "-thm" + collection[i].ImageURL.substring(collection[i].ImageURL.lastIndexOf("."), (collection[i].ImageURL.length));
                    var description = collection[i].Description;
                    var title = collection[i].Title;

                    var collectionItem = '<li class="list-group-item searchResultField" data-id="' + i + '">' +
                                            '<div class="media" data-id="' + i + '">' +
                                                '<div class="media-left" data-id="' + i + '">' +
                                                    '<a href="#" data-id="' + i + '">' +
                                                        '<img data-id="' + i + '" class="media-object" src="' + imgUrl + '" alt="' + title + '">' +
                                                    '</a>' +
                                                '</div>' +
                                                '<div class="media-body searchResultFieldDescription" data-id="' + i + '">' +
                                                    '<h4 class="media-heading" data-id="' + i + '">' + title + '</h4>' +
                                                        description +
                                                '</div>' +
                                            '</div>';
                                        '</li>';
                    var listCollectionItemNode = domConstruct.place(collectionItem, listNode);

                    on(listCollectionItemNode, "click", function (e) {
                        self.slideshowNavigation.push(e.target.dataset.id);
                        self.showSlideshowOrManifest();
                    });
                }
            }
        },
        showSlideshowOrManifest: function(){
            var self = this;
            var unorderedList = '<ul class="list-group"></ul>';
            var listNode = domConstruct.place(unorderedList, self.resultsList, "only");

            var categoryId = this.slideshowNavigation[0];
            var subCategoryId = this.slideshowNavigation[1];
            var collectionId = this.slideshowNavigation[2];

            var collection = null;

            var subCategory = this.slideshowsInstance.categoriesList[categoryId].SubCategory;
            if(!this.isArray(subCategory)) {
                collection = subCategory.Collection;
            }else {
                collection = subCategory[subCategoryId].Collection;
            }
            if(this.isArray(collection)){
                collection = collection[collectionId];
            }

            if(collection.Slideshow){
                this.showSlideshow();
            }
            if(collection.Manifest){
                var manifestUrl = collection.Manifest;
                xhr(manifestUrl, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    var slideshows = data.SLIDESHOWS;
                    for(var i=0; i<slideshows.length; i++){
                        var imgUrl = slideshows[i].MAINIMAGEURL.substring(0, slideshows[i].MAINIMAGEURL.lastIndexOf(".")) + "-thm" + slideshows[i].MAINIMAGEURL.substring(slideshows[i].MAINIMAGEURL.lastIndexOf("."), (slideshows[i].MAINIMAGEURL.length));
                        var description = slideshows[i].DESCRIPTION;
                        var title = slideshows[i].SLIDESHOWTITLE;

                        var collectionItem = '<li class="list-group-item searchResultField" data-id="' + i + '">' +
                                                '<div class="media" data-id="' + i + '">' +
                                                    '<div class="media-left" data-id="' + i + '">' +
                                                        '<a href="#" data-id="' + i + '">' +
                                                            '<img data-id="' + i + '" class="media-object" src="' + imgUrl + '" alt="' + title + '">' +
                                                        '</a>' +
                                                    '</div>' +
                                                    '<div class="media-body searchResultFieldDescription" data-id="' + i + '">' +
                                                        '<h4 class="media-heading" data-id="' + i + '">' + title + '</h4>' +
                                                            description +
                                                    '</div>' +
                                                '</div>' +
                                            '</li>';
                        var listCollectionItemNode = domConstruct.place(collectionItem, listNode);

                        on(listCollectionItemNode, "click", function (e) {
                            self.slideshowNavigation.push(e.target.dataset.id);
                            self.showSlideshow();
                        });
                    }
                }, function (err) {
                    throw new Error("Could not retrieve manifest from (" + url + ") - " + err);
                });
            }
        },

        showSlideshow: function(){
            var self = this;

            var categoryId = this.slideshowNavigation[0];
            var subCategoryId = this.slideshowNavigation[1];
            var collectionId = this.slideshowNavigation[2];
            var slideshowId = null;
            if(this.slideshowNavigation.length >= 4){
                slideshowId = this.slideshowNavigation[3]
            }

            var collection = null;

            var subCategory = this.slideshowsInstance.categoriesList[categoryId].SubCategory;
            if(!this.isArray(subCategory)) {
                collection = subCategory.Collection;
            }else {
                collection = subCategory[subCategoryId].Collection;
            }
            if(this.isArray(collection)){
                collection = collection[collectionId];
            }

            if(collection.Slideshow){
                var slideshowUrl = collection.Slideshow;
                this.openSlideshow(slideshowUrl, collection.Title);
            }
            if(collection.Manifest){
                var manifestUrl = collection.Manifest;
                xhr(manifestUrl, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    var slideshows = data.SLIDESHOWS;
                    var slideshow = slideshows[slideshowId];

                    var slideshowUrlPieces = manifestUrl.split("/");
                    var slideshowUrlPrefix = "";
                    for(var i=0;i<slideshowUrlPieces.length-1;i++){
                        slideshowUrlPrefix += slideshowUrlPieces[i] + "/";
                    }
                    var slideshowUrl = slideshowUrlPrefix + slideshow.URL;

                    self.openSlideshow(slideshowUrl, slideshow.SLIDESHOWTITLE);

                }, function (err) {
                    throw new Error("Could not retrieve manifest from (" + url + ") - " + err);
                });
            }

        },

        slideshowBackButtonPressed: function(evt){
            var nav = this.slideshowNavigation;
            if(nav.length > 0) {
                if (nav.length === 1) {
                    nav.pop();
                    this.showSlideshowCategories();
                }
                else if (nav.length === 2) {
                    nav.pop();
                    this.showSlideshowSubCategories();
                }
                else if (nav.length === 3) {
                    nav.pop();
                    this.showSlideshowCollection();
                }
                else if (nav.length === 4) {
                    nav.pop();
                    this.showSlideshowOrManifest();
                }
            }
            else{
                this.submitSearch();
                nav.length = 0;
                domClass.add(query(this.sideBarLinkBack)[0], "invisible");
            }
        },

        openBookmark: function(searchResult){
            this.clearViewerContainerContent();
            var bookmarkViewer = new BookmarkViewer();
            bookmarkViewer.setBookmark(searchResult);
            domConstruct.place(bookmarkViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            bookmarkViewer.setSidebar(this);
            bookmarkViewer.startup();
            this.viewerContainerContent = bookmarkViewer;
        },
        openLandingSite: function(searchResult){
            this.clearViewerContainerContent();
            var landingSiteViewer = new LandingSiteViewer();
            landingSiteViewer.setLandingSite(searchResult);
            domConstruct.place(landingSiteViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            landingSiteViewer.setSidebar(this);
            landingSiteViewer.startup();
            this.viewerContainerContent = landingSiteViewer;
        },

        openLayer: function(layerInfo){
            this.clearViewerContainerContent();
            var layerViewer = new LayerViewer();
            layerViewer.setLayerInfo(layerInfo);
            domConstruct.place(layerViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            layerViewer.setSidebar(this);
            layerViewer.startup();
            this.viewerContainerContent = layerViewer;
        },

        openLayerSet: function(layerSetInfo){
            this.clearViewerContainerContent();
            var layerSetViewer = new LayerSetViewer();
            layerSetViewer.setLayerInfo(layerSetInfo);
            domConstruct.place(layerSetViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            layerSetViewer.setSidebar(this);
            layerSetViewer.startup();
            this.viewerContainerContent = layerSetViewer;
        },

        openNomenclature: function(nomenclature){
            this.clearViewerContainerContent();
            var nomenclatureViewer = new NomenclatureViewer();
            nomenclatureViewer.setNomenclature(nomenclature);
            domConstruct.place(nomenclatureViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            nomenclatureViewer.setSidebar(this);
            nomenclatureViewer.startup();
            this.viewerContainerContent = nomenclatureViewer;
        },

        openItem: function(item){
            this.clearViewerContainerContent();
            var itemViewer = new ItemViewer();
            itemViewer.setItem(item);
            domConstruct.place(itemViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            itemViewer.setSidebar(this);
            itemViewer.startup();
            this.viewerContainerContent = itemViewer;
        },

        openSlideshow: function(slideshow){
            this.clearViewerContainerContent();
            var ssViewer = new SSViewer();
            ssViewer.setSlideshow(slideshow);
            domConstruct.place(ssViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.searchscontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            ssViewer.setSidebar(this);
            ssViewer.startup();
            this.viewerContainerContent = ssViewer;
        },

        showSearchContainer: function(){
            domClass.remove(query(this.searchscontainer)[0], "hidden");
            domClass.add(query(this.resultViewerContainer)[0], "hidden");
        },

        clearViewerContainerContent: function(){
            if(this.viewerContainerContent !== null)
                this.viewerContainerContent.cleanUp();
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

        enter3dMode: function(){
            this.projectionChanged({projection:this.config.projection.EQUIRECT});
        },

        projectionChanged: function(evt) {
            //If changing from 3d to equi or equi to 3d do nothing
            if(this.projection === evt.projection){
            }
            else{
                this.clearViewerContainerContent();
                this.projection = evt.projection;

                domClass.add(query(this.resultViewerContainer)[0], "hidden");
                domClass.remove(query(this.searchscontainer)[0], "hidden");
                var searchText = this.searchInput.value;
                this.submitSearch({"target":{"value":searchText}});
            }
        },

        showDetailByUuid: function(uuid, itemType, layer){
            var self = this;
            var searchUrl = this.indexerUtil.createGetItemByUuidUrl(uuid);
            xhr(searchUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (searchResults) {
                console.log("searchResults", searchResults);
                var docs = searchResults.response.docs;
                if(docs.length > 0){
                    if (itemType == "treeListItem") {
                        self.openItem(docs[0]);
                    }


                } else{
                    console.log("ERROR: the item_uuid " + uuid + " does not exist in indexer");
                }
            }, function (err) {
                console.log("error retrieving item_uuid results:" + err);
            });
        },

        showDetailByDbid: function(dbid, itemType, layer){
            var self = this;
            var searchUrl = self.indexerUtil.createGetItemUrl({
                extID:dbid,
                projection:layer.layerProjection
            });

            console.log("getItemUrl", searchUrl);

            xhr(searchUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (nomenclatureSearchResults) {
                var docs = nomenclatureSearchResults.response.docs;
                if(docs.length > 0){
                    if (itemType == "nomenclature")
                        self.openNomenclature(docs[0]);
                    else if (itemType == "slideshow")
                        self.openSlideshow(docs[0]);
                    else if (itemType == "feature")
                        self.openItem(docs[0]);
                    else if (itemType == "manifest")
                        self.openItem(docs[0]);

                } else{
                    console.log("ERROR: the nomenclature " + key + " does not exist in indexer");
                }
            }, function (err) {
                console.log("error retrieving nomenclature results:" + err);
            });
        },

        showDoc: function(doc){
            if(doc.itemType === "product"){
                this.openLayer(doc);
            } else if(doc.itemType === "nomenclature"){
                this.openNomenclature(doc);
            } else if(doc.itemType === "slideshow"){
                this.openSlideshow(doc);
            } else if(doc.itemType === "feature"){
                this.openItem(doc);
            } else if(doc.itemType === "manifest"){
                this.openItem(doc);
            } else if(doc.itemType === "bookmark"){
                this.openBookmark(doc);
            }
        },

        setResultsCounter: function(start, end, total){
            var startText = start + 1;
            var endText = end;
            var totalText = total;

            this.searchSidebarResultsCounterStart.innerHTML = startText;
            this.searchSidebarResultsCounterEnd.innerHTML = endText;
            this.searchSidebarResultsCounterTotal.innerHTML = totalText;
        },

        clearSearch: function(evt){
            this.resetFacets();
            this.searchInput.value = "";
            this.submitSearch();
        },

        resetFacets: function(){
            for(var i=0; i<this.facetsMap.length; i++){
                if( i%2 === 1 ){
                    this.facetsMap[i] = "All";
                }
            }
        },

        switchToSearchMenu: function(){
            domClass.remove(this.facetBtns, "hidden");
            domClass.remove(this.resultsCounterDiv, "hidden");
            domClass.remove(this.searchBarResults, "hidden");
            domClass.add(this.searchListContainer, "hidden");

            domClass.remove(this.searchMenuSwitchButtonToList, "hidden");

        },

        switchToListMenu: function(){
            this.clearSearch();

            domClass.add(this.facetBtns, "hidden");
            domClass.add(this.subFacetsContainer, "hidden");
            domClass.add(this.resultsCounterDiv, "hidden");
            domClass.add(this.searchBarResults, "hidden");

            domClass.remove(this.searchListContainer, "hidden");

            domClass.add(this.searchMenuSwitchButtonToList, "hidden");

            if(this.config.search.allowSwitching){
            }
            else{
                domClass.add(this.searchBarInputArea, "hidden");
            }
        },

        setUpListMenu: function(){
            var self = this;
            if(!this.config.search || !this.config.search.searchMenuListUrl){
                console.log("No search menu service has been added to config. Please add service as searchMenuListUrl");

            }else {
                xhr(this.config.search.searchMenuListUrl, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    //self.exploreMenuBackStackIndex++;
                    self.displayList(data);
                });
            }
        },

        displayList: function(obj){
            console.log("displayList", obj);
            var self = this;

            if(obj.list) {
                if (obj.list.length > 0) {
                    domConstruct.empty(this.listQueue);
                    var list = obj.list;
                    list.forEach(function (listItem) {

                        if(listItem.list) {
                            console.log("list", listItem.list);
                            /*
                            var explorerItem = new ExplorerSidebarListItem(listItem);
                            explorerItem.setExplorerSidebar(self);
                            explorerItem.startup();
                            var explorerDomNode = domConstruct.place(explorerItem.domNode, self.listQueue, "last");

                            on(explorerDomNode, "click", lang.hitch(function () {
                                self.exploreMenuBackStackIndex++;
                                self.exploreMenuListBackStack.push(obj);
                                self.displayList(explorerItem.doc);
                            }));
                            */
                        }
                        else{
                            /*
                            var explorerItem = new ExplorerSidebarListItem(listItem);
                            explorerItem.setExplorerSidebar(self);
                            explorerItem.startup();
                            var explorerDomNode = domConstruct.place(explorerItem.domNode, self.listQueue, "last");

                            on(explorerDomNode, "click", lang.hitch(function () {
                                console.log("open in sidebar");
                            }));
                            */
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

        showPins: function (docs) {
            for (var i=0; i < docs.length; i++) {
                if (docs[i].shape != undefined) {
                    var loc = docs[i].shape.substring(7, docs[i].shape.length-1).split(" ");
                    var gp = this.addPointGraphic(loc[0], loc[1]);
                    this.graphics.push(gp);
                }

            }
        },

        removeAllPins: function () {
            for ( var i = this.graphics.length-1; i >= 0; i--) {
                this.removePointGraphic(this.graphics[i]);
                delete this.graphics[i];
            }

        },

        addPointGraphic: function(x, y) {
            var map = this.mapDijit.getCurrentMap();
            var graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map);

            map.graphics.add(graphicPoint);

            var self = this;
            // setTimeout(function(){
            //     map.setExtent(self.graphicPoint._extent);
            //
            //     topic.publish(MapEvent.prototype.GLOBE_SET_CENTER, {
            //         "x": self.graphicPoint._extent.getCenter().x,
            //         "y": self.graphicPoint._extent.getCenter().y
            //     });
            // }, 500);
            return graphicPoint;
        },

        removePointGraphic: function(graphicPoint) {
            var map = this.mapDijit.getCurrentMap();

            map.graphics.remove(graphicPoint);
        },

        searchForBookmarks: function(){
                var searchInput = "";
                var facet = "itemType";
                var subfacet = "bookmark";
                this.facetsMap[this.facetsMap.indexOf(facet) + 1] = subfacet;
                this.selectedFacet.isOpen = false;
                this.updateSearchMenu(searchInput);
        },

        addBookmarkToManager: function(bookmark){
            this.bookmarkManager.addBookmark(bookmark);
        },

        removeBookmarkFromManager: function(bookmark){
            this.bookmarkManager.removeBookmark(bookmark);
        }
    });
});