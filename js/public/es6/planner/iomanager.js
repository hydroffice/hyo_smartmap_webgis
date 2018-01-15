import ol from "openlayers";
import $ from "jquery";
import jQuery from "jquery";

window.$ = $;
window.jQuery = jQuery;

let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");
let FileSaver = require("file-saver/FileSaver.js");


export class IOManager
{
    constructor(survey_planner)
    {
        // console.debug("IO");
        this.sp = survey_planner;

        this.importLineFormat = $("#import-line-format");
        this.importLineSRS = $("#import-line-srs");
        this.importLineFile = $("#import-line-file");
        this.importLineBtn = $("#import-lines-button");

        this.exportLineFormat = $("#export-line-format");
        this.exportLineSRS = $("#export-line-srs");
        this.exportLineFilename = $("#export-line-filename");
        this.exportLineBtn = $("#export-lines-button");

        this.importAreaFormat = $("#import-area-format");
        this.importAreaSRS = $("#import-area-srs");
        this.importAreaFile = $("#import-area-file");
        this.importAreaBtn = $("#import-areas-button");

        this.exportAreaFormat = $("#export-area-format");
        this.exportAreaSRS = $("#export-area-srs");
        this.exportAreaFilename = $("#export-area-filename");
        this.exportAreaBtn = $("#export-areas-button");

        this._populateSrsSelects();
        this._setEvents();
    }

    _populateSrsSelects()
    {
        this.sp.sm.supportedProjections().forEach(srs =>
        {
            this.importLineSRS.html(this.importLineSRS.html() + "<option value=\"" + srs.value + "\">" + srs.name
                + "</option>");
            this.exportLineSRS.html(this.exportLineSRS.html() + "<option value=\"" + srs.value + "\">" + srs.name
                + "</option>");
            this.importAreaSRS.html(this.importAreaSRS.html() + "<option value=\"" + srs.value + "\">" + srs.name
                + "</option>");
            this.exportAreaSRS.html(this.exportAreaSRS.html() + "<option value=\"" + srs.value + "\">" + srs.name
                + "</option>");
        });
    }

