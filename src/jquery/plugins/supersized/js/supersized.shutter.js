/*

	Supersized - Fullscreen Slideshow jQuery Plugin
	Version : 3.2.7
	Theme 	: Shutter 1.1
	
	Site	: www.buildinternet.com/project/supersized
	Author	: Sam Dunn
	Company : One Mighty Roar (www.onemightyroar.com)
	License : MIT License / GPL License

*/(function(e){theme={_init:function(){api.options.slide_links&&e(vars.slide_list).css("margin-left",-e(vars.slide_list).width()/2);if(api.options.autoplay)api.options.progress_bar&&theme.progressBar();else{e(vars.play_button).attr("src")&&e(vars.play_button).attr("src",vars.image_path+"play.png");api.options.progress_bar&&e(vars.progress_bar).stop().css({left:-e(window).width()})}e(vars.thumb_tray).css({bottom:-e(vars.thumb_tray).height()});e(vars.tray_button).toggle(function(){e(vars.thumb_tray).stop().animate({bottom:0,avoidTransforms:!0},300);e(vars.tray_arrow).attr("src")&&e(vars.tray_arrow).attr("src",vars.image_path+"button-tray-down.png");return!1},function(){e(vars.thumb_tray).stop().animate({bottom:-e(vars.thumb_tray).height(),avoidTransforms:!0},300);e(vars.tray_arrow).attr("src")&&e(vars.tray_arrow).attr("src",vars.image_path+"button-tray-up.png");return!1});e(vars.thumb_list).width(e("> li",vars.thumb_list).length*e("> li",vars.thumb_list).outerWidth(!0));e(vars.slide_total).length&&e(vars.slide_total).html(api.options.slides.length);if(api.options.thumb_links){e(vars.thumb_list).width()<=e(vars.thumb_tray).width()&&e(vars.thumb_back+","+vars.thumb_forward).fadeOut(0);vars.thumb_interval=Math.floor(e(vars.thumb_tray).width()/e("> li",vars.thumb_list).outerWidth(!0))*e("> li",vars.thumb_list).outerWidth(!0);vars.thumb_page=0;e(vars.thumb_forward).click(function(){if(vars.thumb_page-vars.thumb_interval<=-e(vars.thumb_list).width()){vars.thumb_page=0;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}else{vars.thumb_page=vars.thumb_page-vars.thumb_interval;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}});e(vars.thumb_back).click(function(){if(vars.thumb_page+vars.thumb_interval>0){vars.thumb_page=Math.floor(e(vars.thumb_list).width()/vars.thumb_interval)*-vars.thumb_interval;e(vars.thumb_list).width()<=-vars.thumb_page&&(vars.thumb_page=vars.thumb_page+vars.thumb_interval);e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}else{vars.thumb_page=vars.thumb_page+vars.thumb_interval;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}})}e(vars.next_slide).click(function(){api.nextSlide()});e(vars.prev_slide).click(function(){api.prevSlide()});jQuery.support.opacity&&e(vars.prev_slide+","+vars.next_slide).mouseover(function(){e(this).stop().animate({opacity:1},100)}).mouseout(function(){e(this).stop().animate({opacity:.6},100)});if(api.options.thumbnail_navigation){e(vars.next_thumb).click(function(){api.nextSlide()});e(vars.prev_thumb).click(function(){api.prevSlide()})}e(vars.play_button).click(function(){api.playToggle()});api.options.mouse_scrub&&e(vars.thumb_tray).mousemove(function(t){var n=e(vars.thumb_tray).width(),r=e(vars.thumb_list).width();if(r>n){var i=1,s=t.pageX-i;if(s>10||s<-10){i=t.pageX;newX=(n-r)*(t.pageX/n);s=parseInt(Math.abs(parseInt(e(vars.thumb_list).css("left"))-newX)).toFixed(0);e(vars.thumb_list).stop().animate({left:newX},{duration:s*3,easing:"easeOutExpo"})}}});e(window).resize(function(){if(api.options.progress_bar&&!vars.in_animation){vars.slideshow_interval&&clearInterval(vars.slideshow_interval);api.options.slides.length-1>0&&clearInterval(vars.slideshow_interval);e(vars.progress_bar).stop().css({left:-e(window).width()});!vars.progressDelay&&api.options.slideshow&&(vars.progressDelay=setTimeout(function(){if(!vars.is_paused){theme.progressBar();vars.slideshow_interval=setInterval(api.nextSlide,api.options.slide_interval)}vars.progressDelay=!1},1e3))}if(api.options.thumb_links&&vars.thumb_tray.length){vars.thumb_page=0;vars.thumb_interval=Math.floor(e(vars.thumb_tray).width()/e("> li",vars.thumb_list).outerWidth(!0))*e("> li",vars.thumb_list).outerWidth(!0);if(e(vars.thumb_list).width()>e(vars.thumb_tray).width()){e(vars.thumb_back+","+vars.thumb_forward).fadeIn("fast");e(vars.thumb_list).stop().animate({left:0},200)}else e(vars.thumb_back+","+vars.thumb_forward).fadeOut("fast")}})},goTo:function(){if(api.options.progress_bar&&!vars.is_paused){e(vars.progress_bar).stop().css({left:-e(window).width()});theme.progressBar()}},playToggle:function(t){if(t=="play"){e(vars.play_button).attr("src")&&e(vars.play_button).attr("src",vars.image_path+"pause.png");api.options.progress_bar&&!vars.is_paused&&theme.progressBar()}else if(t=="pause"){e(vars.play_button).attr("src")&&e(vars.play_button).attr("src",vars.image_path+"play.png");api.options.progress_bar&&vars.is_paused&&e(vars.progress_bar).stop().css({left:-e(window).width()})}},beforeAnimation:function(t){api.options.progress_bar&&!vars.is_paused&&e(vars.progress_bar).stop().css({left:-e(window).width()});e(vars.slide_caption).length&&(api.getField("title")?e(vars.slide_caption).html(api.getField("title")):e(vars.slide_caption).html(""));vars.slide_current.length&&e(vars.slide_current).html(vars.current_slide+1);if(api.options.thumb_links){e(".current-thumb").removeClass("current-thumb");e("li",vars.thumb_list).eq(vars.current_slide).addClass("current-thumb");if(e(vars.thumb_list).width()>e(vars.thumb_tray).width())if(t=="next"){if(vars.current_slide==0){vars.thumb_page=0;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}else if(e(".current-thumb").offset().left-e(vars.thumb_tray).offset().left>=vars.thumb_interval){vars.thumb_page=vars.thumb_page-vars.thumb_interval;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}}else if(t=="prev")if(vars.current_slide==api.options.slides.length-1){vars.thumb_page=Math.floor(e(vars.thumb_list).width()/vars.thumb_interval)*-vars.thumb_interval;e(vars.thumb_list).width()<=-vars.thumb_page&&(vars.thumb_page=vars.thumb_page+vars.thumb_interval);e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}else if(e(".current-thumb").offset().left-e(vars.thumb_tray).offset().left<0){if(vars.thumb_page+vars.thumb_interval>0)return!1;vars.thumb_page=vars.thumb_page+vars.thumb_interval;e(vars.thumb_list).stop().animate({left:vars.thumb_page},{duration:500,easing:"easeOutExpo"})}}},afterAnimation:function(){api.options.progress_bar&&!vars.is_paused&&theme.progressBar()},progressBar:function(){e(vars.progress_bar).stop().css({left:-e(window).width()}).animate({left:0},api.options.slide_interval)}};e.supersized.themeVars={progress_delay:!1,thumb_page:!1,thumb_interval:!1,image_path:"lib/jpl/resources/img/",play_button:"#pauseplay",next_slide:"#nextslide",prev_slide:"#prevslide",next_thumb:"#nextthumb",prev_thumb:"#prevthumb",slide_caption:"#slidecaption",slide_current:".slidenumber",slide_total:".totalslides",slide_list:"#slide-list",thumb_tray:"#thumb-tray",thumb_list:"#thumb-list",thumb_forward:"#thumb-forward",thumb_back:"#thumb-back",tray_arrow:"#tray-arrow",tray_button:"#tray-button",progress_bar:"#progress-bar"};e.supersized.themeOptions={progress_bar:1,mouse_scrub:0}})(jQuery);