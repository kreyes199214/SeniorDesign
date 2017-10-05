/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/CraterInputDialog
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
    "dojo/Deferred",
    "dojo/dom-class",
    "dojo/request/xhr",
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
    'dojo/text!../templates/CraterInputDialog.html'
], function (declare, lang, on, dom, topic, query, win, request, Deferred, domClass, xhr, Modal, NumberSpinner,
             _WidgetBase, _TemplatedMixin, Select, JSONConverter, Edit, ToolEvent, Config,
             IndexerUtil, BrowserEvent,template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        map: null,
        parent: null,
        //geometry: null,
        editToolbar: null,
        graphic: null,
        craterTop: null,
        craterLeft: null,
        craterRight: null,
        craterBottom: null,
        imgData: null,
        downsample: null,
        craterEmail: null,
        email: null,
        proj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            //query(this.craterInputContainer).modal();

            on(this.craterSubmitButton, "click", lang.hitch(this, this.doCrater));
            on(this.craterModalClose, "click", lang.hitch(this, this.modalCleanup));

            //on(this.craterEditButton, "click", lang.hitch(this, this.doEdit));
            on(this.craterRemoveButton, "click", lang.hitch(this, this.doRemove));
        },

        startup: function(parent, editToolbar, graphic)
        {
            query(this.craterInputContainer).modal();
            domClass.add(this.craterModalClose, "hidden");
            domClass.add(this.craterSubmitButton, "hidden");
            domClass.add(this.craterRemoveButton, "hidden");

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

            //var extent = this.geometry._extent;
            var extent = this.graphic._extent;

            this.craterTop = new NumberSpinner({
                value: extent.ymax,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "craterTop",
                style: "width:120px"
            }, "craterTop");
            this.craterTop.startup();
            this.craterTop.textbox.style.textAlign = 'left';

            this.craterLeft = new NumberSpinner({
                value: extent.xmin,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "craterLeft",
                style: "width:120px"
            }, "craterLeft");
            this.craterLeft.startup();
            this.craterLeft.textbox.style.textAlign = 'left';

            this.craterRight = new NumberSpinner({
                value: extent.xmax,
                smallDelta: 0.1,
                constraints: { min:xmin, max:xmax, places:4 },
                id: "craterRight",
                style: "width:120px"
            }, "craterRight");
            this.craterRight.startup();
            this.craterRight.textbox.style.textAlign = 'left';

            this.craterBottom = new NumberSpinner({
                value: extent.ymin,
                smallDelta: 0.1,
                constraints: { min:ymin, max:ymax, places:4 },
                id: "craterBottom",
                style: "width:120px"
            }, "craterBottom");
            this.craterBottom.startup();
            this.craterBottom.textbox.style.textAlign = 'left';

            /*var options = this.getImgDataList();
            this.imgData = new Select({
                id: "imgData",
                name: "imgData",
                options: options,
                style: "width:80%"
            }, "imgData");
            this.imgData.startup();*/
            this.getImgDataList();

            this.downsample = new NumberSpinner({
                value: 5,
                smallDelta: 1,
                constraints: { min:0, max:10, places:0 },
                id: "downsample",
                style: "width:120px"
            }, "downsample");
            this.downsample.startup();
            this.downsample.textbox.style.textAlign = 'left';

            this.craterEmail = new dijit.form.TextBox({
                id: "craterEmail",
                value: parent.email,
                //value: "qvu@jpl.nasa.gov",
                required: true,
                intermediateChanges: true,
                placeHolder: "Enter your email to get the result",
                style: "width: 280px;"
            }, "craterEmail");
            this.craterEmail.startup();

            if (parent.email == "")
                this.disableW("craterSubmitButton", true);
            else
                this.disableW("craterSubmitButton", false);

            this.disableW("craterSubmitButton", false);

            this.email = dijit.byId("craterEmail");
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
                this.disableW("craterSubmitButton", true);
            }
            else
            {
                //enable Submit
                this.disableW("craterSubmitButton", false);
            }
            return true;
        },

        getImgDataList: function ()
        {
            var options = [];

            var top    = this.craterTop.get('value');
            var left   = this.craterLeft.get('value');
            var right  = this.craterRight.get('value');
            var bottom = this.craterBottom.get('value');

            //real url
            var param = {
                bbox: left + ',' + bottom + ',' + right + ',' + top
            };
            url = this.indexerUtil.createGetRockCraterInputDataUrl(param);
            // work around for now.  Slope only works in equirect projection
            //url = url.replace("PROJECTION", "eq");

            /*var json = new JSONConverter();
            var data = json.getJson(url);*/

            var self = this;
            xhr(url, {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(lang.hitch(this, function(data) {
                for (var i=0; i<data.length; i++)
                {
                    var doc = data[i];
                    var value = doc.product_id;
                    var v = doc.product_id;
                    var o = {"label": v, "value": value};
                    options.push(o);
                }
                //return options;

                self.imgData = new Select({
                    id: "imgData",
                    name: "imgData",
                    options: options,
                    style: "width:80%"
                }, "imgData");
                self.imgData.startup();

                if(data.length < 1){
                    domClass.add(self.loadingBox, "hidden");

                    domClass.remove(self.errorBox, "hidden");
                    domClass.remove(self.craterModalClose, "hidden");
                    domClass.remove(self.craterRemoveButton, "hidden");
                    return;
                }

                domClass.add(self.loadingBox, "hidden");
                domClass.remove(self.contentBox, "hidden");

                domClass.remove(self.craterModalClose, "hidden");
                domClass.remove(self.craterSubmitButton, "hidden");
                domClass.remove(self.craterRemoveButton, "hidden");

            }), function(err) {
                console.log("error retrieving img data list:" + url + " " +  err);
                domClass.remove(self.craterModalClose, "hidden");
                domClass.remove(self.craterSubmitButton, "hidden");
                domClass.remove(self.craterRemoveButton, "hidden");
            });
        },

        doCrater: function(evt)
        {
            var emailAddr = this.craterEmail.get('value');
            var ind = emailAddr.indexOf('@');
            if (emailAddr == "" || ind == -1)
            {
                topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                    title: 'Crater',
                    content: 'Please enter a valid email address to get your query result',
                    size: 'sm'
                });
                evt.stopPropagation();
                evt.preventDefault();
                return;
            }

            var top    = this.craterTop.get('value');
            var left   = this.craterLeft.get('value');
            var right  = this.craterRight.get('value');
            var bottom = this.craterBottom.get('value');
            var imgData = this.imgData.get('value');
            var downsample = this.downsample.get('value');

            var self = this;

            self.craterTop.destroyRecursive();

            this.craterTop.destroyRecursive();
            this.craterLeft.destroyRecursive();
            this.craterRight.destroyRecursive();
            this.craterBottom.destroyRecursive();
            this.imgData.destroyRecursive();
            this.craterEmail.destroyRecursive();
            this.downsample.destroyRecursive();

            this.imgData.destroyRecursive();

            if(this.config.services.craterService !== "")
            {
                var url = this.config.services.craterService;
                url += '?ulat=' + top;
                url += '&ulon=' + left;
                url += '&llat=' + bottom;
                url += '&llon=' + right;
                url += '&email=' + emailAddr;
                url += '&imgList=' + imgData;
                url += '&dsample=' + downsample;

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
                            title: 'Crater',
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
                    title: 'Crater',
                    content: 'No craterService service available',
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
                title: 'Detect Crater',
                content: content,
                size: 'sm'
            });
        },

        cleanIt: function(self)
        {
            self.craterTop.destroyRecursive();
            self.craterLeft.destroyRecursive();
            self.craterRight.destroyRecursive();
            self.craterBottom.destroyRecursive();
            self.craterEmail.destroyRecursive();

            self.imgData.destroyRecursive();
            self.downsample.destroyRecursive();
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
            this.parent.email = this.craterEmail.get('value');
            this.parent.isEditing = true;
            var option = Edit.SCALE | Edit.MOVE;
            this.parent.editMarker(this.graphic, option);
            var self = this;
            this.cleanIt(self);
        },

        doRemove: function(evt)
        {
            //this.parent.removeMapGraphic(this.graphic);
            this.parent.email = this.craterEmail.get('value');
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
