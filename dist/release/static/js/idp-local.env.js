//indicative burning program
var env = {
    envType:"local",
    envVersion:"2018-01-11 11:23",

    cswService:"https://oim.dbca.wa.gov.au/catalogue/api/records/",

    wmtsService:"https://kmi.dbca.wa.gov.au/geoserver/gwc/service/wmts",
    wmsService:"https://kmi.dbca.wa.gov.au/geoserver/wms",
    wfsService:"https://kmi.dbca.wa.gov.au/geoserver/wfs",
    legendSrc:"https://kmi.dbca.wa.gov.au/geoserver/gwc/service/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&legend_options=fontName:Times%20New%20Roman;fontAntiAliasing:true;fontSize:14;bgColor:0xFFFFEE;dpi:120;labelMargin:10&LAYER=",


    app:"idp",
    cswApp:"idp",

    map: {
        crs:"EPSG:4326",
        center:[-24.862060546874,116.60888671875 ],
        zoom:4,
        minZoom:4,
        maxZoom:18,
        maxBounds:[[-45,108],[-10,155]],
    
        zoomControl:true,
        attributionControl:true,
    
        zoomSnap:1,
        zoomDelta:1,
        traceResize:true,
        boxZoom:true,
        doubleClickZoom:true,
        dragging:true,
    
        zoomAnimation:true,
        zoomAnimationThreshold:4,
        fadeAnimation:true,
        markerZoomAnimation:true,
    
        keyboard:true,
        keyboardPanDelta:80
    },

    //layerType: three types: baselayer, overlayer,toplayer
    //base layer always has zindex 1, only one base layer can be shown on map
    //overlayer are layers between base layer and top layer
    //  all overlayers loaded from csw but not configured in environment file have zindex 2
    //  all overlayers cofigured in environment but without configured a correct zindex will receive a zindex from 3 to 100, based on configure order.
    //  all overlayers configure in enviromment with a valid zindex between 100 to 1000, will receive the configured index
    //toplayer are layers on the top, always has zindex 1000, only one top layer can be shown on map, user can click on the map to get the detail information of the related feature
    layers:[{
        id:"cddp:state_map_base",
        serviceType:"WMTS",
        layerType:"baselayer",
        options:{
        }
    },{
        id:"cddp:annual_indicative_burn_program",
        type:"WMTS",
        layerType:"toplayer",
        geometryType:"polygon",
        geometryColumn:" wkb_geometry",
        options:{
        }
    }],
    //configuration for feature info popup
    featureInfoPopup:{
        options:{
        }
    }
    
};

