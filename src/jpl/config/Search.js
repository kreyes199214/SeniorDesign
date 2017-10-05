define([
    "dojo/_base/declare"
], function (declare) {
    return declare(null, {
        defaultType: "",
        allowSwitching: false,
        bookmarksButton: false,

        constructor: function (searchConfig) {
            this.defaultType = "";
            this.allowSwitching = false;

            if(searchConfig) {
                if(searchConfig.defaultType){
                    this.defaultType = searchConfig.defaultType;
                }
                if(searchConfig.allowswitching) this.allowSwitching = true;

                if(searchConfig.bookmarksButton) this.bookmarksButton = true;
            }
        }
    });
});