    _setEvents()
    {
        /* Export lines */
        this.exportLineBtn.on("click", (event) =>
        {
            event.preventDefault();

            let lines = [];

            // find all checked nodes
            let nodes = this.sp.linesTree.treeview("getChecked");

            nodes.forEach(node =>
            {
                if(node.feature
                ) // if node has feature
                {
                    lines.push(node.feature);
                }
            });

            // console.log(lines.length);

            if(lines.length === 0)
            {
                // no lines selected
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "No Lines Selected",
                    message: "To export lines, make sure their corresponding checkbox is checked."
                });
                return;
            }

            if(!this.exportLineSRS.val())
            {
                // no srs selected
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "No SRS Selected",
                    message: "To export lines, make sure to select a valid SRS."
                });
                return;
            }

            const format = this.exportLineFormat.val();
            if(format.includes("geojson"))
            {
                // create geojson writer
                let writer = new ol.format.GeoJSON();

                // generate geojson
                let geojsonStr = writer.writeFeatures(lines, {
                    dataProjection: this.exportLineSRS.val(),
                    featureProjection: this.sp.sm.view.getProjection()
                });

                // download file
                let blob = new Blob([geojsonStr], {type: "application/json"});
                FileSaver.saveAs(blob, this.exportLineFilename.val() + ".geojson");
            }
            else if(format.includes("hypack"))
            {
                let lnwStr = "";

                // loop through features
                let count = 0;
                lines.forEach(line =>
                {
                    // increment count
                    count++;

                    // add coordinates
                    let coordinates = line.getGeometry().getCoordinates();
                    let pointCount = coordinates.length;

                    lnwStr += "LIN " + pointCount.toString() + "\n";

                    coordinates.forEach(coordinate =>
                    {
                        // console.log("export SRS: " + this.exportLineSRS.val());
                        // console.log("view SRS: " + this.sp.sm.view.getProjection().getCode());
                        // console.log("view coords: " + coordinate);

                        // convert coordinates
                        if(this.exportLineSRS.val() !== this.sp.sm.view.getProjection().getCode())
                        {
                            coordinate = this.sp.sm.proj4(this.sp.sm.view.getProjection().getCode(), this.exportLineSRS.val(), coordinate);
                        }
                        // console.log("export coords: " + coordinate);

                        // write point
                        lnwStr += "PTS " + coordinate[0].toString() + " " + coordinate[1].toString() + "\n";
                    });

                    lnwStr += "LNN " + count.toString() + "\n";

                    lnwStr += "EOL";

                    if(count !== lines.length)
                    {
                        lnwStr += "\n";
                    }
                });

                // add count
                lnwStr = "LNS " + count.toString() + "\n" + lnwStr;

                // download file
                let blob = new Blob([lnwStr], {type: "application/hypack"});
                FileSaver.saveAs(blob, this.exportLineFilename.val() + ".lnw");
            }
        });

        /* Import lines */
        this.importLineBtn.on("click", (event) =>
        {
            event.preventDefault();

            // retrieve file
            let file = this.importLineFile[0].files[0];
            const format = this.importLineFormat.val();
            if(!file)
            {
                // missing file name
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Name",
                    message: "First select a valid file"
                });
                return;
            }

            if(format.includes("geojson") && !(file.name.includes(".json") || file.name.includes(".geojson")))
            {
                // wrong file type
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Type",
                    message: "If importing GeoJSON, your file should have the extension .json or .geojson"
                });
            }
            else if(format.includes("hypack") && !file.name.includes(".lnw"))
            {
                // wrong file type
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Type",
                    message: "If importing HYPACK .lnw files, your file should have the extension .lnw"
                });
            }
            else
            {
                // create new section in line treeview
                let duplicateFilenameCount = 0;
                this.sp.lineData.forEach((item) =>
                {
                    if(item.text.includes(file.name))
                    {
                        duplicateFilenameCount++;
                    }
                });

                let nodeName = file.name;
                if(duplicateFilenameCount > 0)
                {
                    nodeName = nodeName + " (" + duplicateFilenameCount + ")";
                }

                this.sp.lineData.push({
                    text: nodeName,
                    state: {
                        checked: false,
                        expanded: false
                    },
                    nodes: []
                });

                let reader = new FileReader();

                // Read file into memory as UTF-8
                reader.readAsText(file, "UTF-8");

                // Handle progress, success, and errors
                //reader.onprogress = updateProgress;
                reader.onload = $.proxy(this.importLineFileLoaded, this);
                reader.onerror = $.proxy(IOManager.importFileError, this);
            }
        });

        /* Export areas */
        this.exportAreaBtn.on("click", (event) =>
        {
            event.preventDefault();

            let areas = [];

            // find all checked nodes
            let nodes = this.sp.areasTree.treeview("getChecked");

            nodes.forEach(node =>
            {
                if(node.feature
                ) // if node has feature
                {
                    areas.push(node.feature);
                }
            });

            if(areas.length === 0)
            {
                // no areas selected
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "No Areas Selected",
                    message: "To export areas, make sure their corresponding checkbox is checked."
                });
                return;
            }

            const format = this.exportAreaFormat.val();
            if(format.includes("geojson"))
            {
                // create geojson writer
                let writer = new ol.format.GeoJSON();

                // generate geojson
                let geojsonStr = writer.writeFeatures(areas, {
                    dataProjection: this.exportAreaSRS.val(),
                    featureProjection: this.sp.sm.view.getProjection()
                });

                // download file
                let blob = new Blob([geojsonStr], {type: "application/json"});
                FileSaver.saveAs(blob, this.exportAreaFilename.val() + ".geojson");
            }
            else if(format.includes("hypack"))
            {
                let lnwStr = "";
                
                // loop through features
                areas.forEach(area =>
                {
                    // add coordinates
                    let coordinates = area.getGeometry().getCoordinates();

                    coordinates[0].forEach(coordinate =>
                    {
                        // convert coordinates
                        if(this.exportAreaSRS.val() !== this.sp.sm.view.getProjection().getCode())
                        {
                            coordinate = this.sp.sm.proj4(this.sp.sm.view.getProjection().getCode(), this.exportAreaSRS.val(), coordinate);
                        }

                        // write point
                        lnwStr += coordinate[0].toString() + " " + coordinate[1].toString() + "\n";
                    });

                    // download file
                    let blob = new Blob([lnwStr], {type: "application/hypack"});
                    FileSaver.saveAs(blob, this.exportAreaFilename.val() + "_" + area.getId() + ".brd");
                });
            }
        });

        /* Import areas */
        this.importAreaBtn.on("click", (event) =>
        {
            event.preventDefault();

            // retrieve file
            let file = this.importAreaFile[0].files[0];
            const format = this.importAreaFormat.val();
            if(!file)
            {
                // missing file name
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Name",
                    message: "First select a valid file"
                });
                return;
            }

            if(format.includes("geojson") && !(file.name.includes(".json") || file.name.includes(".geojson")))
            {
                // wrong file type
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Type",
                    message: "If importing GeoJSON, your file should have the extension .json or .geojson"
                });
            }
            else if(format.includes("hypack") && !file.name.includes(".brd"))
            {
                // wrong file type
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Incorrect File Type",
                    message: "If importing HYPACK .brd files, your file should have the extension .brd"
                });
            }
            else
            {
                // create new section in line treeview
                let duplicateFilenameCount = 0;
                this.sp.areaData.forEach((item) => {
                    if(item.text.includes(file.name)
                    )
                    {
                        duplicateFilenameCount++;
                    }
                })
                ;

                let nodeName = file.name;
                if(duplicateFilenameCount > 0)
                {
                    nodeName = nodeName + " (" + duplicateFilenameCount + ")";
                }

                this.sp.areaData.push({
                    text: nodeName,
                    state: {
                        checked: false,
                        expanded: false
                    },
                    nodes: []
                });

                let reader = new FileReader();

                // Read file into memory as UTF-8
                reader.readAsText(file, "UTF-8");

                // Handle progress, success, and errors
                //reader.onprogress = updateProgress;
                reader.onload = $.proxy(this.importAreaFileLoaded, this);
                reader.onerror = $.proxy(IOManager.importFileError, this);
            }
        });
    }

    static importFileError(evt)
    {
        // error encountered while attempting to read file
        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: "Error encountered while reading file.",
            message: evt.target.error.name
        });
    }

    importLineFileLoaded(evt)
    {
        // Obtain the read file data
        let importText = evt.target.result;

        // close modal
        $("#import-lines").modal("toggle");

        const format = this.importLineFormat.val();
        if(format.includes("geojson"))
        {
            // create features
            try
            {
                let features = (new ol.format.GeoJSON()).readFeatures(importText, {
                    dataProjection: this.importLineSRS.val(),
                    featureProjection: this.sp.sm.view.getProjection()
                });

                // separate features into respective layers
                features.forEach(feature => {
                    if(feature.getGeometry() instanceof ol.goem.LineString)
                    {
                        this.sp.addFeature(feature, true);
                    }
                });

                // zoom to features
                if(0 < features.length)
                {
                    this.sp.zoomToFeatures(features);
                }
            }
            catch(err)
            {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Error importing GeoJSON",
                    message: err.toString()
                });
            }
        }
        else if(format.includes("hypack"))
        {
            // loop through lines
            let lines = importText.split("\n");

            let coordinates = [];
            let name = "";
            let features = [];
            lines.forEach(line => {
                // split line by space
                let parts = line.split(" ");

                if(parts[0].includes("EOL"))
                {
                    // create feature
                    let lineFeature = new ol.Feature({
                        geometry: new ol.geom.LineString(coordinates),
                        name: name
                    });

                    this.sp.addFeature(lineFeature, true);

                    // clear vars
                    coordinates = [];
                    name = "";
                }
                else if(parts[0].includes("PTS"))
                {
                    // project coordinates
                    let coords = [parseFloat(parts[1], 10), parseFloat(parts[2], 10)];
                    if(this.importLineSRS.val() !== this.sp.sm.view.getProjection().getCode())
                    {
                        coords = this.sp.sm.proj4(this.importLineSRS.val(), this.sp.sm.view.getProjection().getCode(), coords);
                    }

                    coordinates.push(coords);
                }
                else if(parts[0].includes("LNN"))
                {
                    name = parts[1];
                }
            });

            // zoom to features
            if(0 < features.length)
            {
                this.sp.zoomToFeatures(features);
            }
        }
    }

    importAreaFileLoaded(evt)
    {
        // Obtain the read file data
        let importText = evt.target.result;

        // close modal
        $("#import-areas").modal("toggle");

        const format = this.importAreaFormat.val();
        if(format.includes("geojson"))
        {
            // create features
            try
            {
                let features = (new ol.format.GeoJSON()).readFeatures(importText, {
                    dataProjection: this.importAreaSRS.val(),
                    featureProjection: this.sp.sm.view.getProjection()
                });

                // separate features into respective layers
                features.forEach(feature => {
                    if(feature.getGeometry() instanceof ol.geom.Polygon)
                    {
                        this.sp.addFeature(feature, true);
                    }
                });

                // zoom to features
                if(0 < features.length)
                {
                    this.sp.zoomToFeatures(features);
                }
            }
            catch(err)
            {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: "Error importing GeoJSON",
                    message: err.toString()
                });
            }
        }
        else if(format.includes("hypack"))
        {
            // loop through lines
            let lines = importText.split("\n");
            
            let coordinates = [];
            let features = [];
            lines.forEach(line => {
                // skip last line
                if(line === ""){ return; }

                // split line by space
                let parts = line.split(" ");

                // project coordinates
                let coords = [parseFloat(parts[0], 10), parseFloat(parts[1], 10)];
                if(this.importAreaSRS.val() !== this.sp.sm.view.getProjection().getCode())
                {
                    coords = this.sp.sm.proj4(this.importAreaSRS.val(), this.sp.sm.view.getProjection().getCode(), coords);
                }

                coordinates.push(coords);
            });

            // create feature
            let areaFeature = new ol.Feature({
                geometry: new ol.geom.Polygon([coordinates], "XY"),
            });

            this.sp.addFeature(areaFeature, true);

            // zoom to features
            if(0 < features.length)
            {
                this.sp.zoomToFeatures(features);
            }
        }
    }

}
