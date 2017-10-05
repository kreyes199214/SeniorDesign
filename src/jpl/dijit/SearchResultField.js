define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/query",
    "dojo/mouse",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SearchResultField.html',
    "jpl/data/Layers",
    "jpl/events/LayerEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/AnimationUtil",
    "jpl/config/Config"
], function (declare, lang, on, domConstruct, domClass, domAttr, domStyle, topic, query, mouse, registry, _WidgetBase,
             _TemplatedMixin, template, Layers, LayerEvent, MapUtil, AnimationUtil, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        isCollapsed: true,
        layerOutline: null,
        label: "",
        resultTotal: 0,

        constructor: function (label, resultTotal) {
            this.config = Config.getInstance();
            this.label = label;
            this.resultTotal = resultTotal;
        },

        postCreate: function () {
        },

        startup: function () {
            this.labelText.innerHTML = this.label;
            this.totalResultsText.innerHTML = this.resultTotal;
        }

    });
});