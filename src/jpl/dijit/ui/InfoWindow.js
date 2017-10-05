/**
 * Info Window
 *
 * @module jpl/dijit/ui/InfoWindow
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "jpl/events/MapEvent",
    "dojo/request/xhr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!../templates/InfoWindow.html",
    "xstyle/css!../css/InfoWindow.css"
], function(declare, lang, topic, MapEvent, xhr, domStyle, domClass,
    _WidgetBase, _TemplatedMixin, template, css) {
    "use strict";
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        isHidden: false,
        userSelected: false,
        userClosed: false,

        title: "",
        _setTitleAttr: {
            node: "titleNode",
            type: "innerHTML"
        },
        content: "",
        _setContentAttr: {
            node: "contentNode",
            type: "innerHTML"
        },

        /**
         * Widget for ESRI look-alike info window.
         */
        constructor: function() {
            this.title = "";
            this.content = "";
        },

        /**
         * Populates the infoWindow with the passed in title and content.
         * Also makes the widget visible.
         *
         */
        newWindow: function(title, content) {
            this.set("title", title);
            this.set("content", content);
            domClass.add(this.windowNode, "esriPopupVisible in");
            this.show();
        },

        /**
         * Closes and hides the infoWindow.
         */
        close: function() {
            domClass.remove(this.windowNode, "esriPopupVisible in");
            topic.publish(MapEvent.prototype.INFO_CLOSED);
        },

        hide: function(){
            domStyle.set(this.windowNode, "display", "none");
            this.isHidden = true;
        },

        show: function(){
            domStyle.set(this.windowNode, "display", "");
            this.isHidden = false;
        }
    });
});

