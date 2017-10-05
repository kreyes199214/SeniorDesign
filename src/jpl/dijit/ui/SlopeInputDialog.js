/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/SlopeInputDialog
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
    "jpl/utils/JSONConverter",
    "esri/toolbars/edit",
    "jpl/events/ToolEvent",
    "jpl/config/Config",
    "jpl/utils/IndexerUtil",
    "jpl/events/BrowserEvent",
    'dojo/text!../templates/SlopeInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, request, Modal, NumberSpinner, _WidgetBase, _TemplatedMixin, Select, JSONConverter, Edit, ToolEvent, Config, IndexerUtil, BrowserEvent,template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        map: null,
        parent: null,
        //geometry: null,
        editToolbar: null,
        graphic: null,
        slopeTop: null,
        slopeLeft: null,
        slopeRight: null,
        slopeBottom: null,
        slopeDem: null,
        postSpacing: null,
        sizePlane: null,
        slopeEmail: null,
        email: null,
        proj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.slopeInputContainer).modal();
            
            on(this.slopeSubmitButton, "click", lang.hitch(this, this.doSlope));
            on(this.slopeModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.slopeEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.slopeRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic)
        {
          this.parent          = parent;
          this.map             = editToolbar.map;
          this.indexerUtil = new IndexerUtil();
          //this.geometry        = geometry;
          this.editToolbar     = editToolbar;
          this.graphic = graphic;

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

          query(this.slopeInputContainer).modal();

          //var extent = this.geometry._extent;
          var extent = this.graphic._extent;

          this.slopeTop = new NumberSpinner({
              value: extent.ymax,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "slopeTop",
              style: "width:120px"
          }, "slopeTop");
          this.slopeTop.startup();
          this.slopeTop.textbox.style.textAlign = 'left';

          this.slopeLeft = new NumberSpinner({
              value: extent.xmin,
              smallDelta: 0.1,
              constraints: { min:xmin, max:xmax, places:4 },
              id: "slopeLeft",
              style: "width:120px"
          }, "slopeLeft");
          this.slopeLeft.startup();
          this.slopeLeft.textbox.style.textAlign = 'left';

          this.slopeRight = new NumberSpinner({
              value: extent.xmax,
              smallDelta: 0.1,
              constraints: { min:xmin, max:xmax, places:4 },
              id: "slopeRight",
              style: "width:120px"
          }, "slopeRight");
          this.slopeRight.startup();
          this.slopeRight.textbox.style.textAlign = 'left';

          this.slopeBottom = new NumberSpinner({
              value: extent.ymin,
              smallDelta: 0.1,
              constraints: { min:ymin, max:ymax, places:4 },
              id: "slopeBottom",
              style: "width:120px"
          }, "slopeBottom");
          this.slopeBottom.startup();
          this.slopeBottom.textbox.style.textAlign = 'left';

          var options = this.getDemList();
          this.slopeDem = new Select({
            id: "slopeDem",
            name: "slopeDem",
            options: options,
            style: "width:80%"
          }, "slopeDem");
          this.slopeDem.startup();
/*
          this.postSpacing = new NumberSpinner({
              value: 1.5,
              smallDelta: 0.1,
              constraints: { min:0, max:90, places:1 },
              id: "postSpacing",
              style: "width:120px"
          }, "postSpacing");
          this.postSpacing.startup();
          this.postSpacing.textbox.style.textAlign = 'left';

          this.sizePlane = new NumberSpinner({
              value: 15,
              smallDelta: 1,
              constraints: { min:0, max:90, places:0 },
              id: "sizePlane",
              style: "width:120px"
          }, "sizePlane");
          this.sizePlane.startup();
          this.sizePlane.textbox.style.textAlign = 'left';
*/
          this.slopeEmail = new dijit.form.TextBox({
            id: "slopeEmail",
            value: parent.email,
            //value: "qvu@jpl.nasa.gov",
            required: true,
            intermediateChanges: true,
            placeHolder: "Enter your email to get the result",
            style: "width: 280px;"
            }, "slopeEmail");
          this.slopeEmail.startup();

          if (parent.email == "")
            this.disableW("slopeSubmitButton", true);
          else
            this.disableW("slopeSubmitButton", false);

          this.email = dijit.byId("slopeEmail");
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
            this.disableW("slopeSubmitButton", true);
          }
          else
          {
            //enable Submit
            this.disableW("slopeSubmitButton", false);
          }
          return true;
        },

        getDemList: function()
        {
          var options = [];

          var top    = this.slopeTop.get('value'); 
          var left   = this.slopeLeft.get('value'); 
          var right  = this.slopeRight.get('value'); 
          var bottom = this.slopeBottom.get('value'); 

          //real url
            var param = {
                bbox: left + ',' + bottom + ',' + right + ',' + top
            };
            url = this.indexerUtil.createGetSearchDEMUrl(param);
            // work around for now.  Slope only works in equirect projection
            url = url.replace("PROJECTION", "eq");

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

        doSlope: function(evt)
        {
          var emailAddr = this.slopeEmail.get('value');
          var ind = emailAddr.indexOf('@');
          if (emailAddr == "" || ind == -1)
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Slope',
              content: 'Please enter a valid email address to get your query result',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            return;
          }

          var top    = this.slopeTop.get('value'); 
          var left   = this.slopeLeft.get('value'); 
          var right  = this.slopeRight.get('value'); 
          var bottom = this.slopeBottom.get('value');

          var self = this;

          self.slopeTop.destroyRecursive();

          this.slopeTop.destroyRecursive();
          this.slopeLeft.destroyRecursive();
          this.slopeRight.destroyRecursive();
          this.slopeBottom.destroyRecursive();
          this.slopeEmail.destroyRecursive();

          this.slopeDem.destroyRecursive();

          if(this.config.services.slopeService)
          {
            var url = this.config.services.slopeService;
            url += '?ulat=' + top;
            url += '&ulon=' + left;
            url += '&llat=' + bottom;
            url += '&llon=' + right;
            url += '&email=' + emailAddr;

              var token = this.getToken();
              var enToken = this.fixedEncodeURIComponent(token);
              url += '&iPlanetDirectoryPro=' + enToken;

            var xhrArgs = {
              handleAs: "text",
              preventCache: true,
              url: url,
              headers: {
                  "X-Requested-With": null
                  //,"iPlanetDirectoryPro": token
              },
              //content: { "iPlanetDirectoryPro": token },
              load: this.doProcessResult,
              error: function(error){
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                  title: 'Slope',
                  content: error,
                  size: 'sm'
                });
              }
            };
            var deferred = dojo.xhrGet(xhrArgs);
          }
          else
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Slope',
              content: 'No slopeService service available',
              size: 'sm'
            });
          }

          this.parent.email = emailAddr;
          this.parent.isEditing = false;
        },

        doProcessResult: function(result)
        {
          var content = '';
          var ind = result.indexOf('Succeeded');
          if (ind != -1)
          {
            content = 'Thank you for submitting your analysis. This job request has been successfully received. Upon completion, you will be notified through email with result rendered.';
          }
          else
          {
            content = 'Your job request failed to submit.  Please try it again.';
          }
          topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
            title: 'Slope',
            content: content,
            size: 'sm'
          });
        },

        cleanIt: function(self)
        {
          self.slopeTop.destroyRecursive();
          self.slopeLeft.destroyRecursive();
          self.slopeRight.destroyRecursive();
          self.slopeBottom.destroyRecursive();
          this.slopeEmail.destroyRecursive();

          self.slopeDem.destroyRecursive();
          // self.postSpacing.destroyRecursive();
          // self.sizePlane.destroyRecursive();

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
          this.parent.email = this.slopeEmail.get('value');
          this.parent.isEditing = true;
          var option = Edit.SCALE | Edit.MOVE;
          this.parent.editMarker(this.graphic, option);
          var self = this;
          this.cleanIt(self);
        },

        doRemove: function(evt)
        {
          //this.parent.removeMapGraphic(this.graphic);
          this.parent.email = this.slopeEmail.get('value');
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

/*
        getProjection: function(proj)
        {
          var ind = proj.indexOf('urn:ogc:def:crs:');
          var p = proj.substring(ind+16);
          p = p.replace('::', ':');
          return p;
        },
*/
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
