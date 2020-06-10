// needs to be run *before* jquery.mobile is loaded
jQuery(document).bind('mobileinit',function(){
  jQuery.mobile.page.prototype.options.keepNative = "input[type=submit], button";
  jQuery.mobile.page.prototype.options.theme = "o";
  jQuery.mobile.ajaxEnabled = false;
  jQuery.mobile.pushStateEnabled = false;
  jQuery.mobile.selectmenu.prototype.options.nativeMenu = false;
  jQuery.mobile.selectmenu.prototype.options.loadingMessage = false;
});
