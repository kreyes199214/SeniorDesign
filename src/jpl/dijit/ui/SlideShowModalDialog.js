/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/SlideShowModelDialog
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/query",
    "bootstrap/Modal",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!../templates/SlideShowModalDialog.html",
    "dijit/registry",
    "dijit/dijit",
    "dojox/widget/rotator/Controller",
    "dojox/widget/rotator/Pan",
    "dojox/widget/AutoRotator",
    "dojo/domReady!",
    "xstyle/css!./../css/SlideShowModalDialog.css",
    "dojo/NodeList-dom"
], function (declare, lang, on, domStyle, topic, query, Modal, _WidgetBase, _TemplatedMixin, template, registry, dijit, Controller, Pan, AutoRotator) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        title: "",
        panes: [],
        titles: [],
        descs: [],
        plist: "",
        data_file: null,
        ptitle: "",
        pdesc: "",

        constructor: function (data_file) {
          this.data_file = data_file;
          this.title = data_file.SLIDESHOWTITLE;
          var t = data_file.PLIST[0];
          this.ptitle = t.TITLE;
          this.pdesc  = t.DESCRIPTION;
        },

        postCreate: function () {
          this.panes = [];
          this.titles = [];
          this.descs = [];
          var self = this;
        },

        goPrev: function (evt) {
          console.log('goPrev::');
          dojo.publish('mslideshowAutoRotator/rotator/control', ['prev']);
        },

        goNext: function (evt) {
          console.log('goNext::');
          dojo.publish('mslideshowAutoRotator/rotator/control', ['next']);
        },

        mlmouseOver: function(evt)
        {
          console.log('mlmouseOver::');
          var o = evt.target;
          o.src = 'jpl/assets/images/slideshows/Left_gold.png';
        },

        mlmouseOut: function(evt)
        {
          console.log('mlmouseOit::');
          var o = evt.target;
          o.src = 'jpl/assets/images/slideshows/Left_navy.png';
        },

        mrmouseOver: function(evt)
        {
          console.log('mrmouseOver::');
          var o = evt.target;
          o.src = 'jpl/assets/images/slideshows/Right_gold.png';
        },

        mrmouseOut: function(evt)
        {
          console.log('mrmouseOit::');
          var o = evt.target;
          o.src = 'jpl/assets/images/slideshows/Right_navy.png';
        },

        startup: function () {
          var self = this;
          on(this.slideShowModal, 'shown.bs.modal', function () {
            self.title = self.data_file.SLIDESHOWTITLE;
            var len = self.data_file.PLIST.length;

            for (var i = 0; i < len; i++)
            {
              var t = self.data_file.PLIST[i];

              var miname  = t.M_INAME;
              var id      = t.ID;
              var sltitle = t.TITLE + '<br><br>';
              var desc    = t.DESCRIPTION;

              self.titles.push(sltitle);
              self.descs.push(desc);

              var html = '<img class="slideshow mimage" src="' + miname + '" />';
              var pane = { className: "mpane", innerHTML: html };
              self.panes.push(pane);
            }

            var rotator = query(self.mslideshowAutoRotator)[0];
            var mslRotator = new AutoRotator(
            {
              transition: "dojox.widget.rotator.pan",
              duration: 2500,
              pauseOnManualChange: true,
              suspendOnHover: true,
              autoStart: true,
              panes: self.panes
              },
              rotator
            );

            dojo.subscribe("mslideshowAutoRotator/rotator/update", self, function(type, rotator, params)
            {
              if (type == 'prev' || type == 'next' || type == 'play')
              {
                var titlediv = query(self.msltitle)[0];
                titlediv.innerHTML = self.titles[rotator.idx];
                var descdiv = query(self.msldesc)[0];
                descdiv.innerHTML = self.descs[rotator.idx];
              }
            });

            var obj = query(self.mpauseb)[0];
            new Controller(
            {
              rotator: mslRotator,
              commands: 'play/pause, info'
              },
              obj
            );

            obj = query(self.mdotdiv)[0];
            new Controller(
            {
              rotator: mslRotator,
              commands: 'info'
              },
              obj
            );
          });

/*
          var lefticon = dojo.byId("mefticon");
          dojo.connect(lefticon, 'onmouseover', this.mlmouseOver);
          dojo.connect(lefticon, 'onmouseout', this.mlmouseOut);

          var righticon = dojo.byId("mighticon");
          dojo.connect(righticon, 'onmouseover', this.mrmouseOver);
          dojo.connect(righticon, 'onmouseout', this.mrmouseOut);
*/

          query(this.slideShowModal).modal();
        }

    });
});
