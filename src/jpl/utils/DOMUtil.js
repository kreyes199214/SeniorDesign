
define([
    "dojo/_base/declare",
    "dojo/query",
    "dojo/dom-style",
    "dojo/NodeList-manipulate"
], function(declare, query, domStyle) {
    return declare(null, {
        responsiveBreakpoints: {
            "XS": "xs",
            "SM": "sm",
            "MD": "md",
            "LG": "lg"
        },

        constructor: function(args) {
            //init
        },

        removeEmptyTextNodes: function(node) {
            for(var n = 0; n< node.childNodes.length; n++) {
                var child = node.childNodes[n];
                if(child.nodeType === 8 || (child.nodeType === 3 && !/\S/.test(child.nodeValue))) {
                    node.removeChild(child);
                    n--;
                } else if(child.nodeType === 1) {
                    this.removeEmptyTextNodes(child);
                }
            }

            return node;
        },

        roundToFixed: function(value, places, rounding) {
            rounding = rounding || "round";
            var num = parseFloat(value),
                multiplier = Math.pow(10, places);

            return(Number(Math[rounding](num * multiplier) / multiplier));
        },

        isResponsiveBreakpoint: function(size) {
            return domStyle.get(query('.device-' + size)[0], "display") === "block";
        },

        toggleFullScreen: function(document){
            if (!document.fullscreenElement &&
                !document.mozFullScreenElement &&
                !document.webkitFullscreenElement &&
                !document.msFullscreenElement ) {
                    var element = document.getElementsByTagName("body")[0];
                    if(element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if(element.mozRequestFullScreen) {
                        element.mozRequestFullScreen();
                    } else if(element.webkitRequestFullscreen) {
                        element.webkitRequestFullscreen();
                    } else if(element.msRequestFullscreen) {
                        element.msRequestFullscreen();
                    }
            } else {
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen();
                }
            }
        },

        applyTheme: function(theme) {
            var href = "";

            switch(theme) {
                case "outreach":
                    href = "app/themes/outreach.css"
                    break;
                default:
                    break;
            }

            if(href) {
                //apply the stylesheet to the end of the body to override any injected css to the head later
                query("body").append('<link rel="stylesheet" type="text/css" href="' + href + '">');

                //need to refactor this
                /*
                query("body").append('<script type="text/javascript" src="jpl/plugins/slideshow/js/jquery.easing.min.js"></script>' +
                    '<script type="text/javascript" src="jpl/plugins/slideshow/js/supersized.3.2.7.min.js"></script>' +
                    '<script type="text/javascript" src="jpl/plugins/slideshow/js/supersized.shutter.min.js"></script>' +
                    '<script type="text/javascript" src="jpl/plugins/slideshow/js/slideshow.js"></script>');
                */

                query("body").append('<link rel="stylesheet" href="jquery/plugins/supersized/css/supersized.css" type="text/css" media="screen" />' +
                    '<link rel="stylesheet" href="jquery/plugins/supersized/css/custom65height.css" type="text/css" media="screen" />' +
                    '<link rel="stylesheet" href="jquery/plugins/supersized/css/supersized.shutter.css" type="text/css" media="screen" />' +
                    '<link rel="stylesheet" href="jquery/plugins/supersized/css/supersized-custom.css" type="text/css" media="screen" />');
            }
        }
    });
});