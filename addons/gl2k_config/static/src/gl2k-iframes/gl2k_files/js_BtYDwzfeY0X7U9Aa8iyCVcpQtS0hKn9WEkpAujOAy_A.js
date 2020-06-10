/**
 * Zentropy javascript core
 *
 * - Provides frequently used extensions to base javascript objects
 * - jQuery browser detection tweak
 * - Define functions used in events
 */

// Add String.trim() method
String.prototype.trim = function(){
	return this.replace(/\s+$/, '').replace(/^\s+/, '');
}

// Add Array.indexOf() method
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, fromIndex) {
    if (fromIndex == null) {
      fromIndex = 0;
    } else if (fromIndex < 0) {
      fromIndex = Math.max(0, this.length + fromIndex);
    }
    for (var i = fromIndex, j = this.length; i < j; i++) {
      if (this[i] === obj){
        return i;
      }
    }
    return -1;
  };
}

// jQuery Browser Detect Tweak For IE7
jQuery.browser.version = jQuery.browser.msie && parseInt(jQuery.browser.version) == 6 && window["XMLHttpRequest"] ? "7.0" : jQuery.browser.version;

// Console.log wrapper to avoid errors when firebug is not present
// usage: log('inside coolFunc',this,arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function() {
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if (this.console) {
    console.log(Array.prototype.slice.call(arguments));
  }
};

// init object
var Zentropy = Zentropy || {};

/**
 * Image handling functions
 */
Zentropy.image = { _cache : [] };

