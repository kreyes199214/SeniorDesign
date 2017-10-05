/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/ElevationInputDialog
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

"esri/toolbars/edit",
"jpl/events/ToolEvent",
"dojo/dom-construct",
"dijit/form/TextBox",
"jpl/controllers/DistanceController",

    'dojo/text!../templates/ElevationInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, Edit, ToolEvent, domConstruct, TextBox, DistanceController, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        parent: null,       
        proj: null,       
        editToolbar: null,        
        graphic: null,
        label: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.elevationInputContainer).modal();

            on(this.elevationSubmitButton, "click", lang.hitch(this, this.doElevation));
            on(this.elevationModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.elevationEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.elevationRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic)
        {
          this.parent      = parent;
          this.editToolbar = editToolbar;
          this.graphic     = graphic;
          this.proj        = parent.basemapSingleton.currentMapProjection;

          var config = parent.config;

          query(this.elevationInputContainer).modal();

          var label = new dijit.form.TextBox({
            id: "elevationValue",
            value: "Calculating ...",
            readOnly: true,
            //placeHolder: "type in your name"
            style: "width: 220px;"
          }, "elevationBox");
          this.label = label;

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
              label.set('value', totalDistance);
            })
          );
        },

        doElevation: function(evt)
        {
          var self = this;
          self.label.destroyRecursive();
          topic.publish(ToolEvent.prototype.SHOW_ELEVATION_PLOT, {
            graphic: this.graphic,
            projection: this.proj
          });
          //this.parent.removeMapGraphic(self.graphic);
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
          var option = Edit.SCALE | Edit.MOVE;
          this.parent.editMarker(this.graphic, option);
          //this.parent.editToolbar.activate(Edit.SCALE | Edit.MOVE, this.graphic);
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

        createContainer: function(){
            this.placeAt(win.body());
        }

    });
});
