//////////////////////////////////////
//MapLinkValidator class
//////////////////////////////////////

define(["dojo/_base/declare"], function(declare){
	return declare(null, {
		projections: ["equirectangular","north_pole","south_pole"],
		validations: {
			validCenterPoint: false,
			validProjection: false,
			validZoomLevel: false,
			validLayers: false,
			validVisibility: false,
			validTransparency: false
		},
		
		constructor: function(args) {
		},
		
		validateMapURLData: function(urlData) {
			var validationResult = this.validations;
			validationResult.validCenterPoint = this.validateMapPoint(urlData);
			validationResult.validProjection = this.validateProjection(urlData);
			validationResult.validZoomLevel = this.validateZoomLevel(urlData);
			validationResult.validLayers = this.validateLayers(urlData);
			validationResult.validVisibility = this.validateVisibility(urlData);
			validationResult.validTransparency = this.validateTransparency(urlData);
			
			return validationResult;
		},
		
		validateProjection: function(urlData) {
			var result = false;
			
			if (urlData.hasOwnProperty("projection")) {
				if(urlData.projection == "equirectangular" ||
					urlData.projection == "north_pole" ||
					urlData.projection == "south_pole") {
						result = true;
				}
			}
			
			return result;
		},
		
		validateMapPoint: function(urlData) {
			var result = false;
			
			//x,y,projection properties must exist
			if (urlData.hasOwnProperty("x") &&
				urlData.hasOwnProperty("y") &&
				urlData.hasOwnProperty("projection")) 
			{
				switch(urlData.projection) {
					case "equirectangular":
						if (urlData.x <= 180 && urlData.x >= -180 && urlData.y <= 90 && urlData.y >= -90)
							result = true;
						break;
					case "north_pole": 
						if (urlData.x <= 970180 && urlData.x >= -970180 && urlData.y <= 970180 && urlData.y >= -970180)
							result = true;
						break;
					case "south_pole":
						if (urlData.x <= 970180 && urlData.x >= -970180 && urlData.y <= 970180 && urlData.y >= -970180)
							result = true;
						break;
					default:
						//not a valid projection
						break;
				}
			}
			
			return result;
		},
		
		validateZoomLevel: function(urlData) {
			var result = false;
			
			//level property must exist
			if (urlData.hasOwnProperty("level")) {
				if(urlData.level >= 0 && urlData.level <= 8) {
					result = true;
				}
			}
			
			return result;
		},
		
		validateBasemap: function(urlData) {
			
		},
		
		validateLayers: function(urlData) {
			var result = false;
			if(urlData.hasOwnProperty("layers")){
				if(urlData.layers != undefined 
					&& urlData.layers != null){
					result = true;		
				}
			}
			
			return result;
		},
		
		validateVisibility: function(urlData) {
			var result = false;
			if(urlData.hasOwnProperty("visibility")){
				if(urlData.visibility != undefined 
					&& urlData.visibility != null){
					result = true;		
				}
			}
			
			return result;
		},
		
		validateTransparency: function(urlData) {
			var result = false;
			if(urlData.hasOwnProperty("transparency")){
				if(urlData.transparency != undefined 
					&& urlData.transparency != null){
					result = true;		
				}
			}
			
			return result;
		}
	});
});