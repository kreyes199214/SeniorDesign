/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/EspInputDialog
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
    'dojo/text!../templates/SlopeDemoInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, request, Modal, NumberSpinner, _WidgetBase, _TemplatedMixin, Select, JSONConverter, Edit, ToolEvent, Config, IndexerUtil, BrowserEvent,template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        map: null,
        parent: null,
        //geometry: null,
        editToolbar: null,
        graphic: null,
        espTop: null,
        espLeft: null,
        espRight: null,
        espBottom: null,
        espEmail: null,
        email: null,
        proj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.espInputContainer).modal();

            on(this.espSubmitButton, "click", lang.hitch(this, this.doEsp));
            on(this.espModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.espEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.espRemoveButton, "click", lang.hitch(this, this.doRemove));
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

            query(this.espInputContainer).modal();

            //var extent = this.geometry._extent;
            var extent = this.graphic._extent;

            this.espTop = new NumberSpinner({
                value: extent.ymax,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "espTop",
                style: "width:120px"
            }, "espTop");
            this.espTop.startup();
            this.espTop.textbox.style.textAlign = 'left';

            this.espLeft = new NumberSpinner({
                value: extent.xmin,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "espLeft",
                style: "width:120px"
            }, "espLeft");
            this.espLeft.startup();
            this.espLeft.textbox.style.textAlign = 'left';

            this.espRight = new NumberSpinner({
                value: extent.xmax,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "espRight",
                style: "width:120px"
            }, "espRight");
            this.espRight.startup();
            this.espRight.textbox.style.textAlign = 'left';

            this.espBottom = new NumberSpinner({
                value: extent.ymin,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "espBottom",
                style: "width:120px"
            }, "espBottom");
            this.espBottom.startup();
            this.espBottom.textbox.style.textAlign = 'left';

            this.espEmail = new dijit.form.TextBox({
                id: "espEmail",
                value: parent.email,
                //value: "qvu@jpl.nasa.gov",
                required: true,
                intermediateChanges: true,
                placeHolder: "Enter your email to get the result",
                style: "width: 280px;"
            }, "espEmail");
            this.espEmail.startup();

            if (parent.email == "")
                this.disableW("espSubmitButton", true);
            else
                this.disableW("espSubmitButton", false);

            this.disableW("espSubmitButton", false);

            this.email = dijit.byId("espEmail");
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
                this.disableW("espSubmitButton", true);
            }
            else
            {
                //enable Submit
                this.disableW("espSubmitButton", false);
            }
            return true;
        },

        doEsp: function(evt)
        {
            var emailAddr = this.espEmail.get('value');
            var ind = emailAddr.indexOf('@');
            if (emailAddr == "" || ind == -1)
            {
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                    title: 'Esp',
                    content: 'Please enter a valid email address to get your query result',
                    size: 'sm'
                });
                evt.stopPropagation();
                evt.preventDefault();
                return;
            }

            var top    = this.espTop.get('value');
            var left   = this.espLeft.get('value');
            var right  = this.espRight.get('value');
            var bottom = this.espBottom.get('value');

            //var token = this.getToken();
            //token = escape(token);
            //token = token.replace(/\+/g, '%2B');
            //token = token.replace(/\@/g, '%40');
            //token = token.replace(/\//g, '%2F');
            //token = this.fixedEncodeURIComponent(token);
            //url += '&iPlanetDirectoryPro=' + token;

            var self = this;

            self.espTop.destroyRecursive();

            this.espTop.destroyRecursive();
            this.espLeft.destroyRecursive();
            this.espRight.destroyRecursive();
            this.espBottom.destroyRecursive();
            this.espEmail.destroyRecursive();

            var result = "Succeeded";
            this.doProcessResult(result);

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
                title: 'Generate Slope Map',
                content: content,
                size: 'sm'
            });
        },

        cleanIt: function(self)
        {
            self.espTop.destroyRecursive();
            self.espLeft.destroyRecursive();
            self.espRight.destroyRecursive();
            self.espBottom.destroyRecursive();
            this.espEmail.destroyRecursive();
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
            this.parent.email = this.espEmail.get('value');
            this.parent.isEditing = true;
            var option = Edit.SCALE | Edit.MOVE;
            this.parent.editMarker(this.graphic, option);
            var self = this;
            this.cleanIt(self);
        },

        doRemove: function(evt)
        {
            //this.parent.removeMapGraphic(this.graphic);
            this.parent.email = this.espEmail.get('value');
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
                // do something to response
                var reponseJson = JSON.parse(xhr.responseText);
                dom.byId('loginToken').innerHTML = reponseJson.tokenId;
                return reponseJson.tokenId;
            } else {
                //prevent the page from navigating after submit
                dom.byId('loginToken').innerHTML = 'ERROR';
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
