define( [   
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/Dialog"
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Dialog) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {            

            dialog: null,

            createDialog: function(args) {
                console.log('in createDialog()');
                if (this.dialog == null)
                {
                    this.dialog = new Dialog(dojo.mixin({
                        onCancel: dojo.hitch(this, this.modalCleanup),
                        content: this
                    }, args));

                  console.log('in createDialog():: this.dialog = ' + this.dialog);
                  console.log(this.dialog);
                }
                return this.dialog;
            },

            showDialog: function (args) {
                console.log('in showdialog():: this.dialog = ' + this.dialog);
                console.log('in showdialog():: args = ' + args);
                if (this.dialog == null)
                {
                  this.createDialog(args);
                }
                //alert('in showdialog():: this.dialog = ' + this.dialog);
                this.dialog.show();
                //alert('in showdialog():: this.dialog = ' + this.dialog);
                console.log('in showdialog():: this.dialog = ' + this.dialog);
                console.log(this.dialog);
/*
                this.dialog.show().then(function () {

                //Fix layout not correct,
                //dialog is created with empty content, that makes dialog has wrong size
                this.dialog.resize();
              });
*/
            },

            hideDialog: function() {
                if (this.dialog != null)
                    this.dialog.hide();
            },

            destroyDialog: function() {
                //alert('in destroyDialog()');
                if (this.dialog != null)
                    this.dialog.destroy();
            }

        });

    });
