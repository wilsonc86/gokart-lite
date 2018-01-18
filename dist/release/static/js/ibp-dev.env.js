//indicative burning program
var gokartEnv = {
    envType:"dev",
    envVersion:"2018-01-11 11:23",

    gokartService:"https://ssslite-dev.dpaw.wa.gov.au",

    cswService:"https://oim.dpaw.wa.gov.au/catalogue/api/records/",

    wmtsService:"https://kmi.dpaw.wa.gov.au/geoserver/gwc/service/wmts",
    wmsService:"https://kmi.dpaw.wa.gov.au/geoserver/wms",
    wfsService:"https://kmi.dpaw.wa.gov.au/geoserver/wfs",

    app:"ibp",
    cswApp:"ibp",

    map: {
        crs:"EPSG:4326",
        center:[-24.862060546874,116.60888671875 ],
        zoom:2,
        minZoom:2,
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
        },
        featureInfo:{
            highlight:true,
            style:{
                stroke:true,
                color:"#ff0000",
                weight:3,
                opacity:1,
                fill:true,
                fillColor:"ff0000",
                fillOpacity:0.3
            },
            properties:["burnid","region","district","location","priority","purpose_1","program","area_ha","perim_km"]
        }
    }],
    //configuration for feature info popup
    featureInfoPopup:{
        options:{
        }
    }
    
};

