/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/DistanceInputDialog
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/topic",
    "dojo/query",
    "dojo/_base/window",

"esri/toolbars/edit",
"jpl/events/ToolEvent",
"dojo/dom-construct",
"dijit/form/TextBox",
"jpl/controllers/DistanceController",
"jpl/events/BrowserEvent",

    'dojo/text!../templates/DistanceInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, Edit, ToolEvent, domConstruct, TextBox, DistanceController, BrowserEvent) {
    return declare(null, {
        parent: null,       
        editToolbar: null,        
        graphic: null,
        label: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.distanceInputContainer).modal();

            //on(this.distanceModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.distanceOKButton, "click", lang.hitch(this, this.doOK));
            //on(this.distanceEditButton, "click", lang.hitch(this, this.doEdit));
            //on(this.distanceRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        //startup: function(parent, editToolbar, graphic, value)
        startup: function(parent, editToolbar, graphic)
        {
          this.parent          = parent;
          this.editToolbar     = editToolbar;
          this.graphic = graphic;

          var config = parent.config;

          //query(this.distanceInputContainer).modal();

/*
          var label = new dijit.form.TextBox({
            id: "distanceValue",
            value: "Calculating .....",
            readOnly: true,
            //placeHolder: "type in your name"
            style: "width: 220px;"
          }, "distanceBox");
          this.label = label;

          var html = "<b>Distance:&nbsp;&nbsp;Calculating.....";
          topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
            title: 'Distance Result',
            content: html,
            size: 'lg'
          });
*/

          var distanceServiceURL =config.services.distanceService.equirect;
          if (this.parent.basemapSingleton.currentMapProjection === config.projection.N_POLE) {
            distanceServiceURL = config.services.distanceService.northpole;
          } else if(this.parent.basemapSingleton.currentMapProjection === config.projection.S_POLE) {
            distanceServiceURL = config.services.distanceService.southpole;
          }

          var endPoint =config.services.globalDEMService.equirect;
          if (this.parent.basemapSingleton.currentMapProjection === config.projection.N_POLE) {
            endPoint = config.services.globalDEMService.northpole;
          } else if(this.parent.basemapSingleton.currentMapProjection === config.projection.S_POLE) {
            endPoint = config.services.globalDEMService.southpole;
          }

          DistanceController.prototype.calculateDistance(
            distanceServiceURL,
            endPoint,
            graphic.geometry.paths,
            config.ellipsoidRadius
            ).then(lang.hitch(this, function (totalDistance) {
              //label.set('value', totalDistance);
              var html = '<table width="100%" align="center"><tr><td align="center"><b>Distance:&nbsp;&nbsp;' + totalDistance + '</td></tr></table>';
              console.log('DistanceController():: html = ' + html);
              topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: 'Distance Result',
                content: html, 
                size: 'sm'
              });
            })
          );
          this.parent.isEditing = false;
        },

        modalCleanup: function(evt)
        {
          var self = this;
          self.label.destroyRecursive();
          //this.parent.removeMapGraphic(self.graphic);
          this.parent.isEditing = false;
        },

        doEdit: function(evt)
        {
          //domConstruct.destroy(this.label);
          this.label.destroyRecursive();
          this.parent.editToolbar.activate(Edit.SCALE | Edit.MOVE, this.graphic);
          this.parent.isEditing = true;
        },

        doRemove: function(evt)
        {
          var self = this;
          //domConstruct.destroy(this.label);
          this.label.destroyRecursive();
          //this.parent.removeMapGraphic(self.graphic);
          this.parent.isEditing = false;
        },

        doOK: function(evt)
        {
          var self = this;
          this.label.destroyRecursive();
          this.parent.isEditing = false;
        },

        createContainer: function(){
            this.placeAt(win.body());
        }

    });
});
