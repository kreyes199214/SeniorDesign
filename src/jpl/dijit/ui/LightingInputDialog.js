/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/LightingInputDialog
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
"dijit/form/NumberSpinner",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
"dijit/form/Select",
    'dojo/text!../templates/LightingInputDialog.html',

"dojo/ready",
"dojo/dom-class",
"dojo/parser",
"dojo/request",
"dijit/dijit", 
"dijit/Calendar",
"dijit/form/DateTextBox",
"dijit/form/TextBox",
"dijit/form/Button",

"jpl/utils/RequestUtils",
"jpl/config/Config",

"esri/toolbars/edit",
"jpl/events/ToolEvent",
    "jpl/events/BrowserEvent"
], function (declare, lang, on, dom, topic, query, win, Modal, NumberSpinner, _WidgetBase, _TemplatedMixin, Select, template, ready, domClass, parser, request, dijit, Calendar, DateTextBox, TextBox, Button, RequestUtils, Config, Edit, ToolEvent, BrowserEvent) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        parent: null,
        map: null,
        //geometry: null,
        editToolbar: null,
        graphic: null,
        proj: null,
        lightingTop: null,
        lightingLeft: null,
        lightingRight: null,
        lightingBottom: null,
        ltStartDate: null,
        ltEndDate: null,
        startDate1: null,
        startDate2: null,
        startDate3: null,
        endDate1: null,
        endDate2: null,
        endDate3: null,
        timeInc: null,
        mesh: null,
        shine: null,
        surfaceH: null,
        lightingEmail: null,
        config: null,
        email: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            var obj = query(this.lightingInputContainer).modal();
            //query(this.lightingInputContainer).modal('hide');
            on(this.lightingSubmitButton, "click", lang.hitch(this, this.doLighting));
            on(this.lightingModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.lightingEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.lightingRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic)
        {
          this.parent          = parent;
          this.map             = editToolbar.map;
          //this.geometry        = geometry;
          this.proj        = parent.basemapSingleton.currentMapProjection;
          this.editToolbar     = editToolbar;
          this.graphic = graphic;

          this.config = parent.config;  //Config.getInstance();

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
          var extent = this.graphic._extent;

          this.lightingTop = new NumberSpinner({
              value: extent.ymax,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "lightingTop",
              style: "width:150px"
          }, "lightingTop");
          this.lightingTop.startup();
          this.lightingTop.textbox.style.textAlign = 'left';

          this.lightingLeft = new NumberSpinner({
              value: extent.xmin,
              smallDelta: 0.1,
              constraints: { min: xmin, max: xmax, places:4 },
              id: "lightingLeft",
              style: "width:150px"
          }, "lightingLeft");
          this.lightingLeft.startup();
          this.lightingLeft.textbox.style.textAlign = 'left';

          this.lightingRight = new NumberSpinner({
              value: extent.xmax,
              smallDelta: 0.1,
              constraints: { min:xmin, max:xmax, places:4 },
              id: "lightingRight",
              style: "width:150px"
          }, "lightingRight");
          this.lightingRight.startup();
          this.lightingRight.textbox.style.textAlign = 'left';

          this.lightingBottom = new NumberSpinner({
              value: extent.ymin,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "lightingBottom",
              style: "width:150px"
          }, "lightingBottom");
          this.lightingBottom.startup();
          this.lightingBottom.textbox.style.textAlign = 'left';

          var today = new Date();
          var tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          ////
          this.ltStartDate = new DateTextBox({
             id: "ltStartDate",
             value: today, 
             style: "width: 150px",
             constraints: {datePattern:'MM/dd/yyyy'}
          }, "ltStartDate");
          this.ltStartDate.startup();

          this.startDate1 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:24, places:0 },
              id: "ltStart1",
              style: "width:50px"
          }, "ltStart1");
          this.startDate1.startup();
          this.startDate1.textbox.style.textAlign = 'left';

          this.startDate2 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltStart2",
              style: "width:50px"
          }, "ltStart2");
          this.startDate2.startup();
          this.startDate2.textbox.style.textAlign = 'left';

          this.startDate3 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltStart3",
              style: "width:50px"
          }, "ltStart3");
          this.startDate3.startup();
          this.startDate3.textbox.style.textAlign = 'left';

          ////
          this.ltEndDate = new DateTextBox({
             value: tomorrow,
             style: "width: 150px",
             constraints: {datePattern:'MM/dd/yyyy'}
          }, "ltEndDate");
          this.ltEndDate.startup();

          this.endDate1 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:24, places:0 },
              id: "ltEnd1",
              style: "width:50px"
          }, "ltEnd1");
          this.endDate1.startup();
          this.endDate1.textbox.style.textAlign = 'left';

          this.endDate2 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltEnd2",
              style: "width:50px"
          }, "ltEnd2");
          this.endDate2.startup();
          this.endDate2.textbox.style.textAlign = 'left';

          this.endDate3 = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltEnd3",
              style: "width:50px"
          }, "ltEnd3");
          this.endDate3.startup();
          this.endDate3.textbox.style.textAlign = 'left';

          ////
          this.timeInc = new NumberSpinner({
              value: 4, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltTimeInc",
              style: "width:50px"
          }, "ltTimeInc");
          this.timeInc.startup();
          this.timeInc.textbox.style.textAlign = 'left';

          this.mesh = new NumberSpinner({
              value: 1, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltMesh",
              style: "width:70px"
          }, "ltMesh");
          this.mesh.startup();
          this.mesh.textbox.style.textAlign = 'left';

          this.shine = new NumberSpinner({
              value: 39, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltshine",
              style: "width:80px"
          }, "ltshine");
          this.shine.startup();
          this.shine.textbox.style.textAlign = 'left';

          this.surfaceH = new NumberSpinner({
              value: 0, 
              smallDelta: 1,
              constraints: { min:0, max:60, places:0 },
              id: "ltHeight",
              style: "width:80px"
          }, "ltHeight");
          this.surfaceH.startup();
          this.surfaceH.textbox.style.textAlign = 'left';

          this.lightingEmail = new dijit.form.TextBox({
            id: "lightingEmail",
            value: parent.email,
            //value: 'qvu@jpl.nasa.gov',
            required: true,
            intermediateChanges: true,
            promptMessage: "Please enter your email to get your query result",
            //readOnly: true,
            placeHolder: "Enter your email to get the result",
            style: "width: 280px;"
          }, "lightingEmail");
          this.lightingEmail.startup();

          if (parent.email == "")
            this.disableW("lightingSubmitButton", true);
          else
            this.disableW("lightingSubmitButton", false);

          this.email = dijit.byId("lightingEmail");
          this.email.focus();
          dojo.connect(this.email, "onChange", this, this.emailCheck);
        },

        emailCheck: function(evt)
        {
          var val = this.email.attr('value');
          var ind = val.indexOf('@');
          if (val == "" || ind == -1 || ind == 0)
          {
            //disable Submit
            this.disableW("lightingSubmitButton", true);
          }
          else
          {
            //enable Submit
            this.disableW("lightingSubmitButton", false);
          }
          return true;
        },

        doLighting: function(evt)
        {
          var emailAddr = this.lightingEmail.get('value'); 
          var ind = emailAddr.indexOf('@');
          if (emailAddr == "" || ind == -1)
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Surface Lighting',
              content: 'Please enter a valid email address to get your query result',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            return;
          }
          
          var top    = this.lightingTop.get('value'); 
          var left   = this.lightingLeft.get('value'); 
          var right  = this.lightingRight.get('value'); 
          var bottom = this.lightingBottom.get('value'); 

          var st  = this.ltStartDate.get('value'); 
          var shh = this.startDate1.get('value'); 
          var smm = this.startDate2.get('value'); 
          var sss = this.startDate3.get('value'); 

          //st = st.replace(/\//g, '-');
          var now = new Date(st);
          var year  = now.getFullYear();
          var month = now.getMonth()+1;
          var day   = now.getDate();
          var timetag = '' + year + '-' + this.pad(month,2) + '-' + this.pad(day,2);
          st = timetag + 'T' + this.pad(shh, 2) + ':' + this.pad(smm, 2) + ':' + this.pad(sss,2);

          var et  = this.ltEndDate.get('value'); 
          var ehh = this.endDate1.get('value'); 
          var emm = this.endDate2.get('value'); 
          var ess = this.endDate3.get('value'); 

          //et = et.replace(/\//g, '-');
          now = new Date(et);
          year  = now.getFullYear();
          month = now.getMonth()+1;
          day   = now.getDate();
          var timetag = '' + year + '-' + this.pad(month,2) + '-' + this.pad(day,2);
          et = timetag + 'T' + this.pad(ehh, 2) + ':' + this.pad(emm, 2) + ':' + this.pad(ess,2);

          var inc    = this.timeInc.get('value'); 
          var mesh   = this.mesh.get('value'); 
          var shine  = this.shine.get('value'); 
          var height = this.surfaceH.get('value'); 

          var oo = dojo.byId("lightingMapType");
          var idx = oo.selectedIndex;
          var mode = oo[idx].value; 

          oo = dojo.byId("ltTerrain");
          var tcheck = oo.checked;

          //calc inc
          oo = dojo.byId("ltTimeIncHour");
          idx = oo.selectedIndex;
          var incType = oo[idx].value; 

          switch (incType)
          {
            case 'minutes':
              inc = inc * 60;
              break;
            case 'hours':
              inc = inc * 60 * 60;
              break;
            case 'days':
              inc = inc * 60 * 60 * 24;
              break;
            default:
              break;
          }

          this.lightingTop.destroyRecursive();
          this.lightingLeft.destroyRecursive();
          this.lightingRight.destroyRecursive();
          this.lightingBottom.destroyRecursive();

          this.ltStartDate.destroyRecursive();
          this.startDate1.destroyRecursive();
          this.startDate2.destroyRecursive();
          this.startDate3.destroyRecursive();

          this.ltEndDate.destroyRecursive();
          this.endDate1.destroyRecursive();
          this.endDate2.destroyRecursive();
          this.endDate3.destroyRecursive();

          this.timeInc.destroyRecursive();
          this.mesh.destroyRecursive();
          this.shine.destroyRecursive();
          this.surfaceH.destroyRecursive();
          this.lightingEmail.destroyRecursive();

          var p = this.getProjection(this.proj);;

          if(this.config.lightingServiceURL !== "")
          {
            //var url = 'http://moontrek.jpl.nasa.gov/TrekWS/rest/light';
            var url = this.config.lightingServiceURL; 
            url += '?westbc=' + left;
            url += '&eastbc=' + right;
            url += '&northbc=' + top;
            url += '&southbc=' + bottom;
            url += '&st=' + st;
            url += '&et=' + et;
            url += '&proj=' + p;
            url += '&inc=' + inc;
            url += '&mesh=' + mesh;
            url += '&height=' + height;
            url += '&runMode=' + mode.toUpperCase();
            url += '&earthShine=' + shine;
            if (tcheck)
              url += '&terrainRfl=true';
            else
              url += '&terrainRfl=false';
            url += '&email=' + emailAddr;

            var sUrl = url;

            var token = this.getToken();
            //token = escape(token);
            //token = token.replace(/\+/g, '%2B');
            //token = token.replace(/\@/g, '%40');
            //token = token.replace(/\//g, '%2F');
            token = this.fixedEncodeURIComponent(token);
            url += '&iPlanetDirectoryPro=' + token;

            var xhrArgs = {
              handleAs: "text",
              preventCache: true,
              url: url,
              headers: {
                "X-Requested-With": null
              },
              //content: { "iPlanetDirectoryPro": token },
              load: this.doProcessResult, 
              error: function(error){
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                  title: 'Surface Lighting',
                  content: error,
                  size: 'sm'
                });
              }
            }
            var deferred = dojo.xhrGet(xhrArgs);
          }
          else
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Surface Lighting',
              content: 'No lightingService service available',
              size: 'sm'
            });
          }

          this.parent.email = emailAddr;
          this.parent.isEditing = false;
        },

        doProcessResult: function(result) 
        {
          var ind = result.indexOf('Succeeded');

          var content = '';
          if (ind != -1)
          {
            content = 'Thank you for submitting your analysis. This job request has been successfully received. Upon completion, you will be notified through email with result rendered.';
          }
          else
          {
            content = 'Your job request failed to submit.  Please try it again.';
          }
          topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
            title: 'Surface Lighting',
            content: content,
            size: 'sm'
          });
        },

        modalCleanup: function(evt)
        {
          //this.parent.removeMapGraphic(this.graphic);
          this.parent.isEditing = false;
          var self = this;
          this.cleanIt(self);
        },

        cleanIt: function(self)
        {
          self.lightingTop.destroyRecursive();
          self.lightingLeft.destroyRecursive();
          self.lightingRight.destroyRecursive();
          self.lightingBottom.destroyRecursive();

          self.ltStartDate.destroyRecursive();
          self.startDate1.destroyRecursive();
          self.startDate2.destroyRecursive();
          self.startDate3.destroyRecursive();

          self.ltEndDate.destroyRecursive();
          self.endDate1.destroyRecursive();
          self.endDate2.destroyRecursive();
          self.endDate3.destroyRecursive();

          self.timeInc.destroyRecursive();
          self.mesh.destroyRecursive();
          self.shine.destroyRecursive();
          self.surfaceH.destroyRecursive();
          this.lightingEmail.destroyRecursive();
        },

        pad: function (num, size) {
          var s = num+"";
          while (s.length < size) s = "0" + s;
          return s;
        },

        getProjection: function(proj)
        {
          var ind = proj.indexOf('urn:ogc:def:crs:');
          var p = proj.substring(ind+16);
          p = p.replace('::', ':');
          return p;
        },

        doEdit: function(evt)
        {
          var option = Edit.SCALE | Edit.MOVE;
          this.parent.editMarker(this.graphic, option);
          this.parent.email = this.lightingEmail.get('value');
	  this.parent.isEditing = true;
          var self = this;
          this.cleanIt(self);
        },

        doRemove: function(evt)
        {
          //this.parent.removeMapGraphic(this.graphic);
          this.parent.email = this.lightingEmail.get('value');
          this.parent.isEditing = false;
          var self = this;
          this.cleanIt(self);
        },

        disableW: function(name, b)
        {
          var o = dojo.byId(name);
          if (o != null)
            o.disabled = b;
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
