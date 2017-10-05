define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "esri/renderers/Renderer"
], function(g, declare, Renderer){
    return declare(Renderer,{

        constructor: function(symbol) {
            this.symbol = symbol;
        },

        getSymbol: function(graphic) {
            this.symbol.setText(graphic.attributes["LABEL"]);
            return this.symbol;
        }

    });
});