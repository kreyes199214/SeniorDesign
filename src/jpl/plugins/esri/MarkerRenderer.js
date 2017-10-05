define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "esri/renderers/Renderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/Color"
], function(g, declare, Renderer, SimpleMarkerSymbol, PictureMarkerSymbol, Color){
    return declare(Renderer,{
        featureMarkerTable: {},
        typeKey: null,
        constructor: function(featureMarkerTable, typeKey) {
            this.featureMarkerTable = featureMarkerTable;
            this.typeKey = typeKey;
        },

        getSymbol: function(graphic) {
            var url = this.featureMarkerTable[graphic.attributes[this.typeKey]];
            if (url == undefined || url.trim() == "") {
                var defaultSymbol = new SimpleMarkerSymbol();
                defaultSymbol.style = SimpleMarkerSymbol.STYLE_SQUARE;
                defaultSymbol.setSize(8);
                defaultSymbol.setColor(new Color([255,255,0,0.5]));
                defaultSymbol.outline.setColor(new Color([255,255,0,0.5]));
                return defaultSymbol;
            } else {
                var pictureMarkerSymbol = new PictureMarkerSymbol();
                pictureMarkerSymbol.setUrl(url);
                return pictureMarkerSymbol;
            }
        }

    });
});
