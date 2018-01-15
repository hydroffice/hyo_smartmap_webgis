import ol from "openlayers";
import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

import * as common from "../common.js";


export class GeoLocation
{
    constructor(map)
    {
        this.map = map;

        // features

        this.accuracyFeature = new ol.Feature();

        this.positionFeature = new ol.Feature();
        this.positionFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: new ol.style.Fill({
                    color: "#ffffff"
                }),
                stroke: new ol.style.Stroke({
                    color: "#ff3636",
                    width: 2
                })
            })
        }));

        // ol geolocation and layer
        this.geolocation = null;
        this.geolocationAccGeomKey = null;
        this.geolocationPosKey = null;
        this.layer = null;
    }

    isActive()
    {
        return this.geolocation !== null;
    }

    add()
    {
        this.geolocation = new ol.Geolocation({
            tracking: true,
            projection: this.map.getView().getProjection()
        });
        this.geolocationAccGeomKey = this.geolocation.on("change:accuracyGeometry", () =>
        {
            this.accuracyFeature.setGeometry(this.geolocation.getAccuracyGeometry());
        });
        this.geolocationPosKey = this.geolocation.on("change:position", () =>
        {
            const coordinates = this.geolocation.getPosition();
            this.positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);

            // center to the geo location
            this.map.getView().setCenter(this.geolocation.getPosition());
        });

        this.layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [this.accuracyFeature, this.positionFeature]
            })
        });
        this.layer.type = common.LayerType.GEOLOC;

        this.map.addLayer(this.layer);

        console.debug("added GeoLocation");
    }

    remove()
    {
        // unlink listeners
        ol.Observable.unByKey(this.geolocationAccGeomKey);
        ol.Observable.unByKey(this.geolocationPosKey);

        this.geolocation = null;
        this.map.getLayers().forEach((lyr) => {

            // console.debug(lyr);
            if(lyr.type === common.LayerType.GEOLOC)
            {
                this.map.removeLayer(lyr);
            }
            
        });
        this.layer = null;

        console.debug("removed GeoLocation");
    }
}
