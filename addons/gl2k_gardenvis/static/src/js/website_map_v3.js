/// <reference path='/austria_data/bundeslaender_und_gemeinden.js'/>

var state_data_glo = [];
var community_data_glo = [];
var gardenMap;


$(document).ready(function () {
    'use strict';

    // Add HTML for the Info-Text-Box above the card
    $('#gardenMap').append('<div id="gardenMapInfoBox"/>');

    // Add HTML for the Image-Gallery
    $('#gardenMap').append('<div id="gardenMapGallery"/>');


    //---------
    // Get Data
    //---------

    // Initialize empty variables to hold the data from the controller
    var state_data = null;
    var community_data = null;
    var galleryData;

    // Get all data from the /gl2k/garden/data json-controller
    try {
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
                community_data = data.result.community_data;
                state_data_glo = data.result.state_data[0];
                community_data_glo = data.result.community_data[0];
                initMap();
            }
        });

    // request exception
    } catch (error) {
        console.log('Exception on getting data from /gl2k/garden/data ! ', error);
        return;
    }


    //-----------------------
    // Initialize Leaflet Map
    //-----------------------

    function initMap() {

        // Boundry box for Austria
        var cornerTop = L.latLng(49.009, 9.245),
            cornerBottom = L.latLng(46.294, 17.155),
            boundary = L.latLngBounds(cornerTop, cornerBottom);

        // Outer boundry for map-tile loading
        var maxcornerTop = L.latLng(50.009, 10.245),
            maxcornerBottom = L.latLng(45.294, 16.155),
            maxboundary = L.latLngBounds(maxcornerTop, maxcornerBottom);

        // INITIALIZE THE MAP ON AN HTML ELEMENT WITH id="gardenMap"
        gardenMap = L.map('gardenMap', {
            center: [47.564, 13.364],
            zoom: 7,
            maxBounds: boundary,
        });

        // ADD THE GARDEN-INFO-TEXT-BOX
        // ----------------------------
        showInfoBox();

        // ADD MAP LAYERS
        // --------------

        // Layer: Map Tiles
        L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            maxZoom: 20,
            minZoom: 7,
            //bounds: boundary,
        }).addTo(gardenMap);

        // Layer: States and State Markers
        geoAustriaState = L.geoJson(austriaBG, {
            filter: stateFilter,
            style: stateStyle,
            onEachFeature: stateOnEachFeature
        });
        gardenMap.addLayer(geoAustriaState);
        addMarkerState();

        // Layer: Communities
        geoAustriaCommunities = L.geoJson(austriaBG, {
            filter: communityFilter,
            style: communityStyle,
            onEachFeature: communityOnEachFeature
        });

        // TODO: the communityFilter and styleCommunity Methods should display the state borders also!
        // addGeoJsonBorder();

        // HIDE OR SHOW LAYERS AND MARKERS
        // -------------------------------
        gardenMap.on('zoomend', function () {
            var zoomLevel = gardenMap.getZoom();

            // Display states
            if (zoomLevel < 10) {
                // Hide the communities
                gardenMap.removeLayer(geoAustriaCommunities);
                removeMarkerCommunity();
                // Display the states
                gardenMap.addLayer(geoAustriaState);
                addMarkerState();

            // Display communities
            } else if (zoomLevel >= 10) {
                // Hide the states
                gardenMap.removeLayer(geoAustriaState);
                removeMarkerState();
                // Display the communities
                // TODO: rest highlight of all features
                gardenMap.addLayer(geoAustriaCommunities);
                addMarkerCommunity();
            }
        });
    }


    //----------------------------------------
    // MAP-LAYERS STYLES, FILTERS and FEATURES
    //----------------------------------------

    // states
    // ------
    function stateFilter(feature) {
        if (feature.properties.rtype === 'bundesland') {
            setArea(feature);
            return true;
        }
    }

    function stateStyle(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: "black",
            dashArray: "3",
            fillOpacity: feature.properties.opacityValue,
            fillColor: '#006d2c',
        };
    }

    function stateOnEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature,
        });
    }

    // communities
    // -----------
    function communityFilter(feature) {
        if (feature.properties.rtype === 'gemeinde') {
            setArea(feature);
            return true;
        }
    }

    function communityStyle(feature) {
        return {
            weight: 1,
            opacity: 1,
            color: "grey",
            dashArray: "1",
            fillOpacity: feature.properties.opacityValue,
            fillColor: '#006d2c',
        };
    }

    function communityOnEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlightCommunity,
            click: zoomToFeatureCommunity,
        });
    }



    // Helper Methods
    // --------------
    function setArea(feature) {
        var gardenSizePeg, nameGeo, nameData;

        // Default opacity
        gardenSizePeg = 0;

        if (feature.properties.rtype === 'bundesland') {
            for (var i = 0; i < state_data[0].length; i++) {
                nameData = filterName(state_data[0][i].cmp_state);
                nameGeo = filterName(feature.properties.name);
                if (nameGeo === nameData) {
                    gardenSizePeg = state_data[0][i].garden_size_peg;
                }
            }

        } else if (feature.properties.rtype === 'gemeinde') {
            for (var n = 0; n < community_data[0].length; n++) {
                nameData = filterName(community_data[0][n].cmp_community);
                nameGeo = filterName(feature.properties.name);
                if (nameGeo === nameData) {
                    gardenSizePeg = community_data[0][n].garden_size_peg;
                }
            }
        }

        feature.properties.opacityValue = gardenSizePeg;
    }


    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: "#666",
            dashArray: "",
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }











