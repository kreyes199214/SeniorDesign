/**
 * Main Application entry point. Loads configuration
 *
 * @module app/App
 * @requires jpl/events/MapEvent
 */

define([
    'dojo/_base/declare',
    "dojo/_base/lang",
    "dojo/sniff",
    "dojo/parser",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/topic",
    "dojo/query",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./templates/App.html',
    "jpl/events/BrowserEvent",
    "jpl/dijit/SearchMap",
    "jpl/dijit/NavBar",
    "jpl/dijit/NavSidebar",
    "jpl/dijit/3DGlobeView",
    "jpl/dijit/ElevationTool",
    "jpl/dijit/SunAngleTool",
    "jpl/dijit/LoadingIcon",
    "jpl/dijit/BookmarkLoading",
    "jpl/dijit/ControlBar",
    "jpl/utils/FeatureDetector",
    "dijit/layout/ContentPane",
    "jpl/events/MapEvent",
    "bootstrap/Modal",
    "jpl/dijit/ui/ModalDialog",
    "jpl/utils/Analytics",
    "jpl/config/Config",
    "dojo/io-query",
    "jpl/utils/DOMUtil"
], function (declare, lang, has, parser, on, domConstruct, domAttr, topic, query, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, BrowserEvent,
             SearchMap, NavBar, NavSidebar, globeView3D, ElevationTool, SunAngleTool, LoadingIcon,
             BookmarkLoading, ControlBar, FeatureDetector, ContentPane, MapEvent, Modal, ModalDialog, Analytics, Config, ioQuery, DOMUtil) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        detectedFeatures: FeatureDetector.getInstance(),
        config: Config.getInstance("jpl/config/config.json?_key=" + Math.random()),

        postCreate: function () {
            this.setupTheme();
            topic.subscribe(BrowserEvent.prototype.SHOW_ALERT, lang.hitch(this, this.showAlertMessage));
            topic.subscribe(MapEvent.prototype.MAP_INITIALIZED, this.appReady);
            on(window, "resize", lang.hitch(this, this.windowResized));
        },

        startup: function () {
            console.info('========App : starting app');
            this.setupAnalytics();

            if(has("ie") || has("trident")) {
                //Not allowing IE for now, need to eventually check versions from 12 backwards
                var errorMessage = '<h1>Mars Trek</h1>'+
                    '<div class="jumbotron">' +
                    '<h2>Internet Explorer Not Supported</h2>' +
                    '<h4>Internet Explorer is not currently supported for viewing Mars Trek. <br />Please revisit this site with a modern version of Chrome, Firefox or Safari to use the application.' +
                    '</div>';
                domAttr.set("appLoadingDiv", "innerHTML", errorMessage);
            } else {
                this.inherited(arguments);

                if(this.detectedFeatures.webGL && !this.detectedFeatures.mobileDevice) {
                    new globeView3D(null, "3dGlobeView").startup();
                } else {
                    topic.publish(MapEvent.prototype.GLOBE_INITIALIZED, {eType: MapEvent.prototype.GLOBE_INITIALIZED});
                }
            }
        },

        setupAnalytics: function() {
            new Analytics(this.config.googleAnalyticsID);
        },

        /**
         * Called when all dependencies have been loaded and initialized
         *
         */
        appReady: function() {
            console.log("appReady is called.  destroying appLoadingDiv");
            domConstruct.destroy("appLoadingDiv");

        },

        windowResized: function(evt) {
            topic.publish(BrowserEvent.prototype.WINDOW_RESIZED, {height: evt.currentTarget.innerHeight, width: evt.currentTarget.innerWidth});
        },

        showAlertMessage: function(evt) {
            new ModalDialog(evt.title, evt.content, evt.size, evt.buttonText).startup();
        },

        setupTheme: function() {
            //get any query params and set them in the configuration object
            if(this.config.siteTheme) {
                DOMUtil.prototype.applyTheme(this.config.siteTheme);
            }

        }
    });
});