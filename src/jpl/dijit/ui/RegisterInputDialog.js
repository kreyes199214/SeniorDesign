/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/RegisterInputDialog
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

    "dijit/form/NumberSpinner",
    "esri/toolbars/edit",
    "esri/graphic",
    
    "jpl/events/ToolEvent",
    "jpl/config/Config",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",
    "jpl/events/BrowserEvent",
    'dojo/text!../templates/RegisterInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, NumberSpinner, Edit, Graphic, ToolEvent,  Config, webMercatorUtils, Point, BrowserEvent, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,

        constructor: function () {
        },

        postCreate: function () {
          this.createContainer();
          on(this.registerSubmitButton, "click", lang.hitch(this, this.doRegister));
        },

        startup: function()
        {
          this.config = Config.getInstance();
          query(this.registerInputDialog).modal();
          this.modalTitle.innerHTML = '<b>' + this.config.data.title + ' User Account Registration Request</b>';
          this.modalDescription.innerHTML = 'Almost all ' + this.config.data.title + ' functionality and data are available to the general public without restriction or the need to register for an individual or group account.  However, requests to establish registered accounts will be considered for those users who can demonstrate a justifiable need to access the features not available to the general public.  These features include the ability to run lighting analyses and slope analyses.<br><br>If you believe your need for access to one or more of these additional features is justified, then please provide the following information for consideration:<br><br>';
          //this.modalFooter.innerHTML = '<br>Thank you for your interest in ' + this.config.data.title + '!<br><br>';
        },

        doRegister: function(evt)
        {
          //console.log('RegisterInputDialog::doRegsiter()');
          var name = "";
          var phone = "";
          var email = "";
          var username = "";
          var desc = "";

          var o = dojo.byId("regname");
          var val = o.value;
          console.log('RegisterInputDialog::doRegsiter(regname) - val = ' + val);
          if (val == "")
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Invalid Name',
              content: 'Please enter a name',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            o.focus();
            return;
          }
          name = val;

          o = dojo.byId("regphone");
          val = o.value;
          console.log('RegisterInputDialog::doRegsiter(regphone) - val = ' + val);
          if (val == "")
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Invalid Phone Number',
              content: 'Please enter a phone number',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            o.focus();
            return;
          }
          phone = val;

          o = dojo.byId("regemail");
          val = o.value;
          console.log('RegisterInputDialog::doRegsiter(regemail) - val = ' + val);
          if (val == "")
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Invalid Email',
              content: 'Please enter an email',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            o.focus();
            return;
          }
          email = val;

          o = dojo.byId("regusername");
          val = o.value;
          console.log('RegisterInputDialog::doRegsiter(regusername) - val = ' + val);
          if (val == "")
          {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
              title: 'Invalid Username',
              content: 'Please enter a username',
              size: 'sm'
            });
            evt.stopPropagation();
            evt.preventDefault();
            o.focus();
            return;
          }
          username = val;

          o = dojo.byId("regdesc");
          desc = o.value;

          console.log('RegisterInputDialog::doRegsiter() - name = ' + name);
          console.log('RegisterInputDialog::doRegsiter() - phone = ' + phone);
          console.log('RegisterInputDialog::doRegsiter() - email = ' + email);
          console.log('RegisterInputDialog::doRegsiter() - username = ' + username);
          console.log('RegisterInputDialog::doRegsiter() - desc = ' + desc);

          //var form = dojo.byId("registerInputDialogForm");
          //console.log('RegisterInputDialog::doRegsiter() - form = ' + form);
          //console.log(form);

          var message = '?name=' + name;
          message += '&phone=' + phone;
          message += '&email=' + email;
          message += '&username=' + username;
          message += '&desc=' + encodeURI(desc);
            message += '&trek=' + this.config.data.trekID;

          //send email to moontrek@jpl.nasa.gov
          dojo.xhrGet({
            url: this.config.data.services.registerationUrl + message,
            load: function(response) {
              topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: 'Registration',
                content: 'Your registration was sent sucessfully. You will recieve a notification shortly at the email address you have provided.<br><br>Again, thank you for your interest in Trek!',
                size: 'sm'
              });
            },
            error: function() {
              topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: 'Registration',
                content: 'Your registration has failed.<br>Please try to register again.',
                size: 'sm'
              });
            }
            //handle: function() {
            //  alert('handler');
            //}
          });
        },

        createContainer: function(){
          this.placeAt(win.body());
        }

    });
});
