/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/STLInputDialog
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/topic",
    "dojo/query",
    "dojo/_base/window",
    "bootstrap/Modal",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "dijit/form/Select",

    "dijit/form/RadioButton",
    "dijit/form/NumberSpinner",
    "esri/toolbars/edit",
    "esri/graphic",
    
    "jpl/events/ToolEvent",
    "jpl/config/Config",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",

    "jpl/utils/IndexerUtil",
    "jpl/utils/JSONConverter",

    "dojo/text!../templates/STLInputDialog.html"
], function (declare, lang, on, dom, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, Select, RadioButton, NumberSpinner, Edit, Graphic, ToolEvent,  Config, webMercatorUtils, Point, IndexerUtil, JSONConverter, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        parent: null,       
        graphic: null,
        stlTop: null,
        stlLeft: null,
        stlRight: null,
        stlBottom: null,
        stlResolution: null,
        stlDem: null,
        estlDem: null,
        proj: null,
        indexerUtil: null,
        type: null,
        radioOne: null,
        radioTwo: null,

        constructor: function () {
          //console.log('constructor():: this.templateString = ' + this.templateString);
          //console.log(this.templateString);
        },

        postCreate: function () {
            this.createContainer();
            //query(this.stlInputContainer).modal();
            on(this.stlSubmitButton, "click", lang.hitch(this, this.doSTL));
            on(this.stlModalClose, "click", lang.hitch(this, this.modalCleanup));
            //on(this.stlEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.stlRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, stlType)
        {
          this.parent  = parent;
          this.graphic = parent.graphic;
          this.type    = stlType;

          //console.log('startup():: this.graphic = ' + this.graphic);
          //console.log(this.graphic);
          //console.log('startup():: this.type = ' + this.type);

          this.config = Config.getInstance();
          this.proj   = parent.basemapSingleton.currentMapProjection;
          //console.log('startup():: this.proj = ' + this.proj);
          //console.log('startup():: this.config.projection.EQUIRECT = ' + this.config.projection.EQUIRECT);

          this.indexerUtil = new IndexerUtil();
          var searchUrlParameters = {};
          searchUrlParameters["serviceType"] = "raster";
          searchUrlParameters["facetKeys"] = "productType";
          searchUrlParameters["facetValues"] = "-DEM";
          //searchUrlParameters["projection"] = this.config.projection.EQUIRECT;
          searchUrlParameters["projection"] = this.proj;
          var searchUrl = this.indexerUtil.createGetSearchItemsUrl(searchUrlParameters);
          //console.log('startup():: searchUrl = ' + searchUrl);
          
          query(this.stlInputContainer).modal();

          var extent = this.graphic._extent;
       
          // var p = new Point(extent.xmax, extent.ymax);
          // var ppp = this.transLatLonToNorthPolarMeters(p);
          // var urp = webMercatorUtils.webMercatorToGeographic(ppp);
          //console.log('startup():: urp = ' + urp);
          //console.log(urp);
       
          // p = new Point(extent.xmin, extent.ymin);
          // ppp = this.transLatLonToNorthPolarMeters(p);
          // var llp = webMercatorUtils.webMercatorToGeographic(ppp);
          //console.log('startup():: llp = ' + llp);
          //console.log(llp);

          var oneC = false;
          var twoC = false;
          if (stlType == 'OBJ')
            twoC = true;
          else
            oneC = true;

          this.radioOne = new RadioButton({
              checked: oneC,
              value: "STL",
              name: "stltype"
          }, "radioOne");
          this.radioOne.startup();

          this.radioTwo = new RadioButton({
              checked: twoC,
              value: "OBJ",
              name: "stltype"
          }, "radioTwo");
          this.radioTwo.startup();

          var topv    = extent.ymax;
          var leftv   = extent.xmin;
          var rightv  = extent.xmax;
          var bottomv = extent.ymin;
         
          if (this.proj != this.config.projection.EQUIRECT)
          {
            topv    = this.graphic.eqExtent.northbc; // urp.getLatitude();
            leftv   = this.graphic.eqExtent.westbc; // llp.getLongitude();
            rightv  = this.graphic.eqExtent.eastbc; // urp.getLongitude();
            bottomv = this.graphic.eqExtent.southbc; // llp.getLatitude();
          }

          this.stlTop = new NumberSpinner({
              //value: extent.ymax,
              value: topv,
              smallDelta: 0.1,
              //constraints: { min:ymin, max:ymax, places:4 },
              constraints: { min:-90, max:90, places:4 },
              id: "stlTop",
              style: "width:150px"
          }, "stlTop");
          this.stlTop.startup();
          this.stlTop.textbox.style.textAlign = 'left';

          this.stlLeft = new NumberSpinner({
              //value: extent.xmin,
              value: leftv,
              smallDelta: 0.1,
              //constraints: { min:xmin, max:xmax, places:4 },
              constraints: { min:-180, max:180, places:4 },
              id: "stlLeft",
              style: "width:150px"
          }, "stlLeft");
          this.stlLeft.startup();
          this.stlLeft.textbox.style.textAlign = 'left';

          this.stlRight = new NumberSpinner({
              //value: extent.xmax,
              value: rightv,
              smallDelta: 0.1,
              //constraints: { min:xmin, max:xmax, places:4 },
              constraints: { min:-180, max:180, places:4 },
              id: "stlRight",
              style: "width:150px"
          }, "stlRight");
          this.stlRight.startup();
          this.stlRight.textbox.style.textAlign = 'left';

          this.stlBottom = new NumberSpinner({
              //value: extent.ymin,
              value: bottomv,
              smallDelta: 0.1,
              //constraints: { min:ymin, max:ymax, places:4 },
              constraints: { min:-90, max:90, places:4 },
              id: "stlBottom",
              style: "width:150px"
          }, "stlBottom");
          this.stlBottom.startup();
          this.stlBottom.textbox.style.textAlign = 'left';

          this.stlResolution = new NumberSpinner({
              value: 400,
              smallDelta: 1,
              constraints: { min:0, max:9999, places:0 },
              id: "stlResolution",
              style: "width:80px"
          }, "stlResolution");
          this.stlResolution.startup();
          this.stlResolution.textbox.style.textAlign = 'left';

          var one = dojo.byId("radioOne");
          var two = dojo.byId("radioTwo");
          
          var dm = dom.byId("stlDem");
          var edm = dom.byId("estlDem");
          if (stlType == 'OBJ')
          {
            var options = this.getDemList(searchUrl);
            this.stlDem = new Select({
              id: "stlDem",
              name: "stlDem",
              options: options,
              style: "width:80%"
            }, "stlDem");
            this.stlDem.startup();
            //console.log('startup():: this.stlDem = ' + this.stlDem);
            //console.log(this.stlDem);
            this.stlDem.set("disabled", false);
          }
          else
          {
            var options = this.emptyList();
            this.stlDem = new Select({
              id: "stlDem",
              name: "stlDem",
              options: options,
              style: "width:80%"
            }, "stlDem");
            this.stlDem.startup();
            //console.log('startup():: this.stlDem = ' + this.stlDem);
            //console.log(this.stlDem);
            this.stlDem.set("disabled", true);
          }

          var self = this;
	  one.onchange = function(isChecked)
          {
	    if (isChecked)
            {
              self.type = "STL";
              var options = self.emptyList();
              self.stlDem.set("options", options);
              var fval = options[0].value;
              self.stlDem.attr('value', fval); 
              self.stlDem.set("disabled", true);
	    }
	  };

	  two.onchange = function(isChecked)
          {
	    if (isChecked)
            {
              self.type = "OBJ";
              var options = self.getDemList(searchUrl);
              var fval = options[0].value;
              self.stlDem.set("options", options);
              self.stlDem.attr('value', fval); 
              self.stlDem.set("disabled", false);
	    }
	  };
        },

        doSTL: function(evt)
        {
          var self = this;

          var top        = this.stlTop.get('value');
          var left       = this.stlLeft.get('value');
          var right      = this.stlRight.get('value');
          var bottom     = this.stlBottom.get('value');
          var resolution = this.stlResolution.get('value');
          var uuid       = this.stlDem.get('value');


          //console.log('doSTL():: self.graphic = ' + self.graphic);
          //console.log(self.graphic);

          var graphic = new Graphic(self.graphic.geometry, self.graphic.symbol);
          //console.log('doSTL():: graphic = ' + graphic);
          //console.log(graphic);

          if (self.graphic.polarExtent) {
              // graphic.geometry.cache._extent.xmin = self.graphic.polarExtent.leftbc;
              // graphic.geometry.cache._extent.ymax = self.graphic.polarExtent.topbc;
              // graphic.geometry.cache._extent.xmax = self.graphic.polarExtent.rightbc;
              // graphic.geometry.cache._extent.ymin = self.graphic.polarExtent.bottombc;

              graphic.geometry._extent.xmin = self.graphic.polarExtent.leftbc;
              graphic.geometry._extent.ymax = self.graphic.polarExtent.topbc;
              graphic.geometry._extent.xmax = self.graphic.polarExtent.rightbc;
              graphic.geometry._extent.ymin = self.graphic.polarExtent.bottombc;
          }  else {
              // graphic.geometry.cache._extent.xmin = left;
              // graphic.geometry.cache._extent.ymax = top;
              // graphic.geometry.cache._extent.xmax = right;
              // graphic.geometry.cache._extent.ymin = bottom;

              graphic.geometry._extent.xmin = left;
              graphic.geometry._extent.ymax = top;
              graphic.geometry._extent.xmax = right;
              graphic.geometry._extent.ymin = bottom;
          }


          //self.graphic.geometry.cache._extent.ymax = top;
          //self.graphic.geometry.cache._extent.xmax = right;
          //self.graphic.geometry.cache._extent.ymin = bottom;
          //self.graphic.geometry.cache._extent.ymax = top;

          self.parent.isEditing = false;

          //console.log('doSTL():: self.type = ' + self.type);
          //console.log('doSTL():: uuid = ' + uuid);
          if (self.type == "STL")
          {
            self.parent.showSTL(graphic, resolution);
          }
          else // OBJ
          {
            var imageServiceURL = self.indexerUtil.createLayerServicesUrl(uuid);
            //console.log('doSTL():: imageServiceURL = ' + imageServiceURL);
            var endPoint = self.getEndPoint(imageServiceURL);
            //console.log('doSTL():: endPoint = ' + endPoint);
            self.parent.showOBJ(graphic, resolution, endPoint);
          }

          this.cleanIt(self);
        },

        cleanIt: function(self)
        {
          //console.log('startup():: self.radioOne = ' + self.radioOne);
          //console.log(self.radioOne);
          //console.log('startup():: this.radioOne = ' + this.radioOne);
          //console.log(this.radioOne);

          self.radioOne.destroyRecursive();
          self.radioTwo.destroyRecursive();
          self.stlTop.destroyRecursive();
          self.stlLeft.destroyRecursive();
          self.stlRight.destroyRecursive();
          self.stlBottom.destroyRecursive();
          self.stlResolution.destroyRecursive();
          self.stlDem.destroyRecursive();
          //self.estlDem.destroyRecursive();
        },

        modalCleanup: function(evt)
        {
          var self = this;
          this.cleanIt(self);
          //this.parent.removeMapGraphic(self.graphic);
          self.parent.isEditing = false;
        },

        doEdit: function(evt)
        {
          var self = this;
          var option = Edit.SCALE | Edit.MOVE;
          self.parent.editMarker(self.graphic, option);
          self.parent.isEditing = true;
          this.cleanIt(self);
        },

        doRemove: function(evt)
        {
          var self = this;
          this.cleanIt(self);
          //self.parent.removeMapGraphic(self.graphic);
          self.parent.isEditing = false;
        },

        transLatLonToNorthPolarMeters: function(point, radiusKm)
        {
          if (radiusKm == undefined || radiusKm == null)
            radiusKm = 1737.1;

          var rad = radiusKm*1000;
          var f = point.x * Math.PI/180;
          var c = point.y * Math.PI/180;
  
          var x = (2*rad* Math.tan(Math.PI/4 - c/2)*Math.sin(f));
          var y = (-2*rad*Math.tan(Math.PI/4-c/2)*Math.cos(f));
  
          var outPoint = new Point(x, y);
          return outPoint;
        },
  
        transLatLonToSouthPolarMeters: function(point, radiusKm)
        {
          if (radiusKm == undefined || radiusKm == null)
            radiusKm = 1737.1;

          var rad = radiusKm*1000;
          var f = point.x * Math.PI/180;
          var c = point.y * Math.PI/180;
  
          var x = 2*rad*Math.tan(Math.PI/4+c/2)*Math.sin(f);
          var y = 2*rad*Math.tan(Math.PI/4+c/2)*Math.cos(f);
  
          var outPoint = new Point(x, y);
          return outPoint;
        },
  
        emptyList: function()
        {
          var options = [];
          var v = '--- N/A ---';
          var o = {"label": v, "value": v};
          options.push(o);
          return options;
        },

        getEndPoint: function(url)
        {
          var json = new JSONConverter();
          var data = json.getJson(url);

          var response = data.response;
          var docs = response.docs;

          for (var i=0; i<docs.length; i++)
          {
            var doc = docs[i];
            var serviceType = doc.serviceType;
            if (serviceType == "raster")
             return doc.endPoint;
          }
          return "";
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        getDemList: function(url)
        {
          var options = [];

          var json = new JSONConverter();
          var data = json.getJson(url);

          var response = data.response;
          var docs = response.docs;

          for (var i=0; i<docs.length; i++)
          {
            var doc = docs[i];
            var value = doc.item_UUID;
            var v = doc.title;
            var o = {"label": v, "value": value};
            options.push(o);
          }
          return options;
        },

        createContainer: function(){
            this.placeAt(win.body());
        }

    });
});
