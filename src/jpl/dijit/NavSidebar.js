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
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/NavSidebar.html',
    "xstyle/css!./css/NavSidebar.css",
    "jpl/events/NavigationEvent",
    "jpl/utils/MapUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dojo/has!config-control-layers?jpl/dijit/LayersSidebar:dijit/_WidgetBase",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config"
], function (declare, lang, query, parser, on, has, topic, domClass, domAttr, domConstruct, _WidgetBase, _TemplatedMixin,
             template, css, NavigationEvent, MapUtil, StackContainer, ContentPane, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            this.initStackContainer();
            topic.subscribe(NavigationEvent.prototype.OPEN_SIDEBAR, lang.hitch(this, this.openSidebar));
            topic.subscribe(NavigationEvent.prototype.CLOSE_SIDEBAR, lang.hitch(this, this.closeSidebar));
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;height:100%;",
                id: "sidebarStackContainer"
            }, "scontainer");

            this.sidebarStackContainer.startup();

            //initialize the tooltips for non-mobile users. Mobile causes tooltips to show when touched.
            if(!this.detectedFeatures.mobileDevice) {
                $('[class="controls-link"]').tooltip({trigger: "hover"})
            }
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

        selectPage: function(pageID) {
            var selectedPageID = "";

            if (selectedPageID !== "") {
                this.sidebarStackContainer.selectChild(selectedPageID, false);
            }
        },

        openSidebar: function(evt) {
            domClass.add(document.body, "sidebar-open");
            this.selectPage(evt.selectedOption);

            //default to fire the resize event
            if(evt.resize === undefined) {
                evt.resize = true;
            }

            if(evt.resize) {
                MapUtil.prototype.resizeFix();
            }
        },

        closeSidebar: function(evt) {
            domClass.remove(document.body, "sidebar-open");

            //default to fire the resize event
            if(!evt) {
                evt = {
                    resize: true
                }
            }

            if(evt.resize) {
                MapUtil.prototype.resizeFix();
            }
        }

    });
});
