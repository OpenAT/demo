$(document).ready(function() {
        
        $('#gallery-modal').hide();
        
        $('body').on('click', '#gallery-modal-close', function() {
          $('#gallery-modal').fadeOut(150);
        });
        
        var marker_data = null, image_data = null;
        var win_width = $(window).width();
        var dataSuccess = false, imageSuccess = false;
        
        
        /* CONFIG */
        var minZoomDesktop      = 7;
        var minZoomMobile       = 5;
        var initialZoomDesktop  = 7;
        var initialZoomMobile   = 5.75;
        var mobileShowCom       = 8;
        var desktopShowCom      = 9;
        
        var mobileBreakpoint    = 768;
        
        var jsonDomain          = 'http://demo.local.com';
        var dirBase             = 'http://demo.local.com/gl2k_gardenvis/static/src';
        var iconCamera          = '/img/camera_small.png';
        
        var statesKml           = '/data/austria_states.kml'; // will be cached for some minutes by google on first calling
        var communityKml        = '/data/austria_communities.kml'; // will be cached for some minutes by google on first calling
        /* CONFIG END */
        
         
        
        /* ToDo: Image URL */
        /* ToDo: Check State Centers */
  
  
  
  
        $.loadScript = function (url, callback) {
          $.ajax({
              url: url,
              dataType: 'script',
              success: callback,
              async: true
          });
        };
 
            try {
              
              var jsonParams = {"params":{}};
              
              $.ajax({
                  url : jsonDomain + "/gl2k/garden/data",
                  type : 'POST',
                  contentType: 'application/json; charset=utf-8',
                  dataType: 'json',
                  data: JSON.stringify(jsonParams),
                  error : function(data) {
                    console.log(data);
                    return;
                  },
                  success : function(data) {
                      marker_data = data;
                      dataSuccess = true;                    
                    
                    if ( $.loadScript('https://maps.googleapis.com/maps/api/js?key=' + gmapsApiKey + '&callback=init'), function() {
                      initMap();
                    });
                  }
              });              
            } 
            catch(error) {
              console.log('Error', error);
              return;
            }

       
          var map = null, state_data = null, community_data = null, kmlLayerFull = null, kmlLayerStates = null;        
          var circles = new Array();
          var markers = new Array();
          var circle_centers = {};
        
          
        
        
          /**/
          initMap = function() { 
                       
            var initial_zoom_level = null;
            
            if ( $(window).width() > mobileBreakpoint ) 
              initial_zoom_level = initialZoomDesktop;
            else
              initial_zoom_level = initialZoomMobile;
            
            map = new google.maps.Map(document.getElementById('map-canvas'), {
              styles: [
                {
                  "elementType": "geometry",
                  "stylers": [
                    {
                      "color": "#ffffff"
                    }
                  ]
                },
                {
                  "elementType": "labels",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "administrative",
                  "elementType": "geometry.stroke",
                  "stylers": [
                    {
                      "color": "#ffffff"
                    }
                  ]
                },
                {
                  "featureType": "administrative.province",
                  "elementType": "geometry.stroke",
                  "stylers": [
                    {
                      "visibility": "on"
                    }
                  ]
                },
                {
                  "featureType": "poi",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "road",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "road",
                  "elementType": "geometry",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "road",
                  "elementType": "labels.icon",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "transit",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                },
                {
                  "featureType": "water",
                  "elementType": "geometry.fill",
                  "stylers": [
                    {
                      "visibility": "off"
                    }
                  ]
                }
              ],
              
              center: {lat: 47.7569526, lng: 13.35},
              zoom: initial_zoom_level,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              disableDefaultUI: true,
              draggable: true,
              minZoom: 7,
            });
            
            google.maps.event.addListener(map, 'zoom_changed', function() {
              var zoomLevel = map.getZoom();  
              
              if( zoomLevel <= desktopShowCom && win_width > mobileBreakpoint ) {
                /* desktop zoom level bundeslandansicht */
                showStateMarkers(true);
                
                map.setOptions({ minZoom: minZoomDesktop });
                
                /* activate bundeslandansicht */
                kmlLayerStates.setMap(map);
                kmlLayerFull.setMap(null);
              }
              else if ( zoomLevel <= mobileShowCom && win_width < mobileBreakpoint ) {
                /* mobile zoom level bundeslandansicht */
                showStateMarkers(true);
                
                map.setOptions({ minZoom: minZoomMobile });
                
                /* activate bundeslandansicht */
                kmlLayerStates.setMap(map);
                kmlLayerFull.setMap(null);
              }
              else {
                /* bezirksansicht */
                showCommunityMarkers(true);                
                
                /* activate bezirksansicht */
                kmlLayerFull.setMap(map);
                kmlLayerStates.setMap(null);
              }
            });
            
            /* Initialisiere Bundeslandansicht */
            kmlLayerStates = new google.maps.KmlLayer( dirBase + statesKml + '?v=1.018', {
              preserveViewport: true,
              suppressInfoWindows: true
            });
            
            /* activate bundeslandansicht */
            kmlLayerStates.setMap(map);
            
            /* Initialisiere Bezirksansicht */
            kmlLayerFull = new google.maps.KmlLayer(dirBase + communityKml + '?v=1.012', {
                  preserveViewport: true,
                  suppressInfoWindows: true
            });
            
            return true;
            
          }
          /* initMap() */
          
           
          
          
          /* shows the circles of the state data */
          showStateMarkers = function(removeComMarker = false) {
            
            if(removeComMarker === true ) {
              removeCommunityMarkers();
            }
            
            
            /* ToDo: Check State Centers */
            /* Custom define center of circles here */
            circle_centers = {
              'Steiermark' : {
                center: {lat: 47.0735683, lng: 15.3717508}
              },
              'Wien': {
                center: {lat: 48.2, lng: 16.39}
              },
              'Salzburg': {
                center: {lat: 47.490975, lng: 12.4762199}
              },
              'Burgenland': {
                center: {lat: 47.4732649, lng: 16.018123}
              },
              'Oberösterreich': {
                center: {lat: 48.1154729, lng: 13.3097412}
              },
              'Niederösterreich': {
                center: {lat: 48.2199384, lng: 15.1999215}
              },
              'Kärnten': {
                center: {lat: 46.7504373, lng: 13.3003836}
              },
              'Tirol': {
                center: {lat: 47.2854337, lng: 11.3087508}
              },
              'Vorarlberg': {
                center: {lat: 47.1938374, lng: 9.9166383}
              }
            };
            /* ToDo: Check State Centers */
            
            
            try {
              for (var i = 0; i < state_data.length; i += 1) {
                 var stateCircle = new google.maps.Marker({
                    map: map,
                    position: circle_centers[state_data[i].cmp_state].center,
                    area: state_data[i].garden_size,
                    country: state_data[i].cmp_state,
                    img_ids: [state_data[i].record_ids],
                    icon: dirBase + iconCamera,
                    label: {text: state_data[i].garden_size + 'm²', color: 'black'}               
                  });

                  stateCircle.addListener('click', function() {
                    showStateDetails(this);
                  });

                  circles.push( stateCircle );
                }
            } catch(error) {
              console.log(error);
            }
            
          }
          /* showStateMarkers() */
          
          
          
          /**/
          removeStateMarkers = function() {
            console.log('remove state markers');
            for(var circle in circles) {
              circles[circle].setMap(null);
            }
          }
          /* removeStateMarkers() */
          
          
          
          
          /**/
          showCommunityMarkers = function() {

            removeStateMarkers(); 
           
            if( markers.length == 0 ) {
              try {
                for(var i = 0; i < community_data.length; i += 1) {

                  var this_city = community_data.findIndex( x => x.cmp_community_code === community_data[i].cmp_community_code);


                  var comMarker = new google.maps.Marker({


                      /* ToDo: LatLng */
                      position: { lat: Number(community_data[this_city].latitude[0]), lng: Number(community_data[this_city].longitude[0]) },
                      /* ToDo: LatLng */


                      map: map,
                      community: community_data[this_city].cmp_community,
                      garden_size: community_data[this_city].garden_size,
                      cmp_community_code: community_data[this_city].cmp_community_code,
                      image_ids : community_data[this_city].thumbnail_record_ids ,
                      icon: dirBase + iconCamera,
                      label: {text: community_data[this_city].cmp_community + ': ' + community_data[this_city].garden_size + 'm²', color: 'black'}
                  });   

                  comMarker.addListener('click', function() {
                    map.panTo(this.getPosition());
                    showComDetails(this);
                  });

                  markers.push( comMarker );
                }
              } catch(error) {
                console.log(error);
              }
            }
            else {
              for(var marker in markers) {
                markers[marker].setMap(map);
              }
            }             
          }
          /* showCommunityMarkers() */
          
          
          
          /**/
          removeCommunityMarkers = function() {
            for(var marker in markers) {
              markers[marker].setMap(null);
            }
          }
          /* removeCommunityMarkers() */
        
          
          
          
          /* Set state_data and community_data, show initial circles */
          init = function() {
            var initializingMap = initMap();
            
            if ( initializingMap == true ) {
              
                           
              state_data = marker_data['result']['state_data'][0];
              community_data = marker_data['result']['community_data'][0];


              showTotalGardenSize();
              showStateMarkers();
              setCounterPos();
            }
            else {
              console.log('Google Maps Karte konnte nicht geladen werden');
            }
            
          }
          /* init() */
          
          
          
          
          /**/          
          setCounterPos = function() {
            $(window).load( function() {
                var left_pos = $('#gl2k-garden-container #map-canvas').offset().left;
                var top_pos = $('#gl2k-garden-container #map-canvas').offset().top;

                $('#gl2k-garden-container #total-garden-size').css({
                  'top': (top_pos + 25),
                  'left': (left_pos + 25),
                  'transform': 'none'
                });
            });
          }
          /* setCounterPos() */
          
          
          
          
          /**/
          showTotalGardenSize = function() {
            var total_garden_size = 0;
            var total_garden_count = 0;
            
            for(var i = 0; i < state_data.length; i += 1) {
              total_garden_size += state_data[i].garden_size;
            }
            
            for(var i = 0; i < community_data.length; i += 1) {
              total_garden_count += community_data[i].record_ids.length;
            }
            
            $("#gl2k-garden-container #total-garden-size h2").text( total_garden_size + "m²" );
            $('#gl2k-garden-container #total-garden-count').html( '<small>von ' + total_garden_count + ' Personen</small>');
          }
          /* showTotalGardenSize() */
          
          
          /**/
          showStateDetails = function(data) {
            $('#gl2k-garden-container #gallery-modal').fadeIn();
            
            $('#gl2k-garden-container #gallery-modal h2.gallery-headline').text( data.country );
            $('#gl2k-garden-container #gallery-modal .gallery-image-container').html('');

            var eintragWort = 'Einträge';
            if(data.img_ids[0].length == 1) {
              eintragWort = 'Eintrag';
            }

            $('#gl2k-garden-container #gallery-modal h3.gallery-subheadline').text( data.img_ids[0].length + ' ' + eintragWort + ' | Gesamtfläche: ' + data.area + 'm²');            
                  
            var city_name = true;
            
            for(var img in data.img_ids[0]) {              
              var id = data.img_ids[0][img];                
              
              $('#gl2k-garden-container #gallery-modal .gallery-image-container').append("<img src='"+jsonDomain+"/website/image/gl2k.garden/" + id + "/cmp_image_file'>");
            }
            
            /*$('#gl2k-garden-container #gallery-modal .gallery-image-container ul').lightSlider({
                gallery: true,
                item: 1,
                slideMargin: 0
            });*/
            
          }
          /* showStateDetails() */
          
          
          
          
          /**/
          showComDetails = function(data) {
            $('#gl2k-garden-container #gallery-modal').fadeIn();
            
            $('#gl2k-garden-container #gallery-modal h2.gallery-headline').text( data.community );

            $('#gl2k-garden-container #gallery-modal h3.gallery-subheadline').text( 'Gesamtfläche: ' + data.garden_size + 'm²');
            $('#gl2k-garden-container #gallery-modal .gallery-image-container').html('');

            for(var img in data.image_ids) {
                var id = data.image_ids[img];
                $('#gl2k-garden-container #gallery-modal .gallery-image-container').append( "<img src='"+jsonDomain+"/website/image/gl2k.garden/" + id + "/cmp_image_file'>");
            }
            
            
            
            /*$('#gl2k-garden-container #gallery-modal .gallery-image-container').lightSlider({
                gallery: true,
                item: 1,
                slideMargin: 0
            });*/
            
          }
          /* showComDetails() */
          

        });