// preload images
Zentropy.image.preload = function() {
  for (var i = arguments.length; i--;) {
    var cacheImage = document.createElement('img');
    cacheImage.src = arguments[i];
    Zentropy.image._cache.push(cacheImage);
  }
}
;
(function($) {
	var ua = $.browser;
	var heightAttr = (ua.msie && parseInt(ua.version.slice(0,1)) < 9) ? 'height' : 'min-height';
	
	$.fn.toEm = function(settings){
		settings = jQuery.extend({
			scope: 'body'
		}, settings);
		var that = parseInt(this[0],10);
		var teststr = '&nbsp;';
		for (var i=1; i<=99; i++) {
			teststr += '<br/>&nbsp;';
		}
		scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">' + teststr + '</div>').appendTo(settings.scope),
		scopeVal = scopeTest.height() / 100.0;
		scopeTest.remove();
		return (that / scopeVal).toFixed(8) + 'em';
	};

	$.fn.equalHeights = function(container) {
		tallest = 0;
		this.each(function() {
			if($(this).height() > tallest) {
				tallest = $(this).height();
			}
		});
		
		tallest = $(tallest).toEm({'scope' : container});	

		return this.each(function() {
			$(this).css(heightAttr, tallest);
			if (heightAttr == 'height') {
				$(this).css('overflow', 'visible');
			}
		});
	}
	
	function setHeights() {
		$('.twocol, .threecol, .fourcol, .sixcol').each(function() {
			$('.col', this).equalHeights(this);
		});
	}
	$(document).ready(function() {
		setHeights();
	});
	$(window).load(function() {
		setHeights();
	});
        if(!($.browser.msie && parseInt($.browser.version, 10) == 7)) {
                $(window).resize(function() {
                        setHeights();
                });
        }
})(jQuery);
;
Drupal.behaviors.close_messages = {
	attach: function(context, settings) {
		(function ($) {
			/* =============================================================================
				 Add 'x' close button and handler to status messages.
				 ========================================================================== */
			$.fn.closeButtonMessages = function() {
				$('.messages').each(function() {
					if ($(this).find('a.close').length < 1) {
						$(this).prepend('<a class="close" href="#" title="' + Drupal.t('Close') + '">Close</a>');
					}
				});
				$('.messages a.close').click(function(e) {
					e.preventDefault();
					$(this).parent().fadeOut('slow');
				});
			};
			$().closeButtonMessages();
		})(jQuery);
	}
}
;
/*jshint strict:true maxlen:220 */
(function($) {

$(document).ready(function(){
  // #z1139 open social media links in extra tab
  $('#block-menu-menu-social-menu .content a').attr('target', '_blank');
  // #z1936 workaround for anchors on page - need to use class anchor-link
  $('.anchor-link').on('click', function(e){ $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500); });
});

Drupal.behaviors.global_facets_filter = {};
Drupal.behaviors.global_facets_filter.attach = function(context, settings) {
  var $filterBtn = $('<span class="facet-filter-button">Filter</span>');
  var $closeBtn = $('<span class="facet-filter-close">Close</span>');
  var $applyBtn = $('<span class="clearfix"></span><span class="button facet-filter-apply">' + Drupal.t('Apply') + '</span>');
  $('.global-facet-filter').before($filterBtn);
  $('.global-facet-filter').prepend($closeBtn);
  $('.global-facet-filter').append($applyBtn);
  $closeBtn.on('click', function(e) {
    $('.global-facet-filter').hide();
    e.preventDefault();
  });
  $filterBtn.on('click', function(e) {
    $('.global-facet-filter').toggle();
    e.preventDefault();
  });
  $('.facetapi-inactive').on('click', function(e) {
    var cb = $(this).parent().find('input[type=checkbox]');
    var wrapper = $(this).parent();
    cb.prop('checked', !cb.prop('checked'));
    if (cb.prop('checked')) {
      wrapper.addClass('selected');
    } else {
      wrapper.removeClass('selected');
    }
    e.preventDefault();
  });
  $applyBtn.on('click', function(e) {
    var facets = [];
    var $checked = $('.global-facet-filter  input.facet-api-checkbox').each(function() {
      var cb = $(this);
      if (cb.is(':checked')) {
        facets.push(cb.data('facet'));
      }
    });

    if (facets.length) {
      var q = $.param({f: facets});
      var currentQuery = window.location.search.substring(1);
      if (currentQuery) {
        window.location.href = window.location.href + '&' + q;
      } else {
        window.location.href = window.location.href + '?' + q;
      }
    }
    e.preventDefault();
  });
};


Drupal.behaviors.global_masonry = {};
Drupal.behaviors.global_masonry.attach = function(context, settings) {
  var $body = $('body');
  // masonry only on knotenseiten, themaseiten, kampagnenseiten
  // und (ausnahme) am node 61 ("Themen")
  if ($body.hasClass('node-type-knotenseite') ||
      $body.hasClass('node-type-thema') ||
      $body.hasClass('page-node-61') ||
      $body.hasClass('node-type-campaign')) { 
    var $container = $('.view-zugewiesene-artikel .view-content, .view-id-themen .view-content');
    var $bricks = $('.view-zugewiesene-artikel .views-row, .view-id-themen .views-row');
    var brick_width = 0;
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector: '.views-row',
        columnWidth: function(containerWidth) {
          if (containerWidth <= 470) { // ~ desired breakpoint (500) - 4%
            brick_width = containerWidth;
          } else if (containerWidth <= 737) {  // window.width =< 767px
            brick_width = containerWidth / 2;
          } else {
            brick_width = containerWidth / 3;
          };
          $bricks.css('width', brick_width - 20);
          return brick_width;
        }
      });
    });
  // different masonry options for fotoalbums
  } else if ($body.hasClass('node-type-fotoalbum')) {
    var $container = $('.field-name-field-fotos .field-items');
    var $bricks = $('.field-name-field-fotos .field-item');
    var brick_width = 0;
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector: '.field-item',
	isFitWidth: true,
	gutterWidth: 20,
        columnWidth: function(containerWidth) {
          if (containerWidth <= 440) {
            brick_width = Math.min(containerWidth, 288);
          } else if (containerWidth <= 660) {
            brick_width = (containerWidth / 2) - 20;
            brick_width = Math.min(brick_width, 288);
          } else {
            brick_width = (containerWidth / 3) - 20;
            brick_width = Math.min(brick_width, 288);
          };
          $bricks.css('width', brick_width);
          return brick_width;
        }
      });
    });
  }
};

Drupal.behaviors.global = {};
Drupal.behaviors.global.attach = function(context, settings) {
  $('fieldset.collapsible .fieldset-title .fieldset-legend-prefix').before('<span class="collapsible-arrow"> </span>');

  // redefine toggling with a page slide
  //$('.webform-component--step-payment-method-fieldgroup').css('position', 'relative');
  // trigger 'create' on the ajax loaded content (via webform_ajax)
  // in order to augement the content with jQ mobile
  // (ajax loaded when the context == webform_ajax wrapper)
  if (context && context.length > 0) {
    var id = $('form', context).attr('id');
    if (typeof id !== 'undefined'
         && (id.indexOf('webform-ajax-wrapper' >= 0)
	  || id.indexOf('views-exposed-form' >= 0))) {
      //$('div.messages').hide();
      $('form', context).trigger('create');
    }
  }

  // prevent AJAX on current button
  if (typeof(Drupal.ajax) !== 'undefined') {
    var current = $('#webform-steps-wrapper .step.current input').attr('id');
    if (Drupal.ajax[current] && Drupal.ajax[current].length > 0) {
      Drupal.ajax[current].beforeSubmit = function(jqxhr, settings) {
        return false;
      };
    }
  }

  $('.node-flexiteaser').click(function(){
    window.location.href = $('h2 a', this).attr('href');
  }).addClass('clickable').find('a').click(function(event) {
    event.stopPropagation();
  });

  // The whole teaser is clickable
  $('.node-flexiteaser').click(function(){
    window.location.href = $('h2 a', this).attr('href');
  }).addClass('clickable').find('a').click(function(event) {
    event.stopPropagation();
  });
  // The whole banner is clickable
  $('.field-name-banner').click(function(){
    window.location.href = $('.ui-link', this).attr('href');
  }).addClass('clickable').find('a').click(function(event) {
    event.stopPropagation();
  });

};

