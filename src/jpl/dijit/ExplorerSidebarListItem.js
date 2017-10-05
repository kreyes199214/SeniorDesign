define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/parser",
    "dojo/on",
    "dojo/mouse",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/request/xhr",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    'dojo/text!./templates/ExplorerSidebarListItem.html'
], function (declare, lang, query, parser, on, mouse, has, topic, domClass, domAttr, domConstruct, xhr, registry, _WidgetBase, _TemplatedMixin,
             NavigationEvent, MapEvent, MapUtil, IndexerUtil, StackContainer, ContentPane, FeatureDetector, Config, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        doc: null,
        explorerSidebar: null,

        constructor: function (doc) {
            this.doc = doc;
        },

        startup: function () {
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.config = Config.getInstance();
            var self = this;

            this.labelText.innerHTML = this.doc.title;
            domAttr.set(this.image, "src", this.doc.img);
        },

        setExplorerSidebar: function(explorerSidebar){
            this.explorerSidebar = explorerSidebar;
        },

        showThisInSidebar: function(evt){
            this.hoverOffItem({});
            this.explorerSidebar.showExplorerItemDoc(this.doc);
        },

        indexOfInString: function(str, m, i) {
            return str.split(m, i).join(m).length;
        }

    });
});