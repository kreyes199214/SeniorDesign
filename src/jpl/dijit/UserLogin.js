define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/topic",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/UserLogin.html',
    "jpl/events/MapEvent",
    "jpl/config/Config"
], function (declare, lang, on, query, domAttr, domClass, topic, _WidgetBase, _TemplatedMixin, template, MapEvent, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,
            mapDijit: "",
            searchType: "all",

            constructor: function () {
            },

            postCreate: function () {

            },

            startup: function () {
                this.config = Config.getInstance();
                domClass.add(this.domNode, "sidenav-gallery");
            }

        });
    });