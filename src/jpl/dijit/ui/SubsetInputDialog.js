/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/SubsetInputDialog
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/topic",
    "dojo/query",
    "dojo/_base/window",
    "dojo/request",
    "bootstrap/Modal",
"dijit/form/NumberSpinner",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
"dijit/form/Select",
"esri/toolbars/edit",
"esri/geometry/Extent",
    "jpl/events/ToolEvent",
"jpl/config/Config",
"jpl/utils/RequestUtils",
"dijit/form/Button",
"jpl/events/BrowserEvent",

    'dojo/text!../templates/SubsetInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, request, Modal, NumberSpinner, _WidgetBase, _TemplatedMixin, Select, Edit, Extent, ToolEvent,  Config,  RequestUtils, Button, BrowserEvent, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        parent: null,       
        editToolbar: null,        
        graphic: null,
        map: null,
        //geometry: null,
        subsetTop: null,
        subsetLeft: null,
        subsetRight: null,
        subsetBottom: null,
        layer: null,
        //subsetEmail: null,
        //email: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.subsetInputContainer).modal();
            on(this.subsetSubmitButton, "click", lang.hitch(this, this.doSubset));
            on(this.subsetModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.subsetEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.subsetRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic)
        {
          this.parent          = parent;
          this.map             = editToolbar.map;
          //this.geometry        = geometry;
          this.editToolbar     = editToolbar;
          this.graphic = graphic;

          query(this.subsetInputContainer).modal();

          this.config = Config.getInstance();
          this.proj   = parent.basemapSingleton.currentMapProjection;

          var xmin = -180;
          var xmax = 180;
          var ymin = -90;
          var ymax = 90;
          if(this.proj === this.config.projection.N_POLE ||
             this.proj === this.config.projection.S_POLE) {
            xmin = -99999999;
            xmax = 99999999;
            ymin = -99999999;
            ymax = 99999999;
          }

          //var extent = this.geometry._extent;
          var extent = graphic._extent;

          this.subsetTop = new NumberSpinner({
              value: extent.ymax,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "subsetTop",
              style: "width:150px"
          }, "subsetTop");
          this.subsetTop.startup();
          this.subsetTop.textbox.style.textAlign = 'left';

          this.subsetLeft = new NumberSpinner({
              value: extent.xmin,
              smallDelta: 0.1,
              constraints: { min:xmin, max:xmax, places:4 },
              id: "subsetLeft",
              style: "width:150px"
          }, "subsetLeft");
          this.subsetLeft.startup();
          this.subsetLeft.textbox.style.textAlign = 'left';

          this.subsetRight = new NumberSpinner({
              value: extent.xmax,
              smallDelta: 0.1,
              constraints: { min:xmin, max:xmax, places:4 },
              id: "subsetRight",
              style: "width:150px"
          }, "subsetRight");
          this.subsetRight.startup();
          this.subsetRight.textbox.style.textAlign = 'left';

          this.subsetBottom = new NumberSpinner({
              value: extent.ymin,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "subsetBottom",
              style: "width:150px"
          }, "subsetBottom");
          this.subsetBottom.startup();
          this.subsetBottom.textbox.style.textAlign = 'left';

          var options = this.getLayerList();
          this.layer = new Select({
            id: "subsetLayer",
            name: "subsetLayer",
            style: "width:160px",
            options: options
          }, "subsetLayerDiv");
          this.layer.startup();
        },

        emailCheck: function(evt)
        {
          var val = this.email.attr('value');
          var ind = val.indexOf('@');
          if (val == "" || ind == -1 || ind == 0)
          {
            //disable Submit
            this.disableW("subsetSubmitButton", true);
          }
          else
          {
            //enable Submit
            this.disableW("subsetSubmitButton", false);
          }
          return true;
        },

        getLayerList: function()
        {
            var options = [];
            var layers = this.map.getLayersVisibleAtScale();

            var top    = this.subsetTop.get('value');
            var left   = this.subsetLeft.get('value');
            var right  = this.subsetRight.get('value');
            var bottom = this.subsetBottom.get('value');

            var viewExtent = new Extent(left, bottom, right, top, layers[0].spatialReference);

          for (var i=0; i<layers.length; i++)
          {
            var layer = layers[i];
            if (layer.visible && layer.productType !== undefined
                && layer.productType != "featureLayer" && layer.fullExtent.contains(viewExtent))
            {
                var value = layer.id;
              var v = value.replace(/_/g, ' ');
              //html += '<option value="' + value + '">' + v + '</option>';
              var o = {"label": v, "value": value};
              options.push(o);
            }
          }
          //return html;
          return options;
        },

        doSubset: function(evt)
        {
          var top    = this.subsetTop.get('value'); 
          var left   = this.subsetLeft.get('value'); 
          var right  = this.subsetRight.get('value'); 
          var bottom = this.subsetBottom.get('value'); 
          var src    = this.layer.get('value'); 
        
          var format = dom.byId("subsetOutputFormat");
          var idx = format.selectedIndex;
          fval = format[idx].value;

          this.subsetTop.destroyRecursive();
          this.subsetLeft.destroyRecursive();
          this.subsetRight.destroyRecursive();
          this.subsetBottom.destroyRecursive();
          this.layer.destroyRecursive();
          //this.subsetEmail.destroyRecursive();

          if(this.config.subsetServiceURL !== "")
          {
            //var url = 'http://moontrek.jpl.nasa.gov/TrekWS/rest/transform/latlon/subset/stream/tiff';
            var url = this.config.subsetServiceURL;
            url += '?src=' + src;      //LRO_WAC_Mosaic_Global_303ppd_v02';
            url += '&ulx=' + left;     //24.1875';
            url += '&uly=' + top;      //-8.8594';
            url += '&lrx=' + right;    //28.8281';
            url += '&lry=' + bottom;   //-14.0625';
 
            var sUrl = url;

            var token = this.getToken();
            //token = escape(token);
            //token = token.replace(/\+/g, '%2B');
            //token = token.replace(/\@/g, '%40');
            //token = token.replace(/\//g, '%2F');
            token = this.fixedEncodeURIComponent(token);
            url += '&iPlanetDirectoryPro=' + token;

            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Subset File Generating',
              content: 'Your subset file is being generated. It may take a few minutes and will automatically download when it is ready.',
              size: 'sm'
            });

            var stlDownloadFrame = dom.byId("layerDownloadFrame");
            stlDownloadFrame.src = url;
          }
          else
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Subsetting',
              content: 'No subsetService service available',
              size: 'sm'
            });
          }
          //this.parent.email = emailAddr;
          this.parent.isEditing = false;
        },

        cleanIt: function(self)
        {
          self.subsetTop.destroyRecursive();
          self.subsetLeft.destroyRecursive();
          self.subsetRight.destroyRecursive();
          self.subsetBottom.destroyRecursive();
          self.layer.destroyRecursive();
          //this.subsetEmail.destroyRecursive();
        },

        modalCleanup: function(evt)
        {
          //this.parent.removeMapGraphic(this.graphic);
          this.parent.isEditing = false;
          var self = this;
          this.cleanIt(self);
        },

        doEdit: function(evt)
        {
          var option = Edit.SCALE | Edit.MOVE;
          this.parent.editMarker(this.graphic, option);
          this.parent.isEditing = true;
          //this.parent.email = this.subsetEmail.get('value');
          var self = this;
          this.cleanIt(self);
        },

        doRemove: function(evt)
        {
          //this.parent.removeMapGraphic(this.graphic);
          this.parent.isEditing = false;
          //this.parent.email = this.subsetEmail.get('value');
          var self = this;
          this.cleanIt(self);
        },

        disableW: function(name, b)
        {
          var o = dojo.byId(name);
          if (o != null)
          {
            o.disabled = b;
          }
        },

        getToken: function()
        {
            var url = this.config.ldapService + "/authenticate";
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, false);
            xhr.setRequestHeader("X-OpenAM-Username", this.parent.username);
            xhr.setRequestHeader("X-OpenAM-Password", this.parent.passwd);

            xhr.send();

            if (xhr.status === 200) {
                var reponseJson = JSON.parse(xhr.responseText);
                dom.byId('loginToken').innerHTML = reponseJson.tokenId;
                return token = reponseJson.tokenId;
            } else {
                return "ERROR";
            }
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        fixedEncodeURIComponent: function(str)
        {
          return encodeURIComponent(str).replace(/[!'()*]/g, function(c) 
          {
            return '%' + c.charCodeAt(0).toString(16);
          });
        }

    });
});
