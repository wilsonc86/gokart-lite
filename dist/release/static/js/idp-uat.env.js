var env = {
    envType:"local",
    envVersion:"2018-01-11 11:23",

    cswService:"https://oim.dbca.wa.gov.au/catalogue/api/records/",

    wmtsService:"https://kmi.dbca.wa.gov.au/geoserver/gwc/service/wmts",
    wmsService:"https://kmi.dbca.wa.gov.au/geoserver/wms",
    wfsService:"https://kmi.dbca.wa.gov.au/geoserver/wfs",
    legendSrc:"https://kmi.dbca.wa.gov.au/geoserver/gwc/service/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&legend_options=fontName:Times%20New%20Roman;fontAntiAliasing:true;fontSize:14;bgColor:0xFFFFEE;dpi:120;labelMargin:10&LAYER=",


    map: {
        crs:"EPSG:4326",
        center:[-24.862060546875,116.60888671875 ],
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
    //zindex under 100 are reserved
    layers:[{
        id:"cddp:state_map_base",
        type:"tileLayer",
        base:true,
        options:{
        }
    },{
        id:"cddp:annual_indicative_burn_program",
        type:"tileLayer",
        base:true,
        options:{
        }
    }]
    
};

