/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/RockInputDialog
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
    'dojo/text!../templates/RockInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, request, Modal, NumberSpinner, _WidgetBase, _TemplatedMixin, Select, JSONConverter, Edit, ToolEvent, Config, IndexerUtil, BrowserEvent,template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        map: null,
        parent: null,
        //geometry: null,
        editToolbar: null,
        graphic: null,
        rockTop: null,
        rockLeft: null,
        rockRight: null,
        rockBottom: null,
        imgData: null,
        rockEmail: null,
        email: null,
        proj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.rockInputContainer).modal();

            on(this.rockSubmitButton, "click", lang.hitch(this, this.doRock));
            on(this.rockModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.rockEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.rockRemoveButton, "click", lang.hitch(this, this.doRemove));
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

            query(this.rockInputContainer).modal();

            //var extent = this.geometry._extent;
            var extent = this.graphic._extent;

            this.rockTop = new NumberSpinner({
                value: extent.ymax,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "rockTop",
                style: "width:120px"
            }, "rockTop");
            this.rockTop.startup();
            this.rockTop.textbox.style.textAlign = 'left';

            this.rockLeft = new NumberSpinner({
                value: extent.xmin,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "rockLeft",
                style: "width:120px"
            }, "rockLeft");
            this.rockLeft.startup();
            this.rockLeft.textbox.style.textAlign = 'left';

            this.rockRight = new NumberSpinner({
                value: extent.xmax,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "rockRight",
                style: "width:120px"
            }, "rockRight");
            this.rockRight.startup();
            this.rockRight.textbox.style.textAlign = 'left';

            this.rockBottom = new NumberSpinner({
                value: extent.ymin,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "rockBottom",
                style: "width:120px"
            }, "rockBottom");
            this.rockBottom.startup();
            this.rockBottom.textbox.style.textAlign = 'left';

            var options = this.getImgDataList();
            this.imgData = new Select({
                id: "imgData",
                name: "imgData",
                options: options,
                style: "width:80%"
            }, "imgData");
            this.imgData.startup();

            this.rockEmail = new dijit.form.TextBox({
                id: "rockEmail",
                value: parent.email,
                //value: "qvu@jpl.nasa.gov",
                required: true,
                intermediateChanges: true,
                placeHolder: "Enter your email to get the result",
                style: "width: 280px;"
            }, "rockEmail");
            this.rockEmail.startup();

            if (parent.email == "")
                this.disableW("rockSubmitButton", true);
            else
                this.disableW("rockSubmitButton", false);

            this.disableW("rockSubmitButton", false);

            this.email = dijit.byId("rockEmail");
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
                this.disableW("rockSubmitButton", true);
            }
            else
            {
                //enable Submit
                this.disableW("rockSubmitButton", false);
            }
            return true;
        },

        getImgDataList: function ()
        {
            var options = [];

            var top    = this.rockTop.get('value');
            var left   = this.rockLeft.get('value');
            var right  = this.rockRight.get('value');
            var bottom = this.rockBottom.get('value');

            //real url
            var param = {
                bbox: left + ',' + bottom + ',' + right + ',' + top
            };
            url = this.indexerUtil.createGetRockCraterInputDataUrl(param);
            // work around for now.  Slope only works in equirect projection
            //url = url.replace("PROJECTION", "eq");

            var json = new JSONConverter();
            var data = json.getJson(url);

            for (var i=0; i<data.length; i++)
            {
                var doc = data[i];
                var value = doc.product_id;
                var v = doc.product_id;
                var o = {"label": v, "value": value};
                options.push(o);
            }
            return options;
        },

        doRock: function(evt)
        {
            var emailAddr = this.rockEmail.get('value');
            var ind = emailAddr.indexOf('@');
            if (emailAddr == "" || ind == -1)
            {
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                    title: 'Rock',
                    content: 'Please enter a valid email address to get your query result',
                    size: 'sm'
                });
                evt.stopPropagation();
                evt.preventDefault();
                return;
            }

            var top    = this.rockTop.get('value');
            var left   = this.rockLeft.get('value');
            var right  = this.rockRight.get('value');
            var bottom = this.rockBottom.get('value');

            var self = this;

            self.rockTop.destroyRecursive();

            this.rockTop.destroyRecursive();
            this.rockLeft.destroyRecursive();
            this.rockRight.destroyRecursive();
            this.rockBottom.destroyRecursive();
            this.imgData.destroyRecursive();
            this.rockEmail.destroyRecursive();

            this.imgData.destroyRecursive();

            if(this.config.services.rockService)
            {
                var url = this.config.services.rockService;
                url += '?ulat=' + top;
                url += '&ulon=' + left;
                url += '&llat=' + bottom;
                url += '&llon=' + right;
                url += '&email=' + emailAddr;

                var token = this.getToken();
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
                            title: 'Rock',
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
                    title: 'Rock',
                    content: 'No rockService service available',
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
                title: 'Detect Rock',
                content: content,
                size: 'sm'
            });
        },

        cleanIt: function(self)
        {
            self.rockTop.destroyRecursive();
            self.rockLeft.destroyRecursive();
            self.rockRight.destroyRecursive();
            self.rockBottom.destroyRecursive();
            this.rockEmail.destroyRecursive();

            self.imgData.destroyRecursive();
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
            this.parent.email = this.rockEmail.get('value');
            this.parent.isEditing = true;
            var option = Edit.SCALE | Edit.MOVE;
            this.parent.editMarker(this.graphic, option);
            var self = this;
            this.cleanIt(self);
        },

        doRemove: function(evt)
        {
            //this.parent.removeMapGraphic(this.graphic);
            this.parent.email = this.rockEmail.get('value');
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
