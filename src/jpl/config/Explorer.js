define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        defaultType: "",
        allowSwitching: false,

        constructor: function (explorerConfig) {
            this.defaultType = "";
            this.allowSwitching = false;

            if(explorerConfig) {
                if(explorerConfig.defaultType){
                    this.defaultType = explorerConfig.defaultType;
                }
                if(explorerConfig.allowswitching) this.allowSwitching = true;
            }
        }
    });
});