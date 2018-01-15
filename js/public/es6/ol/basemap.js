import ol from "openlayers";
import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

import * as common from "../common.js";


export class BaseMap
{
    constructor()
    {
        this.basemap = "osm";
        this.basemapLayer = "basemap";

        // Aerial Imagery
        this.aerialBasemap = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: "AtsrmwiBBWKTO42oZbdttqN3SGdapKisLr8umrjL5M6ZXLDwGjwTsxdja51qSPo5",
                imagerySet: "Aerial"
            }),
            name: this.basemapLayer
        });
        this.aerialBasemap.type = common.LayerType.BASE;

        // ETOPO1
        this.etopoBasemap = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: "https://maps.ngdc.noaa.gov/arcgis/services/web_mercator/etopo1_hillshade/MapServer/WmsServer",
                params: {
                    "FORMAT": "image/png",
                    tiled: true,
                    LAYERS: "ETOPO1 Hillshade"
                },
                attributions: [new ol.Attribution({
                    html: "; ETOPO1: &copy; <a href='http://www.nauticalcharts.noaa.gov/'>NOAA NCEI</a>"
                })]
            }),
            name: this.basemapLayer
        });
        this.etopoBasemap.type = common.LayerType.BASE;

        // GEBCO
        this.gebcoBasemap = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: "http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv",
                params: {
                    "FORMAT": "image/jpeg",
                    tiled: true,
                    LAYERS: "GEBCO_LATEST"
                },
                attributions: [new ol.Attribution({
                    html: "; Bathy: &copy; <a href='http://www.gebco.net/'>GEBCO</a>"
                })]
            }),
            name: this.basemapLayer
        });
        this.gebcoBasemap.type = common.LayerType.BASE;

        // GeoTopo (served by smartmap's geoserver)
        this.geotopoBasemap = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: "https://smartmap.ccom.unh.edu/geoserver/usgs/wms",
                params: {
                    "FORMAT": "image/png",
                    tiled: true,
                    LAYERS: "usgs:geotopo"
                },
                attributions: [new ol.Attribution({
                    html: "; GeoTopo: &copy; <a href='http://www.usgs.gov/visual-id/credit_usgs.html'>USGS</a>"
                })]
            }),
            name: this.basemapLayer
        });
        this.geotopoBasemap.type = common.LayerType.BASE;

        // NOAA RNC
        this.noaaRncBasemap = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: "https://seamlessrnc.nauticalcharts.noaa.gov/arcgis/services/RNC/NOAA_RNC/ImageServer/WMSServer",
                params: {
                    "FORMAT": "image/png",
                    tiled: true,
                    LAYERS: "NOAA_RNC"
                },
                attributions: [new ol.Attribution({
                    html: "; RNC: &copy; <a href='https://www.nauticalcharts.noaa.gov/csdl/seamlessraster.html'>NOAA</a>"
                })]
            }),
            name: this.basemapLayer
        });
        this.noaaRncBasemap.type = common.LayerType.BASE;

        // Open Stree Map
        this.osmBasemap = new ol.layer.Tile({
            source: new ol.source.OSM(),
            name: this.basemapLayer
        });
        this.osmBasemap.type = common.LayerType.BASE;
    }
}