Drupal.behaviors.global_payment = {};
Drupal.behaviors.global_payment.attach = function(context, settings) {
  /*
   * $selector slides out on click and $forms slide in.
   * $forms slide out on click on the back-link and $selector slides in.
   * $wrapper.height() is animated accordingly.
   */
  // only act on payment webform component wrappers.
  var behavior = this;
  
  $('.paymethod-select-wrapper', context)
    .css({position: 'relative'})
  .each(function() {
    // initial state: selector visible forms invisible
    var $wrapper = $(this);
    var $selector = $wrapper.children('.form-type-radios');
    behavior.$selector = $selector;
    if ($selector.length <= 0)
      return;

    var $forms = $('.payment-method-all-forms', $wrapper)

    if (behavior.showForms) {
      $selector.css({left: '-120%', position: 'relative', top: 0, margin: 0}).hide();
      $forms.css({position: 'relative', right:'0%', top:0, margin: 0});
    } else {
      $selector.css({position: 'relative', top: 0, left: '0%', margin: 0});
      $forms.css({position: 'absolute', right: '0%', top: 0, margin: 0}).hide();
    }

    var $submit_buttons = $wrapper.parents('form').find('.form-actions').appendTo($forms);

    $selector.find('.form-type-radio').change(function() {
      behavior.showForms = true;
      // slide in forms and select out
      $wrapper.height($selector.height());
      $selector.css({position: 'absolute', top: 0, left: '0%'})
      .animate({left: '-120%'}, 500, 'swing', function() {
        $selector.hide().css('position', 'relative');
      });

      $forms.show();
      $forms.css({position: 'absolute', width: '100%', right: '-120%'})
      .animate({right: '0%'}, 500, 'swing', function() {
          $forms.css('position', 'relative');
      });
      
      $wrapper.animate({height: $forms.height()}, 500, 'swing', function() {
        $wrapper.css('height', 'auto');
      });
    });
    console.log('bound event');
    
    $('<div class="payment-slide-back"><a href="#">' + Drupal.t('Back...') + '</a></div>')
    .prependTo($forms)
    .click(function(e) {
      behavior.showForms = false;
      //slide out forms and selector in.
      $selector.css({position: 'relative', width: '100%'});
      $selector.show().animate({left: '0%'}, 500, 'swing', function() {
        $selector.css('position', 'relative');
      });

      $wrapper.height($forms.height());
      $forms.css('position', 'absolute');
      $forms.animate({right: '-120%'}, 500, 'swing', function() {
        //$forms.removeClass('slided');
        $forms.hide().css('position', 'relative');
      });
      
      $wrapper.animate({height: $selector.height()}, 500, 'swing', function() {
        $wrapper.css('height', 'auto');
      });
      // do not bubble
      e.stopPropagation();

      // return false to prevent a page reload
      return false;
    });
  });
};

Drupal.behaviors.global_dialog = {};
Drupal.behaviors.global_dialog.attach = function(context, settings) {
  if ($('body', context).length <= 0)
    return;

  if ($('.mo-dialog-wrapper').length > 0) {
    this.$wrapper = $('.mo-dialog-wrapper');
  } else {
    this.$wrapper = $('<div class="mo-dialog-wrapper"><div class="mo-dialog-content"></div></div>')
    .appendTo($('body', context));

    this.$wrapper.click(function() {
      $(this).hide();
      $(this).children('.mo-dialog-content')
        .removeClass('loading').removeClass('error').html('');
      console.log(this);
    });
  }
  this.$content = this.$wrapper.children('.mo-dialog-content');

  if (typeof(Drupal.ajax) == 'undefined') {
    return;
  }
  // override the default error handler from Drupals ajax.js
  var behavior = this;
  Drupal.ajax.prototype.error = function() { behavior.error(); };
};
Drupal.behaviors.global_dialog.error = function() {
    // change the mo-dialog to an error
    this.$content.addClass('error').removeClass('loading')
      .html('<p>' + Drupal.t('Something went wrong. Please try again later.') + '</p>');
    // reenable the submit button (was disabled during ajax request)
    $('#edit-actions input.form-submit').removeAttr('disabled');
};
Drupal.behaviors.global_dialog.loading = function() {
  this.$wrapper.show();
  this.$content.addClass('loading')
  .html('<p>' + Drupal.t('Please wait while we are proccessing your payment.') + '</p>');
}

