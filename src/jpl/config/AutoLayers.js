define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        useAutoLayers: false,

        constructor: function (autoLayersConfig) {
            this.useAutoLayers = false;

            if(autoLayersConfig) {
                if(autoLayersConfig.useAutoLayers) this.useAutoLayers = true;
            }
        }
    });
});