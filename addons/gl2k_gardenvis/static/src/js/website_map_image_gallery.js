// -----------------
// GardenMap Gallery
// -----------------

// Variable to disable click Events while Gallery is active
var gardenMapGalleryActive = false;

// Set fotorama default values
var fotoramaDefaults = {
    auto: false,                //if true automatically loads fotorama
    width: 700,
    maxwidth: '100%',
    ratio: 16/9,
    allowfullscreen: false,
    nav: 'thumbs',
    arrows: true,
    click: true,
    swipe: true,
};

// Try to creat the Gallery
// --------------------------------
function showGardenMapGallery(e) {
    try {
        _showGardenMapGallery(e)
    } catch (e) {
        console.log('Exception on showGardenMapGallery! ', e);
        closeGardenMapGallery()
    }
}

// Creation of the Gallery
// --------------------------------
function _showGardenMapGallery(e) {
    // Disable Map Controls
    gardenMap.dragging.disable();
    gardenMap.touchZoom.disable();
    gardenMap.doubleClickZoom.disable();
    gardenMap.scrollWheelZoom.disable();
    gardenMap.boxZoom.disable();
    // $(".leaflet-control-zoom").css("visibility", "hidden");
    gardenMapGalleryActive = true;

    var callerID = parseInt(e.id.replace(/[a-z]/g, "").replace(/\ /g, ''));
    var callerIDName = e.id.replace(/[0-9]/g, "").replace(/\ /g, '');
    var locationName;

    if (callerIDName === 'bundesland') {
        for (var i = 0; i < state_data_glo.length; i++) {
            if (callerID === state_data_glo[i].cmp_state_id) {
                gardenMapGalleryData = state_data_glo[i];
                locationName = state_data_glo[i].cmp_state;
            }
        }
    } else if (callerIDName === 'gemeinde') {
        for (var i = 0; i < community_data_glo.length; i++) {
            if (String(callerID) === community_data_glo[i].cmp_community_code) {
                gardenMapGalleryData = community_data_glo[i];
                locationName = community_data_glo[i].cmp_community;
            }
        }
    }

    var gallery = $('#gardenMapGallery');

    // Generation of Gallery
    gallery.wrapInner('<div id="gardenMapModal" class="gardenModal">' +
        '<p id="gardenMapLocationId">' + locationName + '</p>' +
        '<img class="closeBtnGardenMap" src="/gl2k_gardenvis/static/src/img/close.png" onclick="closeGardenMapGallery()"/>' +
        '<div id="gardenMapFotorama" class="fotorama">' +
        '</div>' +
        '</div>');

    var fotoramaData = insertGardenMapThumbnail(gardenMapGalleryData.thumbnail_record_ids);
    document.getElementById('gardenMapGallery').style.display = "block";
    $('.fotorama').fotorama({
        data: fotoramaData
    });
}

// Closure/Deletion of current Gallery
// -----------------------------------
function closeGardenMapGallery() {
    // Enable map Control
    gardenMap.dragging.enable();
    gardenMap.touchZoom.enable();
    gardenMap.doubleClickZoom.enable();
    gardenMap.scrollWheelZoom.enable();
    gardenMap.boxZoom.enable();
    // $(".leaflet-control-zoom").css("visibility", "block");
    gardenMapGalleryActive = false;

    $('#gardenMapModal').remove();
    document.getElementById('gardenMapGallery').style.display = "none";
    // document.getElementById('gardenMap').style.display = "block";
}

// Create Image/Thumbnail Data for fotorama
// ----------------------------------------
function insertGardenMapThumbnail(gardenMapGalleryData) {
    var galleryData = [];
    gardenMapGalleryData.forEach(function(entry) {
        var singleObj = {};
        singleObj['img'] = '/website/image/gl2k.garden/' + entry + '/cmp_image_file';
        singleObj['thumb'] = '/website/image/gl2k.garden/' + entry + '/cmp_thumbnail_file';
        galleryData.push(singleObj);
    });
    return galleryData;
}
