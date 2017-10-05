define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request/xhr"
], function (declare, lang, xhr) {
    return declare(null, {

        constructor: function(args) {
        },

        getEndPoint: function(rastersURL, graphic){
            return this.getRastersJson(rastersURL, graphic);
        },

        getBestFitEndPoint: function(rastersJson, graphic) {
            var layers = rastersJson.Layers.Layer;
            if(layers.length > 0){
                var layer = {};
                var i, j = 0;
                for (i = 0; i < layers.length; i++){
                    if(this.isLineWithinLayerExtent(graphic, layers[i])){
                        layer = layers[i];
                        j = i;

                        //break
                        i = layers.length + 1;
                    }
                }
                for (j; j < layers.length; j++){
                    if (layers[j].resolution < layer.resolution && this.isLineWithinLayerExtent(graphic, layers[j])){
                        layer = layers[j];
                    }
                }

                endPoint = layer.services[0].endPoint;
            }

            return endPoint;
        },

        isLineWithinLayerExtent: function(graphic, layer){
            var graphicExtent = graphic.geometry.getExtent();
            var layerExtent = layer.bounding;
            var isLineWithinLayerExtent = false;

            if (layerExtent.leftbc <= graphicExtent.xmin &&
                layerExtent.rightbc >= graphicExtent.xmax &&
                layerExtent.topbc >= graphicExtent.ymax &&
                layerExtent.bottombc <= graphicExtent.ymin)
            {
                isLineWithinLayerExtent = true;
            }

            return isLineWithinLayerExtent;
        },

        getRastersJson : function(rastersURL, graphic){
            var self = this;

            return xhr(rastersURL, {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(lang.hitch(this, function(rastersJson) {
                return self.getBestFitEndPoint(rastersJson, graphic);
            }), function(err) {
                console.log("error retrieving rastor data:" + err);
            });
        }
    });
});