import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;
let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");

import * as utils from "../utils.js";


export class SourceExporter
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
    }

    _set_events()
    {
        // Handle source selector
        $("#export-data").on("click", (event) =>
        {
            event.preventDefault();

            const value = parseInt($("#animation-slider[type='range']").val());
            let selectedDate = $(".input-group.date")[0].childNodes[1].value;
            let selectedDateObj = new Date(selectedDate);
            const date = new Date(selectedDateObj);
            date.setDate(selectedDateObj.getDate() + value);
            if(this.sm.source === "woa13")
            {
                const month = date.getMonth();
                date.setFullYear(2013, month, 1);
            }

            let selectedFormat = $("#save-formats").find(":input:radio:checked").val();
            let format;
            if(selectedFormat === "kml")
            {
                format = "application/vnd.google-earth.kml+XML";
            }
            else if(selectedFormat === "kmz")
            {
                format = "kml";
            }
            else if(selectedFormat === "geotiff")
            {
                format = "image/geotiff";
            }
            else
            {
                BootstrapDialog.alert("Unknown format!");
                return;
            }

            let url = "https://smartmap.ccom.unh.edu/geoserver/ows?service=WMS&" +
                "request=GetMap&" +
                "version=1.1.1&" +
                "format=" + format + "&" +
                "width=1024&height=1024&" +
                "srs=EPSG:4326&" +
                "layers=" + this.sm.source + ":" + utils.makeProductLayerName(this.sm.source, "qf", date) + "&" +
                "bbox=-180,-90,180,90";

            const win = window.open(url);
            if(win)
            {
                //Browser has allowed it to be opened
                win.focus();
            }
            else
            {
                //Browser has blocked it
                BootstrapDialog.alert("First allow SmartMap to open popups!");
            }
        });
    }
}
