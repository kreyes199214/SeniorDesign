define([
    "dojo/_base/declare",
    "dojox/charting/action2d/_IndicatorElement",
    "dojo/_base/lang",
    "dojo/aspect"
], function(declare, IndicatorElement, lang, aspect){
    return declare(IndicatorElement, {
    	plotId: null,

    	constructor: function(chart, kwArgs){
			this.inherited(arguments);
			this.plotId = kwArgs.inter.chart.node.id;
		},

    	render: function(){
    		this.inherited(arguments);

    		if(this.plotId.substring(0, 13) == "elevationPlot"){
    			this.renderElevationPlotLabel();
    		}
    		else if(this.plotId.substring(0, 12) == "sunAnglePlot"){
    			this.renderSunAnglePlotLabel();
    			}
    		},

		renderElevationPlotLabel: function(){
			var svgTexts = dojo.query("#" + this.plotId + " > svg > g:nth-child(8) > g > text");
			var svgRects = dojo.query("#" + this.plotId + " > svg > g:nth-child(8) > g > rect:nth-child(6)");
			var svgPlots = dojo.query("#" + this.plotId + " > svg > rect:nth-child(2)");

			if (svgTexts.length > 0 &&
				svgRects.length > 0 &&
				svgPlots.length > 0 ){

				svgPlot = svgPlots[0]; 
				svgText = svgTexts[0];
				svgRect = svgRects[0];

				//Create the tspans that represent new lines in svg
				var oldText = svgText.childNodes[0].data;
				var textXPosition = svgText.getAttribute("x");
				var textYPosition = svgText.getAttribute("y");

				if (oldText !== undefined){
					var svgns = "http://www.w3.org/2000/svg";


					var distanceText= document.createElementNS(svgns ,"tspan");
					distanceText.setAttribute('x', textXPosition);
					distanceText.textContent = "Distance From Start: " +  oldText.split("|")[0];

					var elevationText= document.createElementNS(svgns ,"tspan");
					elevationText.setAttribute('x', textXPosition);
					elevationText.setAttribute('dy', '1.2em');
					elevationText.textContent = "Delta Elevation: " + oldText.split("|")[1];

					//Remove any text that was already being displayed by the svg
					while (svgText.firstChild) {
						svgText.removeChild(svgText.firstChild);
					}

					//Set the new svg text to display
					svgText.appendChild(distanceText);
					svgText.appendChild(elevationText);


					//calculate and set height, width and x positions after changing the text.
					var textWidth =  svgText.getBBox().width;
					var textHeight = svgText.getBBox().height;

					svgRect.setAttribute("height", (textHeight + 3));
					svgRect.setAttribute("width", (textWidth + 3));

					var newRectX = (svgText.getAttribute("x") - (svgRect.getBBox().width / 2)); 
					
					svgRect.setAttribute("x", newRectX);

					var newRectLeftEdge = parseFloat(svgRect.getAttribute("x"), 10);
					var newRectRightEdge = parseFloat(svgRect.getAttribute("x"), 10) + (svgRect.getBBox().width);

					var svgPlotWidth = svgPlot.getAttribute("width");				

					//If the indicator text and box go out of bounds move the indicator back inside the plot.
					while(newRectLeftEdge < 0){
						newRectLeftEdge += 1;
						svgRect.setAttribute("x", (parseFloat(svgRect.getAttribute("x"), 10) + 1));
						svgText.setAttribute("x", (parseFloat(svgText.getAttribute("x"), 10) + 1));
						distanceText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) + 1));
						elevationText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) + 1));
					}
					while(newRectRightEdge > (svgPlotWidth - 3)){
						newRectRightEdge -= 1;
						svgRect.setAttribute("x", (parseFloat(svgRect.getAttribute("x"), 10) - 1));
						svgText.setAttribute("x", (parseFloat(svgText.getAttribute("x"), 10) - 1));
						distanceText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) - 1));
						elevationText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) - 1));
					}
				}
			}
		},

		renderSunAnglePlotLabel: function(){
			var svgTexts = dojo.query("#" + this.plotId + " > svg > g:nth-child(9) > g > text");
			var svgRects = dojo.query("#" + this.plotId + " > svg > g:nth-child(9) > g > rect:nth-child(6)");
			var svgPlots = dojo.query("#" + this.plotId + " > svg > rect:nth-child(2)");

			//The original size leaves a second gray square. This should be made transparent.
			var svgGraySquares = dojo.query("#" + this.plotId + " > svg > g:nth-child(9) > g > rect:nth-child(5)");

			if (svgTexts.length > 0 &&
				svgRects.length > 0 &&
				svgPlots.length > 0 &&
				svgGraySquares.length > 0){

				svgPlot = svgPlots[0]; 
				svgText = svgTexts[0];
				svgRect = svgRects[0];

				//Make the gray square transparent
				svgGraySquares[0].setAttribute("stroke-opacity", "0");


				//Create the tspans that represent new lines in svg
				var oldText = svgText.childNodes[0].data;
				var textXPosition = svgText.getAttribute("x");
				var textYPosition = svgText.getAttribute("y");

				if (oldText != undefined){
					var svgns = "http://www.w3.org/2000/svg";

					var azimuthText= document.createElementNS(svgns ,"tspan");
					azimuthText.setAttribute('x', textXPosition);
					azimuthText.textContent = "Azimuth: " +  oldText.split("|")[0];

					var elevationText= document.createElementNS(svgns ,"tspan");
					elevationText.setAttribute('x', textXPosition);
					elevationText.setAttribute('dy', '1.2em');
					elevationText.textContent = "Elevation: " + oldText.split("|")[1];

					var timeText= document.createElementNS(svgns ,"tspan");
					timeText.setAttribute('x', textXPosition);
					timeText.setAttribute('dy', '1.2em');
					timeText.textContent = "Time: " + oldText.split("|")[2].substring(0, oldText.split("|")[2].lastIndexOf("."));

					//Remove any text that was already being displayed by the svg
					while (svgText.firstChild) {
						svgText.removeChild(svgText.firstChild);
					}

					//Set the new svg text to display
					svgText.appendChild(azimuthText);
					svgText.appendChild(elevationText);
					svgText.appendChild(timeText);


					//calculate and set height, width and x positions after changing the text.
					var textWidth =  svgText.getBBox().width;
					var textHeight = svgText.getBBox().height;

					svgRect.setAttribute("height", (textHeight + 3));
					svgRect.setAttribute("width", (textWidth + 3));

					var newRectX = (svgText.getAttribute("x") - (svgRect.getBBox().width / 2)); 
					
					svgRect.setAttribute("x", newRectX);

					var newRectLeftEdge = parseFloat(svgRect.getAttribute("x"), 10);
					var newRectRightEdge = parseFloat(svgRect.getAttribute("x"), 10) + (svgRect.getBBox().width);

					var svgPlotWidth = svgPlot.getAttribute("width");				

					//If the indicator text and box go out of bounds move the indicator back inside the plot.
					while(newRectLeftEdge < 0){
						newRectLeftEdge += 1;
						svgRect.setAttribute("x", (parseFloat(svgRect.getAttribute("x"), 10) + 1));
						svgText.setAttribute("x", (parseFloat(svgText.getAttribute("x"), 10) + 1));
						azimuthText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) + 1));
						elevationText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) + 1));
						timeText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) + 1));
					}
					while(newRectRightEdge > (svgPlotWidth - 3)){
						newRectRightEdge -= 1;
						svgRect.setAttribute("x", (parseFloat(svgRect.getAttribute("x"), 10) - 1));
						svgText.setAttribute("x", (parseFloat(svgText.getAttribute("x"), 10) - 1));
						azimuthText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) - 1));
						elevationText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) - 1));
						timeText.setAttribute('x', (parseFloat(svgText.getAttribute("x"), 10) - 1));
					}
				}
			}
		}


    });
});