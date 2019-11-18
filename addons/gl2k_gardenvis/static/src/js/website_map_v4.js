/// <reference path='/austria_data/bundeslaender_und_gemeinden.js'/>


// Global Variables to hold the gardenMap and related data
var gardenMap;

var stateLayer;
var stateMarkerLayerGroup;

var communityLayer;
var communityMarkerLayerGroup;

var state_data = null;
var state_data_glo = [];
var state_data_map = null;

// Garden data from odoo
var community_data = null;
var community_data_glo = [];
// Garden data from odoo as dict with "filtered cmp_community" field as dict key
var community_data_map = null;

// List with "filtered community names" and computed centers from the geojson map bundeslaender_und_gemeinden2.js
var community_data_centers = [];
// Dictionary from "community_data_centers list" where the filtered community name is the dict-key
var community_data_map_centers = null;

var gardenMapGalleryData;

var gardenMapLastHighlightFeature;


$(document).ready(function () {
    'use strict';

    //----------------------------
    // GET DATA AND START INIT MAP
    //----------------------------

    // Get all data from the /gl2k/garden/data json-controller and initialize the map
    try {
        if ( $( "#gardenMap" ).length ) {
            $.ajax({
                url: "/gl2k/garden/data",
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data: JSON.stringify({"params": {}}),

                // request error
                error: function (data) {
                    console.log('Error on getting data from /gl2k/garden/data !');
                },

                // request success
                success: function (data) {
                    state_data = data.result.state_data;
                    state_data_glo = data.result.state_data[0];
                    state_data_map = dataToMap(state_data_glo, 'cmp_state', null);
                    // console.log('state_data_map', state_data_map);

                    community_data = data.result.community_data;
                    community_data_glo = data.result.community_data[0];
                    community_data_map = dataToMap(community_data_glo, 'cmp_community', null);

                    // INITIALIZE THE MAP AFTER WE RECEIVED AND PREPARED THE DATA
                    initMap();
                }
            });
        }

    // request exception
    } catch (error) {
        console.log('Exception on getting data from /gl2k/garden/data ! ', error);
    }

    // Helper functions to convert the data
    //-------------------------------------
    function dataToMap(data, name, value) {
        return _.reduce(data, function(acc, item) {
            if (value === null ) {
                acc[filterName(item[name])] = item;
            }
            else {
                acc[filterName(item[name])] = item[value];
            }
            return acc;
        }, {});
    }

    // function replaceUmlaute(str) {
    //     var umlautMap = {
    //         '\u00dc': 'UE',
    //         '\u00c4': 'AE',
    //         '\u00d6': 'OE',
    //         '\u00fc': 'ue',
    //         '\u00e4': 'ae',
    //         '\u00f6': 'oe',
    //         '\u00df': 'ss',
    //     };
    //     return str
    //         .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
    //             var big = umlautMap[a.slice(0, 1)];
    //             return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    //         })
    //         .replace(new RegExp('[' + Object.keys(umlautMap).join('|') + ']', "g"),
    //             (a) => umlautMap[a]
    //         );
    // }
    // Replaced for IE11 compatibility
    function replaceUmlaute(str) {
        var umlautMap = {
            '\u00dc': 'UE',
            '\u00c4': 'AE',
            '\u00d6': 'OE',
            '\u00fc': 'ue',
            '\u00e4': 'ae',
            '\u00f6': 'oe',
            '\u00df': 'ss',
        };
        str = str.replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, function (a) {
            var big = umlautMap[a.slice(0, 1)];
            return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
        });
        str = str.replace(new RegExp('[' + Object.keys(umlautMap).join('|') + ']', "g"), function(a) {
            return umlautMap[a]
        });
        return str
    }

    function filterName(str) {
        var filtered = replaceUmlaute(str);
        //return filtered.replace(/\./g, '').replace(/\-/g, '').replace(/\ /g, '').toLowerCase();
        return filtered.toLowerCase().replace(/st\./g, 'sankt').replace(/\./g, '').replace(/-/g, '').replace(/ /g, '');
    }
    // http://www.mredkj.com/javascript/nfbasic.html
    function addCommas(nStr)
    {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        console.log('x1 ', x1);
        var x2 = x.length > 1 ? ',' + x[1] : '';
        console.log('x2 ', x2);
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + '.' + '$2');
        }
        console.log('x1 after regex ', x1);
        return x1 + x2;
    }
    function addSeparatorsNF(nStr, inD='.', outD=',', sep='.')
    {
        nStr += '';
        var dpos = nStr.indexOf(inD);
        var nStrEnd = '';
        if (dpos != -1) {
            nStrEnd = outD + nStr.substring(dpos + 1, nStr.length);
            nStr = nStr.substring(0, dpos);
        }
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(nStr)) {
            nStr = nStr.replace(rgx, '$1' + sep + '$2');
        }
        return nStr + nStrEnd;
    }


    //-----------------------
    // Initialize Leaflet Map
    //-----------------------

    function initMap() {

        // TODO Uncomment after test
        //console.log('initMap');
        //console.log('community_data_map', community_data_map);

        // Add HTML for the Info-Text-Box above the card
        $('#gardenMap').append('<div id="gardenMapInfoBox"/>');

        // Add HTML for the Image-Gallery
        $('#gardenMap').append('<div id="gardenMapGallery"/>');

        // INITIALIZE THE MAP ON AN HTML ELEMENT WITH id="gardenMap"
        // ---------------------------------------------------------
        // var cornerTop = L.latLng(49.009, 9.245),
        //     cornerBottom = L.latLng(46.294, 17.155),
        //     boundary = L.latLngBounds(cornerTop, cornerBottom);
        var cornerTop = L.latLng(49.029, 9.225),
            cornerBottom = L.latLng(46.284, 17.185),
            boundary = L.latLngBounds(cornerTop, cornerBottom);

        gardenMap = L.map('gardenMap', {
            center: [47.564, 13.364],
            zoom: 7,
            maxBounds: boundary,
            // preferCanvas: false,
            // renderer: L.svg(),
        });

        // ADD THE GARDEN-INFO-TEXT-BOX
        // ----------------------------
        showInfoBox();

        // CREATE MAP PANES TO CONTROL THE Z-INDEX AND POINTER EVENTS
        // ----------------------------------------------------------
        // HINT: Map panes where disabled again because the customer did not needed overlays of state and community
        // gardenMap.createPane('statePane');
        // gardenMap.getPane('statePane').style.zIndex = 510;
        // gardenMap.createPane('stateMarkerPane');
        // gardenMap.getPane('stateMarkerPane').style.zIndex = 615;

        // gardenMap.createPane('communityPane');
        // gardenMap.getPane('communityPane').style.zIndex = 520;
        // gardenMap.createPane('communityMarkerPane');
        // gardenMap.getPane('communityMarkerPane').style.zIndex = 625;

        // ADD MAP LAYERS
        // --------------

        // Outer boundary for map-tile loading
        // var tilemapcornerTop = L.latLng(51.0, 5.0),
        //     tilemapcornerBottom = L.latLng(45.0, 21.0),
        //     tilemapboundary = L.latLngBounds(tilemapcornerTop, tilemapcornerBottom);
        var austria_bounds = [[46.35877, 8.782379], [49.037872, 17.189532]];

        // map-tiles-layers
        // HINT: https://leaflet-extras.github.io/leaflet-providers/preview/
        // var nikiTiles = L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: tilemapboundary,
        // });
        // var Hydda_Base = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // });
        // var Hydda_Full = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // });
        // var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        // });
        // var OpenStreetMap_DE = L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // });
        // var Stamen_TerrainBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
        //     attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        //     subdomains: 'abcd',
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     ext: 'png'
        // });
        // var Hydda_RoadsAndLabels = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
        //     maxZoom: 12,
        //     minZoom: 7,
        //     bounds: austria_bounds,
        //     attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // });
        var BasemapAT_highdpi = L.tileLayer('https://maps{s}.wien.gv.at/basemap/bmaphidpi/normal/google3857/{z}/{y}/{x}.{format}', {
            maxZoom: 12,
            minZoom: 7,
            attribution: 'Datenquelle: <a href="https://www.basemap.at">basemap.at</a>',
            subdomains: ["", "1", "2", "3", "4"],
            format: 'jpeg',
            bounds: austria_bounds
        });
        gardenMap.addLayer(BasemapAT_highdpi);
        // gardenMap.addLayer(Hydda_RoadsAndLabels);

        // States GeoJson Layer
        stateLayer = L.geoJson(austriaBG, {
            filter: function(feature, layer) {return feature.properties.rtype === 'bundesland';},
            style: stateStyle,
            onEachFeature: stateOnEachFeature,
            // pane: 'statePane'
        });
        gardenMap.addLayer(stateLayer);

        // stateMarkerLayerGroup Layer Group
        createStateMarkerLayerGroup();
        gardenMap.addLayer(stateMarkerLayerGroup);

        // Communities GeoJson Layer
        // ATTENTION: communityOnEachFeature will also create the "community_data_centers" list
        communityLayer = L.geoJson(austriaBG, {
            filter: function(feature, layer) {return feature.properties.rtype === 'gemeinde';},
            style: communityStyle,
            onEachFeature: communityOnEachFeature,
            // pane: 'communityPane',
        });

        // Order the Community Centers (created in communityOnEachFeature from above)
        community_data_map_centers = dataToMap(community_data_centers, 'community', null);

        // TODO Remove after test
        //console.log('community_data_map_centers', community_data_map_centers);

        // communityMarkerLayerGroup Layer Group
        createCommunityMarkerLayerGroup();

        // HIDE OR SHOW LAYERS AND MARKERS
        // -------------------------------
        gardenMap.on('zoomend', function () {
            var zoomLevel = gardenMap.getZoom();

            // Display states
            if (zoomLevel < 9) {

                // Hide the communities
                if (gardenMap.hasLayer(communityMarkerLayerGroup)) {
                    gardenMap.removeLayer(communityMarkerLayerGroup);
                }
                if (gardenMap.hasLayer(communityLayer)) {
                    gardenMap.removeLayer(communityLayer);
                    // Reset all feature (GeoJson) styles to avoid ghost borders
                    // for (var f in communityLayer._layers) {
                    //     communityLayer.resetStyle(communityLayer._layers[f])
                    // }
                    // Reset layer style of last highlighted feature
                    communityLayer.resetStyle(gardenMapLastHighlightFeature)
                }

                // Add the stateMarkers
                if (!gardenMap.hasLayer(stateLayer)) {
                    gardenMap.addLayer(stateLayer);
                }
                if (!gardenMap.hasLayer(stateMarkerLayerGroup)) {
                    gardenMap.addLayer(stateMarkerLayerGroup);
                }


            // Display communities
            } else if (zoomLevel >= 9) {

                // Remove the stateMarkers
                if (gardenMap.hasLayer(stateLayer)) {
                    gardenMap.removeLayer(stateLayer);
                }
                if (gardenMap.hasLayer(stateMarkerLayerGroup)) {
                    gardenMap.removeLayer(stateMarkerLayerGroup);
                }

                // Display the communities
                if (!gardenMap.hasLayer(communityMarkerLayerGroup)) {
                    gardenMap.addLayer(communityMarkerLayerGroup);
                }
                if (!gardenMap.hasLayer(communityLayer)) {
                    gardenMap.addLayer(communityLayer);
                }
            }
        });
    }


    //--------------------------------------
    // MAP-LAYERS: STYLES, FILTERS, FEATURES
    //--------------------------------------

    // states
    // ------
    function stateStyle(feature) {
        // get opacity from garden data
        var gsp;
        var opacity = 0;
        var fill='#9ee436';
        var featureStateName = filterName(feature.properties.name);
        if (featureStateName in state_data_map) {
            gsp = state_data_map[featureStateName].garden_size_peg;

            if (gsp > 0 && gsp <= 0.15) {
                opacity = 0.3;
                fill = '#9ee436';
            } else if (gsp > 0.15 && gsp <= 0.3 ) {
                opacity = 0.3;
                fill = '#76b837';
            } else if (gsp > 0.3 && gsp <= 0.45 ) {
                opacity = 0.45;
                fill = '#689e18';
            } else if (gsp > 0.45 && gsp <= 0.6 ) {
                opacity = 0.45;
                fill = '#227708';
            } else if (gsp > 0.6 && gsp <= 1 ) {
                opacity = 0.45;
                fill = '#055300';
            }
        }

        return {
            weight: 1,
            opacity: 1,
            color: "#3c3c3b",
            dashArray: "",
            fillOpacity: opacity,
            fillColor: fill,
        };
    }

    function stateOnEachFeature(feature, layer) {
        layer.on({
            // mouseover: highlightFeature,
            // mouseout: resetHighlightState,
            click: zoomToFeature,
        });
    }

    // communities
    // -----------
    function communityStyle(feature) {
        var gsp;
        var opacity = 0;
        var fill='#9ee436';
        var featureCommunityName = filterName(feature.properties.name);
        if (featureCommunityName in community_data_map) {
            gsp = community_data_map[featureCommunityName].garden_size_peg;
            if (gsp > 0 && gsp <= 0.15) {
                opacity = 0.3;
                fill = '#9ee436';
            } else if (gsp > 0.15 && gsp <= 0.3 ) {
                opacity = 0.3;
                fill = '#76b837';
            } else if (gsp > 0.3 && gsp <= 0.45 ) {
                opacity = 0.45;
                fill = '#689e18';
            } else if (gsp > 0.45 && gsp <= 0.6 ) {
                opacity = 0.45;
                fill = '#227708';
            } else if (gsp > 0.6 && gsp <= 1 ) {
                opacity = 0.45;
                fill = '#055300';
            }
        }

        return {
            weight: 1,
            opacity: 0.8,
            color: '#3c3c3b',
            dashArray: "4",
            fillOpacity: opacity,
            fillColor: fill,
        };
    }

    function communityOnEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlightCommunity,
            click: zoomToFeature,
        });

        // Use the OnEachFeature loop to create the "community_data_centers" dict
        // ATTENTION: It is not very good style to do this here - should be moved outside later on!
        var community_map_name_filtered = filterName(feature.properties.name);

        if (community_map_name_filtered in community_data_map) {
                var singleObj = {};
                singleObj['community'] = community_map_name_filtered;
                singleObj['center'] = layer.getBounds().getCenter();
                community_data_centers.push(singleObj);
        }

    }

    // onEachFeature called functions
    // ------------------------------

    function highlightFeature(e) {
        if (gardenMapGalleryActive === true) {
            return;
        }

        // If state feature highlightin is enabled again you may need to
        // add two mehtods for highlightFeature e.g. highlightFeatureState and highlightFeatureCommunity
        gardenMapLastHighlightFeature = e.target;
        gardenMapLastHighlightFeature.setStyle({
            weight: 2,
            color: "#37493a",
            opacity: 1,
            dashArray: "",
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            gardenMapLastHighlightFeature.bringToFront();
        }
    }

    function resetHighlightState(e) {
        if (gardenMapGalleryActive === true) {
            return;
        }
        stateLayer.resetStyle(e.target);
    }
    function resetHighlightCommunity(e) {
        if (gardenMapGalleryActive === true) {
            return;
        }
        communityLayer.resetStyle(e.target);
    }
    function zoomToFeature(e) {
        if (gardenMapGalleryActive === true) {
            return;
        }
        gardenMap.fitBounds(e.target.getBounds());
    }


    //--------
    // MARKER
    //--------

    // Create State Markers Layer Group
    // --------------------------------
    function createStateMarkerLayerGroup() {
        // console.log('createStateMarkerLayerGroup');

        var stateCenters = {
            'oberoesterreich': [48.2500000, 14.0000000],    //ooe
            'niederoesterreich': [48.2817813, 15.7632457],  //noe
            'wien': [48.2083537, 16.3725042],               //vie
            'burgenland': [47.5000001, 16.4166666],         //bgl
            'steiermark': [47.2500001, 15.1666665],         //stmk
            'kaernten': [46.7500001, 13.8333333],           //car
            'salzburg': [47.4166667, 13.2500000],           //sal
            'tirol': [47.2231930, 11.5261028],              //tir
            'vorarlberg': [47.2500000, 9.9166667],          //vor
        };

        // Generate a list of state markers
        var stateMarkers = [];
        for (var stateName in state_data_map) {
            if (state_data_map[stateName].thumbnail_record_ids) {
                if (stateName in stateCenters) {
                    // create a new marker
                    var marker = L.marker(stateCenters[stateName], {
                        icon: L.divIcon({
                            html: '<img id="' + state_data_map[stateName].cmp_state_id + " bundesland" + '" class="gardenMapMarkerIcon" src="/gl2k_gardenvis/static/src/img/CameraIcon.png" onclick="showGardenMapGallery(this)">',
                        }),
                    });
                    // add it to the list
                    stateMarkers.push(marker)
                }
                else {
                    console.log('Missing state in stateCenters! ', stateName)
                }
            }
        }

        // Add the markers to the stateMarkerLayerGroup
        stateMarkerLayerGroup = L.layerGroup(stateMarkers, {
            // pane: 'statePane'
        });

    }

    // Create Community Markers Layer Group
    // ------------------------------------
    function createCommunityMarkerLayerGroup() {
        // console.log('createCommunityMarkerLayerGroup');

        // Generate a list of community markers
        var communityMarkers = [];

        // Check if every odoo garden record can be matched to a community on the map
        for (var cName in community_data_map) {
            // Compute the Center
            try {
                // Get all odoo data of the community record
                var community = community_data_map[cName];

                // Check if we found the community center on the map for this filtered community name
                // HINT: If not found in "communityOnEachFeature" it is most likely a name mismatch between the map-community-name and the community name in odoo!
                var communityCenter = community_data_map_centers[cName].center;
            }
            catch (e) {
                // Log error to console
                try {
                    console.log('Community Center Error for: ' + cName);
                }
                catch (e) {
                    console.log('Community Center Error');
                }
                // Continue with next record
                continue;
            }

            // Generate the marker
            try {
                if (community.thumbnail_record_ids) {
                    // create a new marker
                    var marker = L.marker(communityCenter, {
                        icon: L.divIcon({
                            html: '<div class="gardenMapCommunityMaker"><div class="gardenMapCommunityMakerOuter"><img id="' + community.cmp_community_code + " gemeinde" + '" class="gardenMapCommunityMakerImg" src="/gl2k_gardenvis/static/src/img/CameraIcon.png" onclick="showGardenMapGallery(this)"><p class="gardenMapCommunityMakerText">' + addSeparatorsNF(community.garden_size) + ' m²</p></div></div>',
                        })
                    });
                } else {
                    var marker = L.marker(communityCenter, {
                        icon: L.divIcon({
                            html: '<div class="gardenMapCommunityMaker"><div class="gardenMapCommunityMakerOuter"><p class="gardenMapCommunityMakerText">' + addSeparatorsNF(community.garden_size) + ' m²</p></div></div>',
                        })
                    });
                }
                // add it to the list
                communityMarkers.push(marker);
            }
            catch (e) {
                // Log error to console
                try {
                    console.log('Community Marker Error: ' + cName);
                }
                catch (e) {
                    console.log('Community Marker Error');
                }
                // Continue with next record
                continue;
            }
        }

        // Add the markers to the communityMarkerLayerGroup
        communityMarkerLayerGroup = L.layerGroup(communityMarkers, {
            // pane: 'communityPane'
        });
    }

    //------------------
    // GARDENMAP INFOBOX
    //------------------
    function showInfoBox() {
        var maxGardenSize = 0;
        for (var i = 0; i < state_data[0].length; i++) {
            maxGardenSize = maxGardenSize + state_data[0][i].garden_size;

        }
        // console.log('maxGardenSize ', maxGardenSize);
        maxGardenSize = Math.floor(maxGardenSize);
        maxGardenSize = addSeparatorsNF(maxGardenSize);
        $("#gardenMapInfoBox").wrapInner("<div class='totalgardensize'><img class='gardenMapInfoBoxBg' src='/gl2k_gardenvis/static/src/img/Zaehler-3.png'/><p class='gardenMapInfoBoxText'>" + maxGardenSize + " m²</p></div>");
    }

});