//-----------------------------------------------------------------------------------
// GeoJson








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
        return str
            .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
                var big = umlautMap[a.slice(0, 1)];
                return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
            })
            .replace(new RegExp('[' + Object.keys(umlautMap).join('|') + ']', "g"),
                (a) => umlautMap[a]
            );
    }

    function filterName(str) {
        var filtered = replaceUmlaute(str);
        return filtered.replace(/\./g, '').replace(/\-/g, '').replace(/\ /g, '').toLowerCase();
    }

    function resetArea(feature) {
        feature.properties.aream2 = 0.0;
    }



    var geoAustriaState, geoAustriaBorder, geoAustriaCommunities;

    function resetHighlight(e) {
        geoAustriaState.resetStyle(e.target);
    }

    function resetHighlightCommunity(e) {
        geoAustriaCommunities.resetStyle(e.target);
    }

    function zoomToFeature(e) {
        gardenMap.fitBounds(e.target.getBounds());
        gardenMap.removeLayer(geoAustriaState);
        removeMarkerState();
        gardenMap.addLayer(geoAustriaCommunities);
    }

    function zoomToFeatureCommunity(e) {
        gardenMap.fitBounds(e.target.getBounds());
    }








    function addGeoJsonCommunity() {
        geoAustriaCommunities = L.geoJson(austriaBG, {
            filter: communityFilter,
            style: styleCommunity,
            onEachFeature: onEachFeatureCommunity
        });
    }

    function addGeoJsonState() {
        geoAustriaState = L.geoJson(austriaBG, {
            filter: stateFilter,
            style: style,
            onEachFeature: onEachFeatureState
        }).addTo(gardenMap);
    }

//    function addGeoJsonBorder() {
//        geoAustriaBorder = L.geoJson(austriaBG, {
//            filter: stateFilter,
//            style: {
//                weight: 2,
//                opacity: 1,
//                color: "red",
//                dashArray: "3",
//                fillColor: "transparent",
//            },
//        }).addTo(gardenMap);
//    }


//-----------------------------------------------------------------------------------
// Marker
    var stateMarker = new Array();
    var communityMarker = new Array();

    function addMarkerState() {

        var stateCenter = [['oberoesterreich', 48.2500000, 14.0000000],  //ooe
            ['niederoesterreich', 48.2817813, 15.7632457],  //noe
            ['wien', 48.2083537, 16.3725042],  //vie
            ['burgenland', 47.5000001, 16.4166666],  //bgl
            ['steiermark', 47.2500001, 15.1666665],  //stmk
            ['kaernten', 46.7500001, 13.8333333],  //car
            ['salzburg', 47.4166667, 13.2500000],  //sal
            ['tirol', 47.2231930, 11.5261028],  //tir
            ['vorarlberg', 47.2500000, 9.9166667]];  //vor

        // console.log(state_data);
        var cnt = 0;
        for (var j = 0; j < state_data[0].length; j++) {
            if (state_data[0][j].thumbnail_record_ids) {
                for (var i = 0; i < stateCenter.length; i++) {
                    if (stateCenter[i][0] === filterName(state_data[0][j].cmp_state)) {
                        var marker = L.marker([stateCenter[i][1], stateCenter[i][2]], {
                            icon: L.divIcon({
                                //                            html: '<i id="' + state_data[0][j].cmp_state_id + '" class="fa fa-picture-o iconState" onclick="showGallery()"></i>',
                                html: '<img id="' + state_data[0][j].cmp_state_id + " bundesland" + '" class="gardenMapIcon" src="/gl2k_gardenvis/static/src/img/camera.png" onclick="showGallery(this)">',
                            })
                            //                        icon: L.icon({
                            //                            iconUrl: '/gl2k_gardenvis/static/src/img/camera.png',
                            //                            iconSize: [40, 40],
                            //                        })
                        });
                        stateMarker.push(marker);
                        gardenMap.addLayer(stateMarker[cnt]);
                        cnt++;
                    }
                }
            }
        }
    }

    function removeMarkerState() {
        for (var i = 0; i < stateMarker.length; i++) {
            gardenMap.removeLayer(stateMarker[i]);
        }
    }

    function addMarkerCommunity() {
        var communityCenter = [];

        var cnt = 0;
        for (var i = 0; i < community_data[0].length; i++) {
            if (community_data[0][i].thumbnail_record_ids) {
                communityCenter = [parseFloat(community_data[0][i].latitude), parseFloat(community_data[0][i].longitude)];
                var marker = L.marker(communityCenter, {
                    icon: L.divIcon({
                        //                    html: '<i id="' + community_data[0][i].cmp_community_code + '" class="fa fa-picture-o iconState" onclick="showGallery()"></i>',
                        html: '<p class="gardenMapCommunityM2">' + community_data[0][i].garden_size + '</p><img id="' + community_data[0][i].cmp_community_code + " gemeinde" + '" class="gardenMapIcon" src="/gl2k_gardenvis/static/src/img/camera.png" onclick="showGallery(this)">',
                    })
                });
                communityMarker.push(marker);
                gardenMap.addLayer(communityMarker[cnt]);
                cnt++;
            }
        }

    }

    function removeMarkerCommunity() {
        for (var i = 0; i < communityMarker.length; i++) {
            gardenMap.removeLayer(communityMarker[i]);
        }
    }