Drupal.behaviors.global_webform_slide = {};
Drupal.behaviors.global_webform_slide.attach = function(context, settings) {
  this.stepForward = true;
  this.pageNum = parseInt($('input[name="details\[page_num\]"]').attr('value'));
  var maxPageNum = parseInt($('input[name="details\[page_count\]"]').attr('value'));
  this.finished = (this.pageNum == maxPageNum);
  
  // container id begins with webform-ajax-wrapper
  this.$container = $('*[id^=webform-ajax-wrapper]');
};
Drupal.behaviors.global_webform_slide.onSend = function(settings) {

  var targetPageNum;

  // determine if we need to slide "back" i.e. to the right
  if (settings.extraData._triggering_element_name === 'prev') {
    this.stepForward = false; // slide to right
    targetPageNum = this.pageNum - 1;
  } else if (settings.extraData._triggering_element_name === 'op' || settings.extraData._triggering_element_name === 'next') {
    targetPageNum = this.pageNum + 1;
  } else if (settings.extraData._triggering_element_name === 'step-btn') {
    this.stepForward = (parseInt(settings.extraData._triggering_element_value) < this.pageNum);
    targetPageNum = parseInt(settings.extraData._triggering_element_value);
  }
  
  // generate a dummy div to display while loading
  this.$loadingdummy = $('<div id="webform-ajax-dummy"><div class="container"><div>' + Drupal.t('loading') + '</div></div></div>');
  // set dummy dimensions to current container dimensions
  this.$loadingdummy.css({height: this.$container.height() + 'px', width: this.$container.width() + 'px'});
  // anchor is the parent element of the ajax container
  this.$container.parent().css('position', 'relative');

  /*this.$stepsdummy = $('#webform-steps-wrapper')
    .clone(false)
    .attr('id', 'webform-steps-dummy');
  this.$stepsdummy.find('input').attr('id', '');
  this.$stepsdummy.insertBefore(this.$container);
  
  var $steps = this.$stepsdummy.find('.step').removeClass('current');
  $steps.each(function(i){
    if (i+1 == targetPageNum) {
      $(this).addClass('current').removeClass('disabled');
      // you cannot style IE<8 disabled buttons, therefore we must too remove the attr
      $('input', this).removeAttr('disabled');
    }
  });*/

  // define the animation
  var anim = {};
  var reverseAnim = {};
  // one element needs position: relative
  if (this.stepForward) {
    this.$loadingdummy.css({position: 'absolute', right: '-120%'});
    this.$container.css({position: 'relative', right: '', left: '0%'});
    anim = {left: '-150%'};
    reverseAnim = {right: '0%'};
    this.$loadingdummy.insertBefore(this.$container);
  } else {
    this.$loadingdummy.css({position: 'relative', left: '-120%'});
    this.$container.css({position: 'absolute', right: '0%', left: ''});
    anim = {right: '-150%'};
    reverseAnim = {left: '0%'};
    this.$loadingdummy.insertAfter(this.$container);
  }

  // do the slide!
  // move dummy in
  this.$loadingdummy.animate(reverseAnim, 800);
  // move container out
  this.$container.animate(anim, 800, function() {
    // save the direction for ajaxSuccess to read
    Drupal.settings.slideToRight = this.stepForward;
  });
};
Drupal.behaviors.global_webform_slide.onSuccess = function(settings) {
  var $steps = $('#webform-steps-wrapper');
  //$steps.hide();

  this.$container.css({left: '', right: '', position: 'absolute', opacity: 0});
  this.$loadingdummy.css('position', 'relative');
  
  var behavior = this;
  // to the incoming slide
  this.$loadingdummy.animate({height: this.$container.height()}, 200, 'swing', function() {
    behavior.$container.css('position', 'relative');
    behavior.$loadingdummy.css('position', 'absolute').fadeOut(400);
    behavior.$container.animate({opacity: 1}, 400, function() {
      behavior.$loadingdummy.remove();
      //$steps.show();
      //behavior.$stepsdummy.remove();
    });
  });

  if (this.finished) {
    Drupal.behaviors.global_payment.$selector.change();
  }
}

