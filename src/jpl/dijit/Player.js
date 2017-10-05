define([
    "dijit/form/Button",
    "dojo/domReady!",
    'dojo/dom',
    'dijit/registry',
    'dijit/dijit'
], function(Button, dom, registry, dijit){

var pdesc = [];
var ptitle = [];
var curr = 0;
var nSlides;

function getRequestHttp()
{
  var http_request = new XMLHttpRequest();
  try
  {
    http_request = new XMLHttpRequest();
  }
  catch (e)
  {
    try
    {
      http_request = new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (e)
    {
      try
      {
        http_request = new ActiveXObject("Microsoft.XMLHTTP");
      }
      catch (e)
      {
        alert("Your browser broke!");
        return null;
      }
    }
  }
  
  return http_request;
}

function slideInit(jsonfile, parent)
{
  addSlideShowTop(parent);
  loadJSON(parent, jsonfile);
}

function loadJSON(parent, data_file)
{
  var http_request = getRequestHttp();
      
  http_request.onreadystatechange = function()
  {
    if (http_request.readyState == 4  )
    {
      var obj = JSON.parse(http_request.responseText);

      var title = obj.SLIDESHOWTITLE;
      var len   = obj.PLIST.length;
  
      pdesc  = [];
      ptitle = [];
      curr   = 0;
      panes  = [];
      nSlides = len;
      for (var i = 0; i < len; i++) 
      {
        var t = obj.PLIST[i];
        var iname   = t.INAME;
        var id  = t.ID;
        var sltitle = t.TITLE;
        var desc= t.DESCRIPTION;
  
        var html = '<table width=300 height=300 border=0 cellpadding=0 cellspacing=0><tr><td align="left" valign="middle"><img src="' + iname + '" style="width:auto; height:auto; max-width:300px; max-height:300px;" /></td></tr></table>';

        var pane = { className: "pane", innerHTML: html };  
        panes.push(pane);
        pdesc.push(desc);
        ptitle.push(sltitle);
      }

      document.getElementById("title").innerHTML = title;
    
      document.getElementById("sltitle").innerHTML = ptitle[curr];
      document.getElementById("sldesc").innerHTML  = pdesc[curr];

      var myRotator2 = new dojox.widget.AutoRotator(
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

      new dojox.widget.rotator.Controller(
      {     
        rotator: myRotator2, 
        commands: 'play/pause, info'
        },
        dojo.byId("pauseb")
      );

      new dojox.widget.rotator.Controller(
      { 
        rotator: myRotator2,
        commands: 'info'
        },
        dojo.byId("dotdiv")
      );

    }
  }
      
  http_request.open("GET", data_file, true);
  http_request.send();
}

function doPrev()
{
  dojo.publish('myAutoRotator2/rotator/control', ['prev']);

  if (curr == 0)
    curr = nSlides-1;
  else
    curr--

  var descdiv = document.getElementById('sldesc');
  descdiv.innerHTML = pdesc[curr]; 
  var titlediv = document.getElementById('sltitle');
  titlediv.innerHTML = ptitle[curr]; 
}

function doNext()
{
  dojo.publish('myAutoRotator2/rotator/control', ['next']);

  if (curr < (nSlides-1))
    curr++;
  else
    curr = 0;

  var titlediv = document.getElementById('sltitle');
  titlediv.innerHTML = ptitle[curr]; 
  var descdiv = document.getElementById('sldesc');
  descdiv.innerHTML = pdesc[curr]; 
}

function addSlideShowTop(parent)
{
  var parentdiv = document.getElementById(parent);
  while ( parentdiv.firstChild ) parentdiv.removeChild( parentdiv.firstChild );
  parentdiv.innerHTML = "";
  //var parentdiv = document.getElementById(parent);
  //parentdiv.style.visibility = "visible";

  //slide
  var slide = document.createElement("div");
  slide.setAttribute('class', 'topcontainer');
  slide.style.border = '1px solid #73AD21';
  slide.style.position = 'relative';
  parentdiv.appendChild(slide);

  //title
  var s = '<label id="title" class="toptitle"></label>';
  titlediv = document.createElement("div");
  titlediv.setAttribute('class', 'tcontainer');
  titlediv.innerHTML = s;
  slide.appendChild(titlediv);

  //panes
  var panes = document.createElement("div");
  panes.setAttribute('class', 'container');
  slide.appendChild(panes);

  html = '<a href="javascript:void(0)"><img id="lefticon" src="http://mars.nasa.gov/layout/slideshows/img/back.png" style="width:25px; height=25px; opacity: 0.7"></a>';
  var l = document.createElement("div");
  l.id = "prevb";
  l.setAttribute('class', 'lnob');
  l.innerHTML = html;
  slide.appendChild(l);

  html = "<div class=\"rotator\" id=\"myAutoRotator2\"></div>";
  var m = document.createElement("div");
  m.setAttribute('class', 'rotatorContainer');
  m.innerHTML = html;
  panes.appendChild(m);

  var lefticon = dojo.byId("lefticon");
  dojo.connect(lefticon, 'onclick', doPrev);
  dojo.connect(lefticon, 'onmouseover', imouseOver);
  dojo.connect(lefticon, 'onmouseout', imouseOut);

  //controller container
  var controller = document.createElement("div");
  controller.setAttribute('class', 'container');
  slide.appendChild(controller);

  html = '<a href="javascript:void(0)"><img id="righticon" src="http://mars.nasa.gov/layout/slideshows/img/forward.png" style="width:25px; height=25px; opacity: 0.7"></a>';
  var r = document.createElement("div");
  r.id = "prevb";
  r.setAttribute('class', 'rnob');
  r.innerHTML = html;
  panes.appendChild(r);

  var righticon = dojo.byId("righticon");
  dojo.connect(righticon, 'onclick', doNext);
  dojo.connect(righticon, 'onmouseover', imouseOver);
  dojo.connect(righticon, 'onmouseout', imouseOut);

  ///////////////////
  var ctrl = document.createElement("div");
  ctrl.id = "ctrl";
  ctrl.setAttribute('class', 'container');
  controller.appendChild(ctrl);

  var p = document.createElement("div");
  p.id = "pauseb";
  p.setAttribute('class', 'stopstart');
  ctrl.appendChild(p);

  //var pause = dojo.byId("pauseb");
  //dojo.connect(lefticon, 'onclick', doStopStart);

  var d = document.createElement("div");
  d.id = "dotdiv";
  d.setAttribute('class', 'dots');
  ctrl.appendChild(d);

  //title
  s = '<label id="sltitle" class="sltitle"></label>';
  tt = document.createElement("div");
  tt.setAttribute('class', 'bcontainer');
  tt.innerHTML = s;
  slide.appendChild(tt);

  //desc
  s = '<label id="sldesc" class="sldesc"></label>';
  tt = document.createElement("div");
  tt.setAttribute('class', 'bcontainer');
  //tt.id = "desc";
  tt.innerHTML = s;
  slide.appendChild(tt);
}

function imouseOver(e)
{
  var o = e.target;
  o.style.opacity = 1.0;
}
 

function imouseOut(e)
{
  var o = e.target;
  o.style.opacity = 0.7;
}
 
return {

  addSlideshow: function(jsonfile, parent)
  {
    slideInit(jsonfile, parent);
  },

  addSlideshow2: function(e)
  {
    var parm = e.target.value;
    var vals = parm.split(";");
    var parent = vals[0];
    var jsonfile = vals[1];
    jsonfile = "http://ourocean3.jpl.nasa.gov/mytrek/JSON/" + jsonfile;
    slideInit(jsonfile, parent);
  }

};
});

