/**
 * A dialog window for Sun angle calculation parameters.
 *
 * @module jpl/dijit/ui/SunAngleDialog
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    'dojo/text!./../templates/SunAngleDialog.html',
    "dijit/Dialog",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/on",
    "dijit/registry",
    "dijit/form/Form",
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/NumberTextBox",
    "xstyle/css!./../css/SunAngleDialog.css",
    "dojo/topic",
    "jpl/events/ToolEvent",
    "dojo/dom-attr",
    "dojo/date/locale",
    "dojo/date",
    "dojox/layout/TableContainer",
    "dojo/query",
    "bootstrap/Modal",
    "dojo/_base/window",
"dijit/form/NumberSpinner",
"esri/toolbars/edit",
    "dojo/dom-style"
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, Dialog, connectUtil, lang, on, registry, Form, DateTextBox, TimeTextBox, Button, TextBox, ValidationTextBox, NumberTextBox, sunAngleDialogCSS, topic, ToolEvent , domAttr, locale, DojoDate, TableContainer, query, Modal, win, NumberSpinner, Edit, domStyle){
    return declare("SunAngleDialog", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],{
        templateString: template,
        widgetsInTemplate: true,
        saStartDate: null,
        saStartHour: null,
        saStartMinute: null,
        saStartSecond: null,
        saEndDate: null,
        saEndHour: null,
        saEndMinute: null,
        saEndSecond: null,
        saInterval: null,
        parent: null,
        editToolbar: null,
        graphic: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            query(this.sunAngleModal).modal();
            on(this.sunAngleSubmitButton, "click", lang.hitch(this, this.doSunAngle));
            on(this.sunangleModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.sunangleMoveButton, "click", lang.hitch(this, this.doEdit));
            on(this.sunangleRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic){
          this.parent          = parent;
          this.editToolbar     = editToolbar;
          this.graphic = graphic;

          var today = new Date();
          var tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          this.saStartDate = new DateTextBox({
             id: "saStartDate",
             value: today,
             style: "width: 150px",
             constraints: {datePattern:'MM/dd/yyyy'}
          }, "saStartDate");
          this.saStartDate.startup();

          this.saStartHour = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:24, places:0 },
              id: "saStartHour",
              style: "width:55px"
          }, "saStartHour");
          this.saStartHour.startup();
          this.saStartHour.textbox.style.textAlign = 'left';

          this.saStartMinute = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:60, places:0 },
              id: "saStartMinute",
              style: "width:55px"
          }, "saStartMinute");
          this.saStartMinute.startup();
          this.saStartMinute.textbox.style.textAlign = 'left';

          this.saStartSecond = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:60, places:0 },
              id: "saStartSecond",
              style: "width:55px"
          }, "saStartSecond");
          this.saStartSecond.startup();
          this.saStartSecond.textbox.style.textAlign = 'left';

          this.saEndDate = new DateTextBox({
             value: tomorrow,
             style: "width: 150px",
             constraints: {datePattern:'MM/dd/yyyy'}
          }, "saEndDate");
          this.saEndDate.startup();

          this.saEndHour = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:24, places:0 },
              id: "saEndHour",
              style: "width:55px"
          }, "saEndHour");
          this.saEndHour.startup();
          this.saEndHour.textbox.style.textAlign = 'left';

          this.saEndMinute = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:60, places:0 },
              id: "saEndMinute",
              style: "width:55px"
          }, "saEndMinute");
          this.saEndMinute.startup();
          this.saEndMinute.textbox.style.textAlign = 'left';

          this.saEndSecond = new NumberSpinner({
              value: 0,
              smallDesaa: 1,
              constraints: { min:0, max:60, places:0 },
              id: "saEndSecond",
              style: "width:55px"
          }, "saEndSecond");
          this.saEndSecond.startup();
          this.saEndSecond.textbox.style.textAlign = 'left';

          this.saInterval = new NumberSpinner({
              value: 50,
              smallDesaa: 1,
              constraints: { min:1, max:9999, places:0 },
              id: "saInterval",
              style: "width:90px"
          }, "saInterval");
          this.saInterval.startup();
          this.saInterval.textbox.style.textAlign = 'left';

          //query(this.sunAngleModal).modal();
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        validateDates: function(startDate, endDate){
            if (DojoDate.compare(startDate, endDate) >= 0){
                domStyle.set(this.sunAngleValidationText, "display", "");
                return false;
            }
            domStyle.set(this.sunAngleValidationText, "display", "none");
            return true;
        },

        combineDateAndTime: function(date, time){
            var year = locale.format(date, {selector:"date", datePattern:"yyyy"});
            var month = parseInt(locale.format(date, {selector:"date", datePattern:"MM"}), 10) - 1;
            var day = locale.format(date, {selector:"date", datePattern:"dd"});
            var hour = locale.format(time, {selector:"date", datePattern:"H"});
            var minute = locale.format(time, {selector:"date", datePattern:"m"});
            var second = locale.format(time, {selector:"date", datePattern:"s"});
            //var millisecond = locale.format(time, {selector:"date", datePattern:"SSS"});

            return new Date(year, month, day, hour, minute, second);
        },

        cleanIt: function(self)
        {
          self.saStartDate.destroyRecursive();
          self.saStartHour.destroyRecursive();
          self.saStartMinute.destroyRecursive();
          self.saStartSecond.destroyRecursive();

          self.saEndDate.destroyRecursive();
          self.saEndHour.destroyRecursive();
          self.saEndMinute.destroyRecursive();
          self.saEndSecond.destroyRecursive();

          self.saInterval.destroyRecursive();
        },

        modalCleanup: function(evt)
        {
          var self = this;
          this.cleanIt(self);
          //this.parent.removeMapGraphic(self.graphic);
          this.parent.isEditing = false;
        },

        doSunAngle: function(evt)
        {
          var self = this;

          var st  = this.saStartDate.get('value');
          var shh = this.saStartHour.get('value');
          var smm = this.saStartMinute.get('value');
          var sss = this.saStartSecond.get('value');

          var now = new Date(st);
          var year  = now.getFullYear();
          var month = now.getMonth()+1;
          var day   = now.getDate();
          var startDate = '' + year + '-' + this.pad(month,2) + '-' + this.pad(day,2);
          var startTime = '' + this.pad(shh, 2) + ':' + this.pad(smm, 2) + ':' + this.pad(sss,2);
          //var startDateTime = startDate + 'T' + startTime; 
          //var startDateTime = now; 
          var startDateTime = new Date(year, month, day, shh, smm, sss);

          var et  = this.saEndDate.get('value');
          var ehh = this.saEndHour.get('value');
          var emm = this.saEndMinute.get('value');
          var ess = this.saEndSecond.get('value');

          now = new Date(et);
          year  = now.getFullYear();
          month = now.getMonth()+1;
          day   = now.getDate();
          var endDate = '' + year + '-' + this.pad(month,2) + '-' + this.pad(day,2);
          var endTime = '' + this.pad(ehh, 2) + ':' + this.pad(emm, 2) + ':' + this.pad(ess,2);
          //var endDateTime = endDate + 'T' + endTime; 
          //var endDateTime = now; 
          var endDateTime = new Date(year, month, day, ehh, emm, ess);

          var intervals = this.saInterval.get('value');
          var dateDifferenceInSecond = DojoDate.difference(startDateTime, endDateTime, "second");
          var intervalInSeconds = dateDifferenceInSecond / intervals;

          self.saStartDate.destroyRecursive();
          self.saStartHour.destroyRecursive();
          self.saStartMinute.destroyRecursive();
          self.saStartSecond.destroyRecursive();

          self.saEndDate.destroyRecursive();
          self.saEndHour.destroyRecursive();
          self.saEndMinute.destroyRecursive();
          self.saEndSecond.destroyRecursive();

          self.saInterval.destroyRecursive();

          if (self.validateDates(startDateTime, endDateTime))
          {
            topic.publish(ToolEvent.prototype.SUN_ANGLE_DIALOG_RESPONSE, startDate, startTime, endDate, endTime, intervalInSeconds);
          }
          this.parent.isEditing = false;
        },

        doEdit: function(evt)
        {
          var self = this;
          this.cleanIt(self);
          var option = Edit.MOVE;
          this.parent.editMarker(this.graphic, option);
          //this.parent.editToolbar.activate(Edit.SCALE | Edit.MOVE, this.graphic);
          this.parent.isEditing = true;
        },

        doRemove: function(evt)
        {
          var self = this;
          this.cleanIt(self);
          //this.parent.removeMapGraphic(self.graphic);
          this.parent.isEditing = false;
        },

        pad: function (num, size) {
          var s = num+"";
          while (s.length < size) s = "0" + s;
          return s;
        }

    });
});
