import ol from "openlayers";
import proj4 from "proj4";
import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;
let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");

import * as utils from "./utils.js";
import * as common from "./common.js";
import {GeoLocation} from "./ol/geolocation.js";
import {BaseMap} from "./ol/basemap.js";
import {displayMessage} from "./utils";


export class SmartMap
{
    constructor()
    {
        this.getCapabilitiesURL = "https://smartmap.ccom.unh.edu/geoserver/wms?request=getCapabilities";
        $("#getCapabilitiesURLText").val(this.getCapabilitiesURL);
        this.resourcesLoaded = false;

        this.mapCenter = ol.proj.fromLonLat([-70.9395, 43.13555]);
        this.mapExtent = ol.proj.transformExtent([-360, -70, 360, 70], "EPSG:4326", "EPSG:3857");

        this.bm = new BaseMap();

        /* common variables */
        this.sources = new Set();
        this.source = "rtofs";
        this.sourceLayer = "source";

        this.transparency = 20;

        this.rtofsQfDates = [];
        this.woa13QfDates = [];
        this.maxRtofsQfDate = undefined;
        this.maxWoa13QfDate = undefined;

        // create global line and area styles
        this.styles = {
            "LineString": new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "white",
                    width: 3
                }),
            }),
            "LineStringHighlighted": [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: "white",
                        width: 5
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: [0, 153, 255, 1],
                        width: 3
                    })
                })
            ],
            "MultiLineString": new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "white",
                    width: 3
                }),
            }),
            "Polygon": new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "white",
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: "rgba(0, 0, 255, 0.1)"
                })
            }),
            "MultiPolygon": new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "white",
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: "rgba(0, 0, 255, 0.1)"
                })
            }),
            "PolygonHighlighted": new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "orange",
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: "rgba(0, 0, 255, 0.1)"
                })
            })
        };
        this.styleFunction = (feature) => {
            return this.styles[feature.getGeometry().getType()];
        };

        // create vector source for survey lines
        this.lineSource = new ol.source.Vector({wrapX: false});
        this.lineLayer = new ol.layer.Vector({
            source: this.lineSource,
            style: this.styleFunction
        });
        this.lineLayer.setZIndex(1000);

        // create vector source for survey areas
        this.areaSource = new ol.source.Vector({wrapX: false});
        this.areaLayer = new ol.layer.Vector({
            source: this.areaSource,
            style: this.styleFunction
        });
        this.areaLayer.setZIndex(1001);

        // used to display mouse position in a div
        this.mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.toStringHDMS,
            projection: "EPSG:4326",
            className: "custom-mouse-position",
            target: document.getElementById("info-bar-mouse-position"),
            undefinedHTML: "&nbsp;"
        });

        // create supported map projections
        this.proj4 = proj4;

        for(let i = 1; i <= 60; i++)
        {
            // EPSG:32601 - EPSG:32660
            this.proj4.defs("EPSG:326" + (i < 10 ? "0" : "") + i, "+proj=utm +zone=" + i + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

            // EPSG:32701 - EPSG:32760
            this.proj4.defs("EPSG:327" + (i < 10 ? "0" : "") + i, "+proj=utm +zone=" + i + " +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
        }

        this.supportedProjections = () => {
            let projections = [
                {name:"Geographic / WGS84", value:"EPSG:4326"},
                {name:"Web Mercator / WGS84", value:"EPSG:3857"}
            ];

            for(let i = 1; i <= 60; i++)
            {
                projections.push({name:"UTM zone " + i + "N / WGS84", value:"EPSG:326" + (i < 10 ? "0" : "") + i});
            }

            for(let i = 1; i <= 60; i++)
            {
                projections.push({name:"UTM zone " + i + "S / WGS84", value:"EPSG:327" + (i < 10 ? "0" : "") + i});
            }
            
            return projections;
        };

        // used to display line scale
        this.lineScaleControl = new ol.control.ScaleLine({ units: "nautical" });

        // map view
        this.view = new ol.View({
            constrainRotation: true,  // The view snaps to 0 when rotation is close to 0
            maxZoom: 9,
            minZoom: 2,
            zoom: 3,
            center: this.mapCenter,
            extent: this.mapExtent,
            projection: "EPSG:3857"  // it is the default, EPGS:900913 is an alias
        });

        // main map object
        this.map = new ol.Map({
            layers: [this.bm.osmBasemap, this.lineLayer, this.areaLayer],
            logo: {
                href: "https://ccom.unh.edu",
                src: "https://ccom.unh.edu/sites/default/files/ccom_0.ico"
            },
            controls: ol.control.defaults({
                attributionsOptions: ({
                    collapsible: true
                })
            }).extend([
                new ol.control.FullScreen(),
                this.mousePositionControl
            ]),
            interactions: ol.interaction.defaults().extend([
                new ol.interaction.DragRotateAndZoom()
            ]),
            target: "map",
            view: this.view
        });

        // update QF value in status bar
        this.map.on("pointermove", $.proxy(this._updateMousePositionWithValue, this) );

        this.map.getLayers().setAt(0, this.bm.osmBasemap);

        this.geoloc = new GeoLocation(this.map);
    }

    addLineScale()
    {
        if(!this.hasLineScale())
        {
            this.map.addControl(this.lineScaleControl);
        }
    }

    removeLineScale()
    {
        if(this.hasLineScale())
        {
            this.map.removeControl(this.lineScaleControl);
        }
    }

    hasLineScale()
    {
        let found = false;
        this.map.getControls().forEach((ctrl) => {
            if(ctrl === this.lineScaleControl)
            {
                found = true;
            }
        });
        return found;
    }

    _sourceData(date, src, type, visible)
    {
        if(src === "woa13")
        {
            const month = date.getMonth();
            date.setFullYear(2013, month, 1);
        }

        let layerIDString = src + ":";
        layerIDString += utils.makeProductLayerName(src, "qf", date);
        const srcUrl = "https://smartmap.ccom.unh.edu/geoserver/" + src + "/wms";
        let tiled = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: srcUrl,
                params: {
                    "FORMAT": "image/png",
                    tiled: true,
                    LAYERS: layerIDString
                }
            }),
            name: this.sourceLayer,
            transparency: this.transparency,
            visible: visible
        });
        tiled.type = type;

        return tiled;
    }

    reloadSourceData(date, src, type = common.LayerType.SOURCE, visible = true)
    {
        if(date === null || !(date instanceof Date))
        {
            return;
        }

        // first remove all the existing SOURCE and SOURCE_STEP layers
        this.map.getLayers().forEach((lyr) =>
        {
            if(lyr === undefined)
            {
                console.warn("undefined layer");
                return;
            }

            if((lyr.type === common.LayerType.SOURCE) || (lyr.type === common.LayerType.SOURCE_STEP))
            {
                this.map.removeLayer(lyr);
            }
        });

        this.map.getLayers().setAt(3, this._sourceData(date, src, type, visible));

        // set opacity for all layers
        this.map.getLayers().forEach((lyr) =>
        {
            if(lyr === undefined)
            {
                console.warn("undefined layer");
                return;
            }

            if((lyr.type === common.LayerType.SOURCE) || (lyr.type === common.LayerType.SOURCE_STEP))
            {
                // console.debug(lyr.id);
                lyr.setOpacity((100 - this.transparency) / 100);
            }
        });
    }

    appendSourceData(date, src, type = common.LayerType.SOURCE_STEP, visible = false)
    {
        if(date === null || !(date instanceof Date))
        {
            return;
        }
        // console.debug("appending");

        this.map.getLayers().push(this._sourceData(date, src, type, visible));

        // set opacity for all layers
        this.map.getLayers().forEach((lyr) =>
        {
            if((lyr.type === common.LayerType.SOURCE) || (lyr.type === common.LayerType.SOURCE_STEP))
            {
                // console.debug(lyr.id);
                lyr.setOpacity((100 - this.transparency) / 100);
            }
        });
    }

    reloadBaseMap(base)
    {
        console.debug(base);

        if(base === "aerial")
        {
            this.map.getLayers().setAt(0, this.bm.aerialBasemap);
            displayMessage("Basemap: Bing Aerial Imagery");
        }
        else if(base === "etopo1")
        {
            this.map.getLayers().setAt(0, this.bm.etopoBasemap);
            displayMessage("Basemap: NGDC Etopo1");
        }
        else if(base === "gebco")
        {
            this.map.getLayers().setAt(0, this.bm.gebcoBasemap);
            displayMessage("Basemap: GEBCO Bathymetry");
        }
        else if(base === "geotopo")
        {
            this.map.getLayers().setAt(0, this.bm.geotopoBasemap);
            displayMessage("Basemap: USGS GeoTopo");
        }
        else if(base === "noaa-rnc")
        {
            this.map.getLayers().setAt(0, this.bm.noaaRncBasemap);
            displayMessage("Basemap: NOAA RNC");
        }
        else if(base === "osm")
        {
            this.map.getLayers().setAt(0, this.bm.osmBasemap);
            displayMessage("Basemap: Open Street Map");
        }
    }

    updateLegend(date)
    {

        let legendWidth = 20;
        let legendFontSize = 10;
        if($(window).width() < 768)
        {
            legendWidth = 11;
            legendFontSize = 9;
        }

        // retrieve source and date based legend
        if(this.source === "rtofs")
        {
            if(utils.isDateInDates(this.rtofsQfDates, date))
            {
                $("#map-legend-img").attr("src",
                    "https://smartmap.ccom.unh.edu/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.3.0&" +
                    "FORMAT=image/png&" +
                    "WIDTH=" + legendWidth + "&" +
                    "LAYER=" + this.source + ":" + utils.makeProductLayerName(this.source, "qf", date) + "&" +
                    "TRANSPARENT=true&" +
                    "LEGEND_OPTIONS=fontColor:235b8c;dx:2.0;mx:0.1;my:0.1;fontSize:" + legendFontSize);
            }
            $("#map-legend-info").text("Depth Bias");
            $("#map-legend-source").text("RTOFS");
            $("#map-legend-date").text(utils.makeLegendDate(date));
        }
        else if(this.source === "woa13")
        {
            const month = date.getMonth();
            date.setFullYear(2013, month, 1);

            if(utils.isDateInDates(this.woa13QfDates, date))
            {
                $("#map-legend-img").attr("src",
                    "https://smartmap.ccom.unh.edu/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.3.0&" +
                    "FORMAT=image/png&" +
                    "WIDTH=" + legendWidth + "&" +
                    "LAYER=" + this.source + ":" + this.makeProductLayerName(this.source, "qf", date) + "&" +
                    "TRANSPARENT=true&" +
                    "LEGEND_OPTIONS=fontColor:235b8c;dx:2.0;mx:0.1;my:0.1;fontSize:" + legendFontSize);
            }
            $("#map-legend-info").text("Depth Bias");
            $("#map-legend-source").text("WOA13");
            $("#map-legend-date").text(utils.makeLegendMonth(date));
        }
        else
        {
            $("#map-legend-img").attr("src", "img/nodata.png");
            $("#map-legend-info").text("N/A");
            $("#map-legend-source").text("---");
            $("#map-legend-date").text("---");
        }
    }

    _updateMousePositionWithValue(evt)
    {
        // loop through all the layers
        this.map.getLayers().forEach((lyr) =>
        {
            // ignoring layers that are not SOURCE or SOURCE_STEP
            if((lyr.type !== common.LayerType.SOURCE) && (lyr.type !== common.LayerType.SOURCE_STEP))
            {
                return;
            }
            // ignoring invisible layers
            if(!lyr.getVisible())
            {
                return;
            }

            // build request url
            const url = lyr.getSource().getGetFeatureInfoUrl(
                evt.coordinate, this.view.getResolution(), this.view.getProjection(),
                {"INFO_FORMAT": "application/json"}
            );

            if(url)
            {
                $.getJSON(url, (data) =>
                {
                    const sourceValue = data.features[0].properties.GRAY_INDEX;
                    // skip NO DATA values
                    if(sourceValue < 0)
                    {
                        return;
                    }
                    const roundedVal = sourceValue.toFixed(1);
                    const mousePositionDiv = $(".custom-mouse-position");
                    // displayMessage(mousePositionDiv.html());
                    if(mousePositionDiv.html().length < 10)
                    {
                        return;
                    }
                    if(mousePositionDiv.html().indexOf("QF") > -1)
                    {
                        return;
                    }
                    mousePositionDiv.html(mousePositionDiv.html() + " -> QF " + roundedVal);
                });
            }
        });
    }

    changeBaseMap()
    {
        const basemap = $("input[name=baseMapRadios]:checked").val();
        // reloadGeoserverMapData(date, source);
        if(utils.debug)
        {
            console.debug("new basemap: " + basemap);
        }
        // console.debug(this);
        this.reloadBaseMap(basemap);
        utils.displayMessage("basemap: " + basemap);
    }

    changeDateAndSource()
    {
        let selectedDate = $(".input-group.date")[0].childNodes[1].value;
        let date = new Date(selectedDate);
        this.source = $("input[name=sourceDataRadios]:checked").val();
        if(utils.debug)
        {
            console.debug("new selection: " + this.source + ", " + date);
        }

        if(this.source === "rtofs")
        {
            if(!utils.isDateInDates(this.rtofsQfDates, date))
            {
                BootstrapDialog.alert("Selected date is not present as RTOFS source.");
                // set back to the maximum date
                $(".input-group.date").datepicker("update", this.maxRtofsQfDate);
                return;
            }
        }
        else if(this.source === "woa09")
        {
            if(!utils.isDateInDates(this.woa13QfDates, date))
            {
                BootstrapDialog.alert("Selected date is not present as WOA09 source.");
                // set back to the maximum date
                $(".input-group.date").datepicker("update", this.maxWoa13QfDate);
                return;
            }
        }

        this.reloadSourceData(date, this.source);
        $("#animation-slider-value").text("[step: 0] " + utils.makeLegendDate(date, true));
        this.updateLegend(date);
        utils.displayMessage("[" + this.source + "] " + date);
    }

    // Scan available sources and dates from server
    scanServerCapabilities()
    {
        return new Promise((resolve, reject) => {

            const request = new XMLHttpRequest();

            request.onreadystatechange = () => {
                if(request.readyState === 4 && request.status === 200)
                {
                    const parser = new ol.format.WMSCapabilities();
                    try
                    {
                        let capabilities = parser.read(request.responseText);
                        let layers = capabilities.Capability.Layer.Layer;
                        layers.forEach((value) => {
                            // Retrieve source, product, and date.
                            const layer_id = value.Name;
                            const sep_idx = layer_id.indexOf(":");
                            const source = layer_id.substring(0, sep_idx);
                            this.sources.add(source);

                            const base = layer_id.substring(sep_idx + 1);
                            const tokens = base.split("_");

                            if(tokens.length < 4)  // skip if not enough tokens
                            {
                                return;
                            }
                            const date = tokens[2];
                            if(date.length !== 8)  // skip if not exact digits for a date
                            {
                                return;
                            }

                            const product = tokens[1];
                            const date_y = date.substring(0, 4);
                            const date_m = parseInt(date.substring(4, 6)) - 1; // months are zero-based
                            const date_d = date.substring(6);

                            if(product === "qf")
                            {
                                if(source.indexOf("rtofs") > -1)
                                {
                                    this.rtofsQfDates.push(new Date(date_y, date_m, date_d));
                                }
                                else if(source.indexOf("woa09") > -1)
                                {
                                    this.woa13QfDates.push(new Date(date_y, date_m, date_d));
                                }
                            }
                        });

                    } catch(error)
                    {
                        BootstrapDialog.alert(error.message);
                        reject("Server Scan issue: " + error.message);
                    }
                    if(utils.debug)
                    {
                        console.debug("Sources: " + this.sources.size);
                        console.debug("RTOFS dates: " + this.rtofsQfDates.length);
                        console.debug("WOA09 dates: " + this.woa13QfDates.length);
                    }
                    // Enable only the available sources
                    if(this.sources.has("rtofs"))
                    {
                        $("#sourceDataRtofs").prop("disabled", false).prop("checked", true);
                    }
                    else
                    {
                        $("#sourceDataRtofs").prop("disabled", true);
                    }
                    if(this.sources.has("gomofs"))
                    {
                        $("#sourceDataGomofs").prop("disabled", false);
                    }
                    else
                    {
                        $("#sourceDataGomofs").prop("disabled", true);
                    }
                    if(this.sources.has("woa09"))
                    {
                        $("#sourceDataWoa09").prop("disabled", false);
                    }
                    else
                    {
                        $("#sourceDataWoa09").prop("disabled", true);
                    }
                    if(this.sources.has("woa13"))
                    {
                        $("#sourceDataWoa13").prop("disabled", false);
                    }
                    else
                    {
                        $("#sourceDataWoa13").prop("disabled", true);
                    }

                    if(this.sources.has("usgs"))
                    {
                        $("#baseMapUsgs").prop("disabled", false).prop("checked", true);
                    }
                    else  // osm
                    {
                        $("#baseMapOsm").prop("checked", true);
                    }
                    // Store the latest dates
                    this.maxRtofsQfDate = new Date(Math.max.apply(Math, this.rtofsQfDates));
                    this.maxWoa13QfDate = new Date(Math.max.apply(Math, this.woa13QfDates));
                    this.initUI();
                    this.resourcesLoaded = true;

                    resolve("Server Scan: success");
                }
            };
            request.open("GET", this.getCapabilitiesURL, true);
            request.send();
        });
    }

    // Called after the server capabilities have been retrieved
    initUI()
    {

        // Manage dates
        if((this.rtofsQfDates.length === 0) && (this.woa13QfDates.length === 0))
        {
            this.reloadSourceData(new Date(), this.source);
            this.updateLegend(new Date());
            utils.displayMessage("No valid data.");
        }
        else
        {
            if(this.rtofsQfDates.length > 0)
            {
                this.source = "rtofs";
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);  // to compare with the QF times
                if(utils.isDateInDates(this.rtofsQfDates, todayDate))
                {
                    this.reloadSourceData(todayDate, this.source);
                    this.updateLegend(todayDate);
                    $(".input-group.date").datepicker("update", todayDate);
                    utils.displayMessage("[" + this.source + "] " + todayDate);
                }
                else
                {
                    this.reloadSourceData(this.maxRtofsQfDate, this.source);
                    this.updateLegend(this.maxRtofsQfDate);
                    $(".input-group.date").datepicker("update", this.maxRtofsQfDate);
                    utils.displayMessage("[" + this.source + "] " + this.maxRtofsQfDate);
                }
            }
            else if(this.woa13QfDates.length > 0)
            {
                this.source = "woa09";
                this.reloadSourceData(this.maxWoa13QfDate, this.source);
                this.updateLegend(this.maxWoa13QfDate);
                $(".input-group.date").datepicker("update", this.maxWoa13QfDate);
                utils.displayMessage("[" + this.source + "] " + this.maxWoa13QfDate);
            }
        }

        if(this.sources.has("usgs"))
        {
            this.reloadBaseMap("geotopo");
        }
    }

    addLocationTracking()
    {
        this.geoloc.add();
    }

    removeLocationTracking()
    {
        this.geoloc.remove();
    }

    isLocationTracking()
    {
        return this.geoloc.isActive();
    }
}