//-----------------------------------------------------------------------------------
// GardenMap Infobox
    function showInfoBox() {
        var maxGardenSize = 0;
        for (var i = 0; i < state_data[0].length; i++) {
            maxGardenSize = maxGardenSize + state_data[0][i].garden_size;
        }
        $("#gardenMapInfoBox").wrapInner("<p class='totalgardensize'>" + maxGardenSize + " m²</p>" +
            "<p>Nationalpark in<br/>Österreichs Gärten");
    }
});

//-----------------------------------------------------------------------------------
// GardenMap Gallery
function showGallery(e) {

    // Disable Map Controls
    gardenMap.dragging.disable();
    gardenMap.touchZoom.disable();
    gardenMap.doubleClickZoom.disable();
    gardenMap.scrollWheelZoom.disable();

    var callerID = parseInt(e.id.replace(/[a-z]/g, "").replace(/\ /g, ''));
    var callerIDName = e.id.replace(/[0-9]/g, "").replace(/\ /g, '');

    if (callerIDName === 'bundesland') {
        for (var i = 0; i < state_data_glo.length; i++) {
            if (callerID === state_data_glo[i].cmp_state_id) {
                galleryData = state_data_glo[i];
            }
        }
    } else if (callerIDName === 'gemeinde') {
        for (var i = 0; i < community_data_glo.length; i++) {
            if (String(callerID) === community_data_glo[i].cmp_community_code) {
                galleryData = community_data_glo[i];
            }
        }
    }

    var gallery = $('#gardenMapGallery');

    gallery.wrapInner('<div id="gardenMapModal" class="gardenModal">' +
        '<img class="closeBtnGardenMap" src="/gl2k_gardenvis/static/src/img/close.png" onclick="closeGallery()"/>' +
        '<img class="moveBtnGardenMapPrev" src="/gl2k_gardenvis/static/src/img/arrow-left.png" onclick="moveImg(-1)"/>' +
        '<img class="moveBtnGardenMapNext" src="/gl2k_gardenvis/static/src/img/arrow-right.png" onclick="moveImg(1)"/>' +
        '<div class="gardenMapModalContent">' +
        '<div class="gardenMapFrontImageContainer">' +
        '<img id="gardenMapFrontImage" src="/website/image/gl2k.garden/' + galleryData.thumbnail_record_ids[0] + '/cmp_image_file">' +
        '</div>' +
        '</div>');

    insertThumbnail(galleryData);
//    console.log(document.getElementById('gardenMapFrontImage'));

    //document.getElementById('gardenMap').style.display = "none";
    document.getElementById('gardenMapGallery').style.display = "block";
}

function closeGallery() {
    // Enable map Control
    gardenMap.dragging.enable();
    gardenMap.touchZoom.enable();
    gardenMap.doubleClickZoom.enable();
    gardenMap.scrollWheelZoom.enable();

    $('#gardenMapModal').remove();
    document.getElementById('gardenMapGallery').style.display = "none";
    document.getElementById('gardenMap').style.display = "block";
}

function insertThumbnail(galleryData) {
    var galleryModal = $('#gardenMapModal');

    for (var i = 0; i < galleryData.thumbnail_record_ids.length; i++) {
        galleryModal.append('<div class="gardenMapColumn">' +
            '<img class="gardenMapThumbnail" src="/website/image/gl2k.garden/' + galleryData.thumbnail_record_ids[i] + '/cmp_thumbnail_file " onclick="selectImg(' + galleryData.thumbnail_record_ids[i] + ')"/>' +
            '</div>');
    }
}


var slideIndex = 1;

function moveImg(n) {
    (slideIndex += n);
    if ((slideIndex < galleryData.thumbnail_record_ids.length) && (slideIndex > 0)) {

    } else if (slideIndex < 0) {
        slideIndex = galleryData.thumbnail_record_ids.length - 1;
    } else {
        slideIndex = 0
    }
    selectImg(galleryData.thumbnail_record_ids[slideIndex]);
}

function selectImg(id) {
    var frontImage = document.getElementById('gardenMapFrontImage');
    frontImage.src = '/website/image/gl2k.garden/' + id + '/cmp_image_file';
//    frontImage.parentElement.style.display = 'block';
    console.log(frontImage);
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    var gardenGallery = $('#gardenMapGallery');
    if (event.target == gardenGallery) {
        closeGallery();
    }
};
