define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/dom-attr",
  "jpl/utils/MapUtil",
  "jpl/events/LoadingEvent"
  ],
    function(declare, lang, topic, domAttr, MapUtil, LoadingEvent){
    return declare(null, {
        unHideNomenclatureLayerAtEnd: null,

        constructor: function()
        {
          //console.log('constructor');
        },

        startup: function(div, map, productLabel)
        {
          var self = this;
          //console.log('startup()');
          //console.log("startup():: div = ", div);
          console.log("startup():: productLabel = ", productLabel);
          console.log("startup():: map = ", map);
          var isNomenclatureHidden = MapUtil.prototype.isNomenclatureLayerHidden(productLabel, map);
          if(!isNomenclatureHidden){
              this.unHideNomenclatureLayerAtEnd = true;
              MapUtil.prototype.hideNomenclatureLayer(productLabel, map);
          }

          topic.publish(LoadingEvent.prototype.BEGIN_DOWNLOAD, "Capturing the screen....");

          //html2canvas(document.body,
          html2canvas(div,
          {
            "logging": true,
            "useCORS": true,
            //width: 1636,
            //height: 996,
            onrendered: function(canvas)
            {
              var img = canvas.toDataURL("image/png");
	      //window.open(img);
              var a = document.createElement('a');
              //toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
              a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
              a.download = 'ScreenShot.jpg';
              a.click();
              //console.log('startup():: END_DOWNLOAD');
              topic.publish(LoadingEvent.prototype.END_DOWNLOAD);

              if(self.unHideNomenclatureLayerAtEnd) {
                  MapUtil.prototype.showNomenclatureLayer(productLabel, map);
              }
            }
          });

        },

        addEvent: function(message){
          //console.log('addEvent():: message = ' + message);
          domAttr.set(this.loadingIconNodeMessage, "html", message);
          this.showLoadingIcon();
        }

      });
});
