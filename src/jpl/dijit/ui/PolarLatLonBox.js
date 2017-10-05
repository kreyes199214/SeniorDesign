define([
    "dojo/_base/declare",
    "dojo/_base/lang",

    "esri/geometry/Point",
    "esri/geometry/webMercatorUtils"
], function (declare, lang, Point, webMercatorUtils) {
    return declare(null, {
      urp: null,
      llp: null,
      isNorth: null,
      rings: null,
      eqExtent: {},

      constructor: function (urp, llp, isNorth) 
      {
        this.urp = urp;
        this.llp = llp;
        this.isNorth = isNorth;
      },
      
      postCreate: function () 
      {
      },

      startup: function()
      {
        this.convertLatLonBoxToPolar(this.urp, this.llp, this.isNorth);
      },

      convertLatLonBoxToPolar: function(startPoint, endPoint, isNorth) //return Array
      {
        var latLonArray = new Array();
        var outputarray = new Array();
      
        var point2 = new Point(startPoint.x, endPoint.y);
        var point4 = new Point(endPoint.x, startPoint.y);

        var southbc = 0;
        var northbc = 0;
        var eastbc = 0;
        var westbc = 0;

        if (isNorth)
        {
          if (((startPoint.x < 0 && endPoint.x > 0) || (endPoint.x < 0 && startPoint.x > 0)) && startPoint.y > 0)
          {
            var pn1;
            var pn2;
      
            var zeroPoint;
            zeroPoint = new Point(0, 0);
      
            if (endPoint.y > 0)
            {
              var distanceA = this.estimateDistances(zeroPoint, point4);
              var distanceB = this.estimateDistances(zeroPoint, startPoint);
      
              pn1 = new Point(0, endPoint.y);
              pn2 = new Point(0, Math.max(distanceA, distanceB));
            }
            else
            {
              var distance1 = this.estimateDistances(zeroPoint, startPoint);
              var distance2 = this.estimateDistances(zeroPoint, point2);
              var distance3 = this.estimateDistances(zeroPoint, endPoint);
              var distance4 = this.estimateDistances(zeroPoint, point4);
      
              pn1 = new Point(0, 0);
              pn2 = new Point(0, Math.max(distance1, distance2, distance3, distance4));
            }
      
            var nPoint1;
            var nPoint2;
            nPoint1 = this.transNorthPolarMetersToLatLon(pn1);
            nPoint2 = this.transNorthPolarMetersToLatLon(pn2);
      
            isNorthbc = Math.max(nPoint1.y, nPoint2.y);
            southbc = Math.min(nPoint1.y, nPoint2.y);
            eastbc = 179.9999;
            westbc = -179.9999;
      
            var widthbc = eastbc - westbc;
            latLonArray.push(new Point(westbc, isNorthbc));
      
            for (var i = 1; i < widthbc; i++)
            {
              latLonArray.push(new Point(westbc + i, isNorthbc));
            }
      
            latLonArray.push(new Point(eastbc, isNorthbc));
            latLonArray.push(new Point(eastbc, southbc));
      
            for (var j = 1; j < widthbc; j++)
            {
              latLonArray.push(new Point(eastbc - j, southbc));
            }
            latLonArray.push(new Point(westbc, southbc));
          }
          else
          {
            var nnPoint1;
            var nnPoint2;
            var nnPoint3;
            var nnPoint4;
      
            nnPoint1 = this.transNorthPolarMetersToLatLon(startPoint);
            nnPoint2 = this.transNorthPolarMetersToLatLon(point2);
            nnPoint3 = this.transNorthPolarMetersToLatLon(endPoint);
            nnPoint4 = this.transNorthPolarMetersToLatLon(point4);
      
            northbc = Math.max(nnPoint1.y, nnPoint2.y, nnPoint3.y, nnPoint4.y);
            southbc = Math.min(nnPoint1.y, nnPoint2.y, nnPoint3.y, nnPoint4.y);
            eastbc = Math.max(nnPoint1.x, nnPoint2.x, nnPoint3.x, nnPoint4.x);
            westbc = Math.min(nnPoint1.x, nnPoint2.x, nnPoint3.x, nnPoint4.x);
      
            var nwidthbc = eastbc - westbc;
            latLonArray.push(new Point(westbc, northbc));
            for (var ni = 1; ni < nwidthbc; ni++)
            {
              latLonArray.push(new Point(westbc + ni, northbc));
            }
      
            latLonArray.push(new Point(eastbc, northbc));
            latLonArray.push(new Point(eastbc, southbc));
            for (var nj = 1; nj < nwidthbc; nj++)
            {
              latLonArray.push(new Point(eastbc - nj, southbc));
            }
            latLonArray.push(new Point(westbc, southbc));
          }
        }
        else  //south
        {
          if (((startPoint.x < 0 && endPoint.x > 0) || (endPoint.x < 0 && startPoint.x > 0)) && endPoint.y < 0)
          {
            var pn1;
            var pn2;
      
            var zeroPoint = new Point(0, 0, spatialReference);
      
            if (startPoint.y < 0)
            {
              var distanceA = estimateDistances(zeroPoint, point2);
              var distanceB = estimateDistances(zeroPoint, endPoint);
      
              pn1 = new Point(0, startPoint.y);
              pn2 = new Point(0, Math.max(distanceA, distanceB));
            }
            else
            {
              var distance1 = estimateDistances(zeroPoint, startPoint);
              var distance2 = estimateDistances(zeroPoint, point2);
              var distance3 = estimateDistances(zeroPoint, endPoint);
              var distance4 = estimateDistances(zeroPoint, point4);
      
              pn1 = new Point(0, 0);
              pn2 = new Point(0, Math.max(distance1, distance2, distance3, distance4));
            }
      
            var sPoint1;
            var sPoint2;
            sPoint1 = transSouthSolarMetersToLatLon(pn1);
            sPoint2 = transSouthSolarMetersToLatLon(pn2);
      
            isNorthbc = Math.max(sPoint1.y, sPoint2.y);
            southbc = Math.min(sPoint1.y, sPoint2.y);
            eastbc = 179.9999;
            westbc = -179.9999
      
            var swidthbc = eastbc - westbc;
            latLonArray.push(new Point(westbc, isNorthbc));
            for (var i = 1; i < swidthbc; i++)
            {
              latLonArray.push(new Point(westbc + i, isNorthbc));
            }
            latLonArray.push(new Point(eastbc, isNorthbc));
            latLonArray.push(new Point(eastbc, southbc));
            for (var j = 1; j < swidthbc; j++)
            {
              latLonArray.push(new Point(eastbc - j, southbc));
            }
            latLonArray.push(new Point(westbc, southbc));
          }
          else
          {
            var nPoint1;
            var nPoint2;
            var nPoint3;
            var nPoint4;
      
            nPoint1 = transSouthSolarMetersToLatLon(startPoint);
            nPoint2 = transSouthSolarMetersToLatLon(point2);
            nPoint3 = transSouthSolarMetersToLatLon(endPoint);
            nPoint4 = transSouthSolarMetersToLatLon(point4);
      
            isNorthbc = Math.max(nPoint1.y, nPoint2.y, nPoint3.y, nPoint4.y);
            southbc = Math.min(nPoint1.y, nPoint2.y, nPoint3.y, nPoint4.y);
            eastbc = Math.max(nPoint1.x, nPoint2.x, nPoint3.x, nPoint4.x);
            westbc = Math.min(nPoint1.x, nPoint2.x, nPoint3.x, nPoint4.x);
      
            var widthbc = eastbc - westbc;
            latLonArray.push(new Point(westbc, isNorthbc));
            for (var i = 1; i < widthbc; i++)
            {
              latLonArray.push(new Point(westbc + i, isNorthbc));
            }
            latLonArray.push(new Point(eastbc, isNorthbc));
            latLonArray.push(new Point(eastbc, southbc));
      
            for (var j = 1; j < widthbc; j++)
            {
              latLonArray.push(new Point(eastbc - j, southbc));
            }
            latLonArray.push(new Point(westbc, southbc));
          }
        }
      
        for (var i=0; i<latLonArray.length;  i++)
        {
          var point = latLonArray[i];
          if (isNorth)
          {
            outputarray.push(this.transLatLonToNorthPolarMeters(point));
          }
          else
          {
            outputarray.push(this.transLatLonToSouthPolarMeters(point));
          }
        }

        //add the first point to close the polygon
        var point = latLonArray[0];
        if (isNorth)
        {
          outputarray.push(this.transLatLonToNorthPolarMeters(point));
        }
        else
        {
          outputarray.push(this.transLatLonToSouthPolarMeters(point));
        }

        this.eqExtent.southbc = southbc;
        this.eqExtent.northbc = northbc;
        this.eqExtent.eastbc = eastbc;
        this.eqExtent.westbc = westbc;

        this.rings = new Array(outputarray);
      },
      
      transLatLonToNorthPolarMeters: function(point, radiusKm)
      {
        if (radiusKm == undefined)
          radiusKm=1737.1;
      
        var rad = radiusKm*1000;
        var f = point.x * Math.PI/180;
        var c = point.y * Math.PI/180;
      
        var x = (2*rad* Math.tan(Math.PI/4 - c/2)*Math.sin(f));
        var y = (-2*rad*Math.tan(Math.PI/4-c/2)*Math.cos(f));
      
        var outPoint = new Point(x, y);
        return outPoint;
      },
      
      transLatLonToSouthPolarMeters: function(point, radiusKm)
      {
        if (radiusKm == undefined)
          radiusKm=1737.1;

        var rad = radiusKm*1000;
        var f = point.x * Math.PI/180;
        var c = point.y * Math.PI/180;
      
        var outPoint = new Point();
        outPoint.x = 2*rad*Math.tan(Math.PI/4+c/2)*Math.sin(f);
        outPoint.y= 2*rad*Math.tan(Math.PI/4+c/2)*Math.cos(f);
        return outPoint;
      },
      
      transNorthPolarMetersToLatLon: function(pt, r_km) //pt: Point
      {
        if (r_km == undefined)
          r_km=1737.1;

        var rad = r_km*1000; // convert to meters 
        var clat = 90;
        var j = Math.atan2(pt.x,-pt.y); 
      
        var k = clat*(Math.PI/180); 
        var b = Math.sqrt(Math.pow(pt.x,2)+Math.pow(pt.y,2)); 
        var h = 2*Math.atan(b/(2*rad)); 
        var d = Math.asin(Math.cos(h)*Math.sin(k)); 
        var lat = d*180/Math.PI; 
        var lon = j*180/Math.PI; 
         
        //Only if you want a 0 to 360 system instead of -180 to 180 
        //if(lon<0){ 
        //    lon=lon+360; 
        //} 
      
        var outputPoint = new Point();
        outputPoint.x=lon; 
        outputPoint.y=lat; 
        return outputPoint; 
      },
      
      transSouthSolarMetersToLatLon: function(pt, r_km)  //pt: Point
      {

        if (r_km == undefined)
          r_km=1737.1;
        var rad = r_km*1000; // convert to meters 
        var clat = -90;
        var j = Math.atan2(pt.x,pt.y); 
      
        var k = clat*(Math.PI/180); 
        var b = Math.sqrt(Math.pow(pt.x,2)+Math.pow(pt.y,2)); 
        var h = 2*Math.atan(b/(2*rad)); 
        var d = Math.asin(Math.cos(h)*Math.sin(k)); 
        var lat = d*180/Math.PI;
        var lon = j*180/Math.PI;
         
        //Only if you want a 0 to 360 system instead of -180 to 180 
        //if(lon<0){ 
        //    lon=lon+360; 
        //} 
      
        var outputPoint = new Point();
        outputPoint.x=lon; 
        outputPoint.y=lat; 
        return outputPoint; 
      },

      estimateDistances: function(start, end)
      {
        var a;
      
        var lowY = Math.min(start.y, end.y);
        var highY = Math.max(start.y, end.y);
        var lowX = Math.min(start.x, end.x);
        var highX = Math.max(start.x, end.x);
     
        var dy = highY - lowY;
        var dx = highX - lowX;
      
        var dtwo = Math.pow(dy, 2) + Math.pow(dx, 2);
        var d = Math.sqrt(dtwo);
        return d;
      }

    });
});

