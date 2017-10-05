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
    "dojo/_base/window",
    "dojo/request/xhr",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent",
    "jpl/events/SearchEvent",
    "jpl/utils/MapUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "jpl/utils/FeatureDetector",
    "jpl/utils/IndexerUtil",
    "jpl/config/Config",
    "jpl/dijit/SearchResultField",
    "jpl/dijit/BookmarkViewer",
    "jpl/dijit/LandingSiteViewer",
    "jpl/dijit/NomenclatureViewer",
    "jpl/dijit/SSViewer",
    "jpl/dijit/SlideshowViewer",
    "jpl/dijit/LayerViewer",
    "jpl/dijit/TreeListItem",
    "jpl/dijit/TreeListLeafItem",
    "jpl/data/Bookmarks",
    "jpl/data/LandingSites",
    "jpl/data/Slideshows",
    "jpl/data/Layers",
    'dojo/text!./templates/TreeSidebar.html',
    "xstyle/css!./css/TreeSidebar.css"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, win, xhr, registry, _WidgetBase, _TemplatedMixin,
             NavigationEvent, MapEvent, SearchEvent, MapUtil, StackContainer, ContentPane, FeatureDetector, IndexerUtil, Config, SearchResultField,
             BookmarkViewer, LandingSiteViewer, NomenclatureViewer, SSViewer, SlideshowViewer, LayerViewer, TreeListItem, TreeListLeafItem, Bookmarks, LandingSites, Slideshows, Layers, template, css) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        mapDijit: "",
        sidebarStackContainer: "",
        controlBar: null,
        viewerContainerContent: null,
        treeListParentItems: [],

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.layersInstance = Layers.getInstance();
            this.projection = this.config.projection.EQUIRECT;
            this.initStackContainer();
            this.setEventHandlers();
            this.createTreeMenu();
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "treesidebarStackContainer"
            }, "treescontainer");

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
            on(this.backButton, "click", lang.hitch(this, this.backToTreeButtonPressed));
            topic.subscribe(MapEvent.prototype.MAXIMIZE_3D_CONTAINER, lang.hitch(this, this.enter3dMode));
            topic.subscribe(MapEvent.prototype.MAP_READY, lang.hitch(this, this.setUpTreeSidebarEvents));
        },

        openTreeSidebar: function(evt) {
            domClass.add(document.body, "tree-sidebar-open");
        },

        closeTreeSidebar: function(evt) {
            domClass.remove(document.body, "tree-sidebar-open");
        },

        closeThisSidebar: function(){
            this.controlBar.activateTree();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        openBookmark: function(treeResult){
            this.clearViewerContainerContent();
            var bookmarkViewer = new BookmarkViewer();
            bookmarkViewer.setBookmark(treeResult);
            domConstruct.place(bookmarkViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.treescontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            bookmarkViewer.setSidebar(this);
            bookmarkViewer.startup();
            this.viewerContainerContent = bookmarkViewer;
        },

        openLandingSite: function(treeResult){
            this.clearViewerContainerContent();
            var landingSiteViewer = new LandingSiteViewer();
            landingSiteViewer.setLandingSite(treeResult);
            domConstruct.place(landingSiteViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.treescontainer)[0], "hidden");
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
            domClass.add(query(this.treescontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            layerViewer.setSidebar(this);
            layerViewer.startup();
            this.viewerContainerContent = layerViewer;
        },

        openNomenclature: function(nomenclature){
            this.clearViewerContainerContent();
            var nomenclatureViewer = new NomenclatureViewer();
            nomenclatureViewer.setNomenclature(nomenclature);
            domConstruct.place(nomenclatureViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.treescontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            nomenclatureViewer.setSidebar(this);
            nomenclatureViewer.startup();
            this.viewerContainerContent = nomenclatureViewer;
        },

        openSlideshow: function(slideshow){
            this.clearViewerContainerContent();
            var ssViewer = new SSViewer();
            ssViewer.setSlideshow(slideshow);
            domConstruct.place(ssViewer.domNode, this.resultViewerContainer, "only");
            domClass.add(query(this.treescontainer)[0], "hidden");
            domClass.remove(query(this.resultViewerContainer)[0], "hidden");

            ssViewer.setSidebar(this);
            ssViewer.startup();
            this.viewerContainerContent = ssViewer;
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
            this.projection = evt.projection;

            if (this.resultViewerContainer != undefined)
                domClass.add(query(this.resultViewerContainer)[0], "hidden");

            domClass.remove(query(this.treescontainer)[0], "hidden");
            if (this.treeInput != undefined) {
                var treeText = this.treeInput.value;
                this.submitTree({"target":{"value":treeText}});
            }

        },

        showDoc: function(doc){
            if(doc.itemType === "product"){
                this.openLayer(doc);
            } else if(doc.itemType === "nomenclature"){
                this.openNomenclature(doc);
            } else if(doc.itemType === "slideshow"){
                this.openSlideshow(doc);
            }
        },

        createTreeMenu: function(){
            var self = this;
            if(!this.config.services.treeMenuListUrl){
                console.log("No search tree menu service has been added to config. Please add service as treeMenuListUrl");

            }else {
                var treeMenuURL = this.config.services.treeMenuListUrl + "?_q=" + Math.random();
                xhr(treeMenuURL, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    self.displayList(data);
                });
            }
        },

        displayList: function(obj){
            var self = this;

            if(obj.list) {
                domConstruct.empty(self.treeListResults);
                var list = obj.list;
                list.forEach(function (item) {
                    var treeListItem = self.createTreeListItem(item);
                    treeListItem.startup();
                    domConstruct.place(treeListItem.domNode, self.treeListResults, "last");
                    self.treeListParentItems.push(treeListItem);
                });
            }
            else{

            }
        },

        createTreeListItem: function(item){
            var treeListItem = new TreeListItem(item);
            treeListItem.setTreeSidebar(this);
            return treeListItem;
        },

        backToTreeButtonPressed: function(evt){
            domClass.remove(this.treeListContainer, "hidden");
            domClass.add(this.treeItemListContainer, "hidden");
            domClass.add(this.backButton, "hidden");
        },

        openTreeListItemList: function(treeItem, leafNodes){
            domConstruct.empty(this.treeItemListResults);

            this.treeItemListTitle.innerHTML = treeItem.title;

            for(var i=0;i<leafNodes.length;i++){
                var listNode = domConstruct.place(leafNodes[i].domNode, this.treeItemListResults, "last");
            }

            domClass.add(this.treeListContainer, "hidden");
            domClass.remove(this.treeItemListContainer, "hidden");
            domClass.remove(this.backButton, "hidden");
        },

        createListLeafItem: function(leafItem){
            var treeListLeafItem = new TreeListLeafItem(leafItem);
            treeListLeafItem.startup();
            return treeListLeafItem;
        },


        indexOfInString: function(str, m, i) {
            return str.split(m, i).join(m).length;
        },

        setUpTreeSidebarEvents: function(evt){
            this.setCheckedOnAppStart();
            this.setupMapClickEvents();
        },

        setCheckedOnAppStart: function(){
            for(var i=0;i<this.treeListParentItems.length;i++){
                this.checkSelectionOnStart(this.treeListParentItems[i]);
            }
        },

        checkSelectionOnStart: function(parent){

            if(parent.isLeafParent) {
                for (var i=0;i<parent.childLeafListItems.length;i++) {
                    var child = parent.childLeafListItems[i];
                    if (child.treeListItem.selected) {
                        child.checkbox.checked = true;
                        child.checkboxClicked();
                    }
                    else{
                        child.checkbox.checked = false;
                        child.checkboxClicked();
                    }
                }
            }
            else {
                for (var i=0;i<parent.childListItems.length;i++) {
                    var child = parent.childListItems[i];
                    if (child.treeListItem.selected) {
                        child.checkbox.checked = true;
                        child.checkboxClicked();
                    }
                    else{
                        child.checkbox.checked = false;
                        child.checkboxClicked();
                    }
                    this.checkSelectionOnStart(child);
                }
            }

        },

        setupMapClickEvents: function(){
            on(win.doc, '.popupTreeListItemInSidebarBtn:click', function(evt){
                var item_uuid = evt.target.value;
                topic.publish(SearchEvent.prototype.TREE_ITEM_MAP_POPUP_MORE_BTN_PRESSED, {"item_uuid": item_uuid});
            });
        }
    });
});