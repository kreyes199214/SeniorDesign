define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/form/Button",
  "dojox/gesture/swipe",
  "dojo/dom",
  "dojo/on",
  "dojo/query",
  "dijit/registry",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dojo/text!../templates/SlideShowPlayer.html",
  "dijit/dijit",
  "dojox/widget/AutoRotator",
  "dojox/widget/rotator/Controller",
  "dojox/widget/rotator/Pan",
  "dojo/dom-construct",
  "jpl/dijit/ui/SlideShowModalDialog",
  "dojo/window",
  "dojo/domReady!",
  "xstyle/css!../css/SlideShowPlayer.css"
  ],
    function(declare, lang, Button, swipe, dom, on, query, registry,  _WidgetBase, _TemplatedMixin,template, dijit, AutoRotator, Controller, Pan, domConst, SlideShowModalDialog, window){
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,

        panes : [],
        pdesc : [],
        ptitle : [],
        jfile : '',
        pw : 0,
        ph : 0,
        viewerHTMLID : "",

        setViewerHTMLID: function(val) {
            this.viewerHTMLID = val;
        },

        constructor: function(jsonfile, h)
        {
          this.jfile = jsonfile;
          this.ph = h;
          console.log('constructor::  = this.jfile' + this.jfile);
          console.log(this.jfile);
          console.log('constructor:: this.ph = ' + this.ph);

          var win = require("dojo/_base/window")
          on(win.global, "resize", lang.hitch(this, this.resize));
        },

        startup: function()
        {
          console.log('startup');
          this.resize();
          var len = this.jfile.PLIST.length;

          pdesc  = [];
          ptitle = [];
          panes  = [];
          iname  = [];
          miname = [];
          for (var i = 0; i < len; i++)
          {
            var t = this.jfile.PLIST[i];
            var iname   = t.INAME;
            var miname  = t.M_INAME;
            var id      = t.ID;
            var sltitle = t.TITLE + '<br><br>';
            var desc= t.DESCRIPTION;

            pdesc.push(desc);
            ptitle.push(sltitle);

            var html = '<img src="' + iname + '" style="height: 100%; width: 100%; object-fit: cover" />';
            var pane = { className: "slideshow pane", innerHTML: html };
            panes.push(pane);
          }

          var lefticon = dojo.byId("lefticon");
          dojo.connect(lefticon, 'onmouseover', this.lmouseOver);
          dojo.connect(lefticon, 'onmouseout', this.lmouseOut);

          var righticon = dojo.byId("righticon");
          dojo.connect(righticon, 'onmouseover', this.rmouseOver);
          dojo.connect(righticon, 'onmouseout', this.rmouseOut);

          var scicon = dojo.byId("fscreen");
          dojo.connect(scicon, 'onclick', this, "goFullScreen");

          var micon = dojo.byId("iscreen");
          dojo.connect(micon, 'onmouseover', this.imouseOver);
          dojo.connect(micon, 'onmouseout', this.imouseOut);

          //Touch Listener
          var self = this;
          on(dojo.byId("myAutoRotator2"), swipe.end, function(e){
            if(e.dx < 0){
              self.doNext();
            }else{
              self.doPrev();
            }
          });

          var myRotator2 = new AutoRotator(
          {
            transition: "dojox.widget.rotator.pan",
            duration: 2500,
            pauseOnManualChange: true,
            suspendOnHover: true,
            autoStart: false,
            panes: panes
            },
            dojo.byId("myAutoRotator2")
          );

          dojo.subscribe("myAutoRotator2/rotator/update", function(type, rotator, params)
          {
            console.log('type = ' + type);
            if (type == 'prev' || type == 'next' || type == 'play')
            {
              var titlediv = document.getElementById('sltitle');
              titlediv.innerHTML = ptitle[rotator.idx];
              var descdiv = document.getElementById('sldesc');
              descdiv.innerHTML = pdesc[rotator.idx];
            }
          });

          new Controller(
          {
            rotator: myRotator2,
            commands: 'play/pause, info'
            },
            dojo.byId("pauseb")
          );

          new Controller(
          {
            rotator: myRotator2,
            commands: 'info'
            },
            dojo.byId("dotdiv")
          );

          document.getElementById("sltitle").innerHTML = ptitle[0];
          document.getElementById("sldesc").innerHTML  = pdesc[0];
        },

        imouseOver: function(e)
        {
          console.log('imouseOver::');
          var o = e.target;
          o.style.opacity = 1.0;
        },

        imouseOut:function(e)
        {
          console.log('imouseOit::');
          var o = e.target;
          o.style.opacity = 0.7;
        },

        lmouseOver: function(e)
        {
          console.log('lmouseOver::');
          var o = e.target;
          o.src = 'jpl/assets/images/slideshows/Left_gold.png';
        },

        lmouseOut:function(e)
        {
          console.log('lmouseOit::');
          var o = e.target;
          o.src = 'jpl/assets/images/slideshows/Left_navy.png';
        },

        rmouseOver: function(e)
        {
          console.log('rmouseOver::');
          var o = e.target;
          o.src = 'jpl/assets/images/slideshows/Right_gold.png';
        },

        rmouseOut:function(e)
        {
          console.log('rmouseOit::');
          var o = e.target;
          o.src = 'jpl/assets/images/slideshows/Right_navy.png';
        },

        mclose:function(e)
        {
          var mdiv = document.getElementById('openModal');
          mdiv.style.innerHTML = '';
          mdiv.style.visibility = "hidden";
        },

        resize: function()
        {
          console.log('SlideShowPlayer::resize()');

          var w = dojo.position(dojo.query(".menu.push-menu-search")[0]).w;
          console.log('constructor:: w = ' + w);
          this.pw = w - 20; //spacing
        
          console.log('resize:: this.pw = ' + this.pw);
          console.log('resize:: this.ph = ' + this.ph);

          //domConst.place(this.sltop, "slholder");

          //ORIGINAL WORKING ONE
          //domConst.place(this.sltop, "slholder", "replace");

            domConst.empty("slholder");
            domConst.place(this.sltop, "slholder", "first");

            /*
            var slHolder = query("#slholder");
            if(slHolder){
                if(slHolder.length > 0){
                    console.log("slHOldr", slHolder);
                    slHolder[0].empty();
                    domConst.place(this.sltop, "slholder", "first");
                }
            }
            */


/*
          //var node = domConst.toDom('<div style="border: solid red 3px"></div>');
          var node = domConst.toDom('<div></div>');
          domConst.place(node, "slholder", "after");

          //domConst.place(this.sltop, node);
          domConst.place(this.sltop, node);
*/
          
          this.paneContainer.style.width  = this.pw + 'px';
          this.paneContainer.style.height = this.ph + 'px';

          //this.sltop.style.width  = this.pw + 'px';
          //this.sltop.style.height = this.ph + 'px';

          this.myAutoRotator2.style.height = this.ph + 'this.px';

          this.ctrl.style.width  = (this.pw) + 'px';

          //this.lnobdiv.style.top = Math.floor(this.ph/2-10) + 'px';
          //this.lefticon.style.top = Math.floor(this.ph/2-10) + 'px';

          //this.rnobdiv.style.top  = Math.floor(this.ph/2-10) + 'px';
          //this.righticon.style.top  = Math.floor(this.ph/2-10) + 'px';
          //this.rnobdiv.style.left = (this.pw-35) + 'px';
        },

        goFullScreen: function(e)
        {
          var mdial = new SlideShowModalDialog(this.jfile).startup();
        }

      });
});
