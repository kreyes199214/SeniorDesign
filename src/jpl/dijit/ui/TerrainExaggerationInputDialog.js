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
    "dojo/dom-construct",
    "dojo/topic",
    "dojo/query",
    "dojo/_base/array",
    "dojo/_base/window",
    "bootstrap/Modal",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/form/NumberSpinner',
    'esri/toolbars/edit',
    'jpl/events/ToolEvent',
    'jpl/events/MapEvent',
    'jpl/config/Config',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/Point',
    'dojo/text!../templates/TerrainExaggerationInputDialog.html'
], function (declare, lang, on, dom, domConstruct, topic, query, array, win, Modal, _WidgetBase, _TemplatedMixin, NumberSpinner, Edit, ToolEvent, MapEvent, Config, webMercatorUtils, Point, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        terrainExaggerationInputSpinner: null,
        terrainExaggerationValue: 1,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            on(this.submitButton, "click", lang.hitch(this, this.submit));
        },

        setValue: function(value){
            this.terrainExaggerationValue = value;
        },

        startup: function()
        {
            this.config = Config.getInstance();

            query(this.terrainExaggerationInputContainer).modal();
            query(this.terrainExaggerationInputContainer).on('hidden.bs.modal', lang.hitch(this, this.destroyModal));

            var self = this;
            this.terrainExaggerationInputSpinner = new NumberSpinner({
                value: self.terrainExaggerationValue,
                smallDelta: 0.5,
                constraints: { min:0, max:20, places:1 },
                id: "terrainExaggerationValueInput",
                style: "width:150px"
            }, "terrainExaggerationValueInput");
            this.terrainExaggerationInputSpinner.startup();
            this.terrainExaggerationInputSpinner.textbox.style.textAlign = 'left';

        },

  
        createContainer: function(){
            this.placeAt(win.body());
        },

        submit: function(){
            var terrainExaggerationValue  = this.terrainExaggerationInputSpinner.get('value');
            topic.publish(MapEvent.prototype.CHANGE_TERRAIN_EXAGGERATION, {"terrainExaggerationValue": terrainExaggerationValue});
        },

        destroyModal: function(){
            this.terrainExaggerationInputSpinner.destroyRecursive();
            domConstruct.destroy("#terrainExaggerationInputContainer");
        }

    });
});
