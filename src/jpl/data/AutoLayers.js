define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request",
    "dojo/on",
    "dojo/request/xhr",
    "jpl/data/Layer",
    "jpl/utils/MakeSingletonUtil",
    "jpl/utils/IndexerUtil",
    "jpl/config/Config",
    "jpl/events/LayerEvent",
    "jpl/events/MapEvent",
    "dojo/promise/all"
], function(declare, lang, topic, request, on, xhr, Layer, MakeSingletonUtil, IndexerUtil, Config, LayerEvent, MapEvent, all) {
    return MakeSingletonUtil(
        declare("gov.nasa.jpl.data.AutoLayers", [], {
            autoLayersInfo: [],

            constructor: function () {
                this.config = Config.getInstance();
                this.loadAutoLayers();

                //manually call the superclass
                this.inherited(arguments);
            },

            loadAutoLayers: function(){
                console.log("AUTO CONFIG", this.config.services.autoLayers);
                var autoLayersUrl = this.config.services.autoLayers;
                console.log("AUTO LAYER URL", autoLayersUrl);

                autoLayersUrl = autoLayersUrl + "?t=_" + Math.random();
                var self = this;
                xhr(autoLayersUrl, {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(lang.hitch(this, function (data) {
                    self.autoLayersInfo = data;
                }), function (err) {
                    throw new Error("Could not retrieve auto layers from (" + autoLayersUrl + ") - " + err);
                });
            }
        }
        ));
});