$(document).ajaxSend(function(e, xhr, settings) {
  if (!settings.data)
    return;

  Drupal.behaviors.global_webform_slide.onSend(settings);
});
$(document).ajaxSuccess(function(e, xhr, settings) {
  if (!settings.data)
    return;
  
  Drupal.behaviors.global_webform_slide.onSuccess(settings);
});
return;

})(jQuery);

;
function checkNarrow(){
	var size = {
		four: 400,
		five: 500,
		six: 600,
		sixfive: 650,
		seven: 700,
		sevensome: 768,
		eightfive: 850,
		nine: 900,
                desktop: 985
	};
	jQuery.each(size, function(cls, size) {
		if (jQuery(window).width() >= size) {
			jQuery('html').addClass(cls);
		} else {
			jQuery('html').removeClass(cls);
		}
	});
}

jQuery(window).resize(checkNarrow);
jQuery(window).ready(checkNarrow);
;

(function($) {
  Drupal.mobile_menu = {};
  Drupal.mobile_menu.breakpoint_passed = false;
  Drupal.behaviors.mobile_menu = {};
  Drupal.behaviors.mobile_menu.attach = function(context) {
    $('#mobilemenu').once('mobilemenu', function() {
      $(this).before('<a href="#" id="mobile-menu-icon">Men&uuml;</a>');
      $(this).prepend('<a href="#" id="mobile-menu-close">' + Drupal.t('close') + '</a>');

      $('#mobile-menu-icon, .mo-dialog-wrapper, #mobile-menu-close').click(function(e) {
        var mobileMenu = $('#mobilemenu');
        var mainMenu = $('#main-menu');
        if (mobileMenu.is(':visible')) {
          mobileMenu.css({left: '0%'});
          mobileMenu.animate({left: '-120%'}, 700, function() {
            mobileMenu.hide();
            setMainMenuActiveState();
            $('.mo-dialog-wrapper').removeClass('visible');
            $('#mobile-menu-close').hide();
          });
        } else {
          mobileMenu.css({left: '-120%'});
          mobileMenu.show().animate({left: '0%'}, 700, function() {
            setMainMenuActiveState();
            $('#mobile-menu-close').show();
          });
          $('.mo-dialog-wrapper').addClass('visible');
        }
        e.preventDefault();
        return false;
      });

      // if the link clicked has a ul.menu sibling (i.e. a submenu)
      // we want to show the submenu
      $('#main-menu li a').click(function(e) {
        if (!$(this).parents('html.desktop').length > 0) {
          var ul = $(this).siblings('ul.menu');
          if (ul.length > 0) {
            if (ul.is(':visible')) {
              ul.hide();
            } else {
              ul.show();
            }
            e.preventDefault();
            return false;
          }
        }
      });

    });

    // initialize main-menu
    setMainMenuActiveState();


    // reset the visibility when we hit the breakpoint 'desktop'
    $(window).resize(function() {
      var mobileMenu = $('#mobilemenu');
      var mainMenu = $('#main-menu');
      var mobileMenuClose = $('#mobile-menu-close');
      var moDialog = $('.mo-dialog-wrapper');
      // we switch from mobile/tablet to desktop
      if (!Drupal.mobile_menu.breakpoint_passed && $('html').hasClass('desktop')) {
        mobileMenu.show();
        mobileMenuClose.hide();
        moDialog.removeClass('visible');
        // close any open submenus when switching to desktop
        // but show the submenus of the active trail
        $('.menu .menu', mainMenu).hide();
        Drupal.mobile_menu.breakpoint_passed = true;
      }
      // we switch from desktop to tablet/mobile
      if (Drupal.mobile_menu.breakpoint_passed && !$('html').hasClass('desktop')) {
        mobileMenu.hide();
        mobileMenuClose.show();
        $('.menu .menu', mainMenu).show();
        moDialog.removeClass('visible');
        Drupal.mobile_menu.breakpoint_passed = false;
      }
    });

    function setMainMenuActiveState() {
      var mobileMenu = $('#mobilemenu');
      var mainMenu = $('#main-menu');
      var mainMenuIcon = $('#mobile-menu-icon');
      if(mobileMenu.is(':visible')) {
        mainMenuIcon.addClass('active');
      } else {
        mainMenuIcon.removeClass('active');
      }
    }
  };
})(jQuery);
;
