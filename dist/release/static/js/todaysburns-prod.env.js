//today's burns
var todaysburnsEnv = {
    title:"Today's Burns",

    whoamiUrl:"/sso/profile",

    gokartService:"https://ssslite.dpaw.wa.gov.au",

    cswService:"https://csw.dpaw.wa.gov.au/catalogue/api/records/",

    wmtsService:"https://kmi.dpaw.wa.gov.au/geoserver/gwc/service/wmts",
    wmsService:"https://kmi.dpaw.wa.gov.au/geoserver/wms",
    wfsService:"https://kmi.dpaw.wa.gov.au/geoserver/wfs",

    publicWmtsService:"https://kmi.dpaw.wa.gov.au/geoserver/public/gwc/service/wmts",

    app:"todaysburns",
    cswApp:"todaysburns",

    map: {
        crs:"EPSG:4326",
        center:[-31.95296,115.86067 ],
        minZoom:2,
        maxZoom:17,
        maxBounds:[[-36,112.6],[-13,129.1]],
        bounds:[[-36,112.6],[-13,129.1]],
    
        zoomControl:true,
        attributionControl:false,
        scaleControl:false,
        fullpageControl:false,
        featureCountControl:true,
        layerMetadataControl:true,
    
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

    getNextCheckDatetime : function(topLayer) {
        var now = new Date()
        if (topLayer._id === "public:todays_burns") {
            if ((!topLayer.addTime || new Date() - topLayer.addTime <= 600000) && (todaysburnsEnv._yesterdaysburnsShown || now.getHours() < 9 )) {
                return Gokart.utils.getNextDatetime(2,'minute') 
            } if ((!topLayer.addTime || new Date() - topLayer.addTime <= 1800000) && (todaysburnsEnv._yesterdaysburnsShown || now.getHours() < 10 )) {
                return Gokart.utils.getNextDatetime(5,'minute') 
            } else if ((!topLayer.addTime || new Date() - topLayer.addTime <= 3600000) && (todaysburnsEnv._yesterdaysburnsShown || now.getHours() < 11 )) {
                return Gokart.utils.getNextDatetime(10,'minute') 
            } else {
                var d = Gokart.utils.getNextDatetime(1,'day')
                d.setMinutes(d.getMinutes() + 5)
                return d
            }
        } else {
            todaysburnsEnv._yesterdaysburnsShown = true
            if (now.getHours() < 7) {
                return Gokart.utils.getNextDatetime(7,'hour',now) 
            } else if (now.getHours() < 11) {
                return Gokart.utils.getNextDatetime(2,'minute')
            } else if (now.getHours() < 15) {
                return Gokart.utils.getNextDatetime(10,'minute') 
            } else {
                return Gokart.utils.getNextDatetime(1,'day')
            }
        }
    },

    //layerType: three types: baselayer, overlayer,toplayer
    //base layer always has zindex 1, only one base layer can be shown on map
    //overlayer are layers between base layer and top layer
    //  all overlayers loaded from csw but not configured in environment file have zindex 2
    //  all overlayers cofigured in environment but without configured a correct zindex will receive a zindex from 3 to 100, based on configure order.
    //  all overlayers configure in enviromment with a valid zindex between 100 to 1000, will receive the configured zindex
    //toplayer are layers on the top, always has zindex 1000, only one top layer can be shown on map, user can click on the map to get the detail information of the related feature
    layers:[{
        id:"public:mapbox-streets",
        serviceType:"WMTS",
        layerType:"baselayer",
        options:{
        }
    },{
        id:"public:todays_burns",
        type:"WMTS",
        layerType:"toplayer",
        geometryType:"polygon",
        geometryColumn:" wkb_geometry",
        options:{
            style:"public:todays_burns.ShowPinpoint"
        },
        //metadata:"<div style='color:#2a044e;font-weight:bold;font-size:16px'>Today's Burns</div>",
        show:function(callback) {//add,refresh,wait,update,null
            var vm = this
            this.getFeatureCount(true,function(featureCount,previousFeatureCount) {
                if (featureCount === 0) {
                    callback(null)
                } else if (!vm.isAdded()) {
                    callback('add',todaysburnsEnv.getNextCheckDatetime(vm))
                } else if (previousFeatureCount === featureCount) {
                    //not changed
                    callback('wait',todaysburnsEnv.getNextCheckDatetime(vm))
                } else {
                    //changed
                    callback('refresh',todaysburnsEnv.getNextCheckDatetime(vm))
                }
            })
        },
        featureInfo:{
            highlight:true,
            buttons:["clear"],
            tryMinZoom:6,
            tryBuffers:10,
            //used in the first time to fetch the features, default is 1 for polygon ,10 for others
            buffer:1, 
            popup_options:{
                minWidth:400,
                maxWidth:450
            },
            style:{
                stroke:true,
                color:"#ff0000",
                weight:3,
                opacity:1,
                fill:true,
                fillColor:"ff0000",
                fillOpacity:0.3
            },
            excluded_properties:["burn_target_date_raw","forest_blocks"],
            properties:[
                {name:"burn_stat",title:"Burn Status"},
                {name:"burn_target_date",title:"Updated On"},
                {name:"indicative_area",title:"Indicative Area (ha)",precision:0},
                {name:"burn_planned_area_today",title:"Burn Planned Area Today (ha)",precision:2},
                {name:"burn_planned_distance_today",title:"Burn Planned Distance Today (km)",precision:2}
            ]
        },
        featureCountControl:{
            options:{
                html:"<div style='color:#2a044e;font-weight:bold;font-size:18px'>Total Today's Burn: <span id='todaysburns_count'></span> </div>",
                featurecount_id : "todaysburns_count"
            }
        }
    },{
        id:"public:yesterdays_burns",
        type:"WMTS",
        layerType:"toplayer",
        geometryType:"polygon",
        geometryColumn:" wkb_geometry",
        options:{
            style:"public:yesterdays_burns.ShowPinpoint"
        },
        metadata:"<div style='color:#2a044e;font-weight:bold;font-size:16px'>Today's burns not yet approved or no burning today</div>",
        show:function(callback) {//add,refresh,wait,update,null
            if (this.isAdded()) {
                if (this.refreshTime.getDate() === new Date().getDate()) {
                    //same day
                    callback('wait',todaysburnsEnv.getNextCheckDatetime(this))
                } else {
                    //different day
                    callback('update',todaysburnsEnv.getNextCheckDatetime(this))
                }
            } else {
                callback('add',todaysburnsEnv.getNextCheckDatetime(this))
            }
        },
        featureInfo:{
            highlight:true,
            buttons:["clear"],
            tryMinZoom:6,
            tryBuffers:10,
            //used in the first time to fetch the features, default is 1 for polygon ,10 for others
            buffer:1, 
            popup_options:{
                minWidth:400,
                maxWidth:450
            },
            style:{
                stroke:true,
                color:"#ff0000",
                weight:3,
                opacity:1,
                fill:true,
                fillColor:"ff0000",
                fillOpacity:0.3
            },
            excluded_properties:["burn_target_date_raw","forest_blocks"],
            properties:[
                {name:"burn_stat",title:"Burn Status"},
                {name:"burn_target_date",title:"Updated On"},
                {name:"indicative_area",title:"Indicative Area (ha)",precision:0},
                {name:"burn_planned_area_today",title:"Burn Planned Area Today (ha)",precision:2},
                {name:"burn_planned_distance_today",title:"Burn Planned Distance Today (km)",precision:2}
            ]
        },
        featureCountControl:{
            options:{
                html:"<div style='color:#2a044e;font-weight:bold;font-size:18px'>Total Yesterday's Burn: <span id='yesterdaysburns_count'></span> </div>",
                featurecount_id : "yesterdaysburns_count"
            }
        }
    }],
    //configuration for feature info popup
    featureInfoPopup:{
        options:{
        }
    },
    fullpageControl: {
        options:{
        }
    },
    featureCountControl:{
        options:{
        }
    },
    layerMetadataControl: {
        options:{
        }
    },
    
};

