import ol from "openlayers";
import $ from "jquery";
import jQuery from "jquery";
import turf from "@turf/turf";
import nearestPoint from "@turf/nearest-point";

window.$ = $;
window.jQuery = jQuery;

require("patternfly-bootstrap-treeview/dist/bootstrap-treeview.min.js");

let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");
import * as utils from "../utils.js";

import {DraggableDiv} from "../bs/draggablediv.js";
import {InteractionManager} from "./interactionmanager.js";
import {ToolTipper} from "./tooltipper.js";
import {IOManager} from "./iomanager.js";


export class SurveyPlanner extends DraggableDiv
{
    constructor(sm)
    {
        super($("#survey-planner"), $("#survey-planner-heading").first(), 0);

        this.sm = sm;

        this.toggle = $("#survey-planner-toggle");

        this.plannerDiv = this.draggableDiv;
        this.surveyEditor = $("#survey-planner-editor");
        this.collapse = $("#survey-planner-collapse-editor");

        this.linesTree = $("#survey-planner-lines");
        this.areasTree = $("#survey-planner-areas");

        // initialize tree views
        this.lineData = [
            {
                text: "No survey lines.",
                state: {
                    checked: false,
                    expanded: true
                },
                nodes: []
            }
        ];
        this.linesTree.treeview({data: this.lineData});
        this.areaData = [
            {
                text: "No survey areas.",
                state: {
                    checked: false,
                    expanded: true
                },
                nodes: []
            }
        ];
        this.areasTree.treeview({data: this.areaData});

        // survey editor form items
        this.linesCheckAll = $("#survey-planner-lines-check-all");
        this.linesDelete = $("#survey-planner-lines-delete");

        this.areasCheckAll = $("#survey-planner-areas-check-all");
        this.areasDelete = $("#survey-planner-areas-delete");

        this.openParallelLinesModal = $("#survey-planner-parallel-lines");
        this.createParallelLinesBtn = $("#create-parallel-lines-button");

        this.clipLinestoAreaBtn = $("#survey-planner-clip-lines");

        this.tipper = new ToolTipper(this.sm);
        this.io = new IOManager(this);
        this.interactions = new InteractionManager(this);

        this._setEvents();
    }

    _setEvents()
    {
        // toggle in the tool bar
        this.toggle.on("click", (event) =>
        {
            event.preventDefault();
            this.plannerDiv.toggle();
        });

        // close button
        this.plannerDiv.find(".close").first().on("click", (event) =>
        {
            event.preventDefault();
            this.plannerDiv.toggle();
        });

        // collapse button
        this.collapse.on("click", (event) =>
        {
            event.preventDefault();
            this.surveyEditor.toggle();
            let title = this.collapse.attr("title");
            if(title.includes("Collapse"))
            {
                this.collapse.attr("title", "Expand");
                this.plannerDiv.find("#survey-planner-heading-text").first().html("<i class=\"fa fa-pencil-square-o\"></i>");
            }
            else
            {
                this.collapse.attr("title", "Collapse");
                this.plannerDiv.find("#survey-planner-heading-text").first().html("Survey Planner");
            }
            this.collapse.find("i").first().toggleClass("fa-angle-double-left").toggleClass("fa-angle-double-right");

        });

        // select all lines
        this.linesCheckAll.on("click", (event) =>
        {
            event.preventDefault();

            // call builtin checkAll function
            this.linesTree.treeview("checkAll", {silent: true});
        });

        // delete a line
        this.linesDelete.on("click", (event) =>
        {
            event.preventDefault();

            // find all checked nodes
            let nodes = this.linesTree.treeview("getChecked");

            nodes.forEach(node =>
            {
                if(node.feature) // if node has feature
                {
                    // remove feature
                    this.sm.lineLayer.getSource().removeFeature(node.feature);

                    // find parent
                    let parent = this.linesTree.treeview("getParent", node);

                    if(parent.text.includes("Survey Lines:")) // if node was drawn line
                    {
                        this.lineData[0].nodes.forEach((item, i) =>
                        {
                            if(item.text.includes(node.text)
                            )
                            {
                                // remove node
                                this.lineData[0].nodes.splice(i, 1);

                                // redraw treeview
                                this.refreshLineTree();
                            }
                        });
                    }
                    else
                    {
                        // find corresponding parent
                        this.lineData.forEach((item, i) =>
                        {
                            if(item.text === parent.text)
                            {
                                item.nodes.forEach((child, j) =>
                                {
                                    if(child.text.includes(node.text))
                                    {
                                        // remove node
                                        item.nodes.splice(j, 1);

                                        // redraw treeview
                                        this.refreshLineTree();
                                    }
                                });

                                if(item.nodes.length === 0)
                                {
                                    // remove node
                                    this.lineData.splice(i, 1);

                                    // redraw treeview
                                    this.refreshLineTree();
                                }
                            }
                        });
                    }
                }
            });

            // console.debug("Remaining lines: " + this.lineData[0].nodes.length);
            if(this.lineData[0].nodes.length === 0)
            {
                this.lineData[0].text = "No survey lines.";
                this.refreshLineTree();
            }
        });

        this._refreshTreeviewEvents();

        // select all areas
        this.areasCheckAll.on("click", (event) =>
        {
            event.preventDefault();

            // call builtin checkAll function
            this.areasTree.treeview("checkAll", {silent: true});
        });

        // delete an area
        this.areasDelete.on("click", (event) =>
        {
            event.preventDefault();

            // find all checked nodes
            let nodes = this.areasTree.treeview("getChecked");

            nodes.forEach(node =>
            {
                if(node.feature) // if node has feature
                {
                    // remove feature
                    this.sm.areaLayer.getSource().removeFeature(node.feature);

                    // find parent
                    let parent = this.areasTree.treeview("getParent", node);

                    if(parent.text.includes("Survey Areas:")) // if node was drawn area
                    {
                        this.areaData[0].nodes.forEach((item, i) =>
                        {
                            if(item.text.includes(node.text))
                            {
                                // remove node
                                this.areaData[0].nodes.splice(i, 1);

                                // redraw treeview
                                this.refreshAreaTree();
                            }
                        });
                    }
                    else
                    {
                        // find corresponding parent
                        this.areaData.forEach((item, i) =>
                        {
                            if(item.text === parent.text)
                            {
                                item.nodes.forEach((child, j) =>
                                {
                                    if(child.text.includes(node.text))
                                    {
                                        // remove node
                                        item.nodes.splice(j, 1);

                                        // redraw treeview
                                        this.refreshAreaTree();
                                    }
                                });

                                if(item.nodes.length === 0)
                                {
                                    // remove node
                                    this.areaData.splice(i, 1);

                                    // redraw treeview
                                    this.refreshAreaTree();
                                }
                            }
                        });
                    }
                }
            });

            // console.debug("Remaining areas: " + this.areaData[0].nodes.length);
            if(this.areaData[0].nodes.length === 0)
            {
                this.areaData[0].text = "No survey areas.";
                this.refreshAreaTree();
            }
        });

        this.openParallelLinesModal.on("click", () => 
        {
            const lines = this.linesTree.treeview("getSelected");
            if(lines.length === 0)
            {
                // missing selected lines
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "Missing selection.",
                    message: "An existing line must be first selected."
                });
                return;
            }
            let line = lines[0].feature; //the feature selected

            if(!line){
                return;
            }
            
            let coordinates = line.getGeometry().getCoordinates();
            let pointCount = coordinates.length;

            if(pointCount > 2)
            {
                // missing file name
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "Too many coordinates.",
                    message: "Line must have two coordinates to create parallel lines."
                });
                return;
            }

            // show dialog
            $("#parallel-line-id").text(line.getId());
            $("#parallel-lines").modal("show");
        });

        this.createParallelLinesBtn.on("click", () => 
        {
            let lineID = $("#parallel-line-id").text();
            let amount = parseInt($("#parallel-lines-amount").val());
            let side = $("#parallel-lines-side").val();
            let spacing = parseFloat($("#parallel-lines-spacing").val());

            let format = new ol.format.GeoJSON();

            let feature_line = this.sm.lineSource.getFeatureById(lineID);
            let json_line = format.writeFeatureObject(feature_line, {"dataProjection": "EPSG:4326", "featureProjection": "EPSG:3857"});

            let new_lines = [];
            for(let i = 1; i <= amount; i++)
            {
                let side_multiplier = (side.includes("portside") ? 1 : -1);

                let offset_line = turf.lineOffset(json_line, (side_multiplier * (i * spacing)), "meters");

                let line_feature = format.readFeature(offset_line);
                line_feature.getGeometry().transform("EPSG:4326", "EPSG:3857");

                this.addFeature(line_feature, true);

                new_lines.push(line_feature);
            }

            // close modal
            $("#parallel-lines").modal("toggle");

            // zoom to features
            if(new_lines.length > 0)
            {
                this.zoomToFeatures(new_lines);
            }
        });

        this.clipLinestoAreaBtn.on("click", () =>
        {
            const areas = this.areasTree.treeview("getSelected");
            if(areas.length === 0)
            {
                // missing selected lines
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_WARNING,
                    title: "Missing selection.",
                    message: "An existing area must be first selected."
                });
                return;
            }
            let area = areas[0].feature; //the feature selected

            if(!area){
                return;
            }

            let format = new ol.format.GeoJSON();

            let json_area = format.writeFeatureObject(area, {"dataProjection": "EPSG:4326", "featureProjection": "EPSG:3857"});
            let area_segments = turf.lineSegment(json_area);

            // loop through all lines
            this.sm.lineSource.getFeatures().forEach(line =>
            {
                let json_line = format.writeFeatureObject(line, {"dataProjection": "EPSG:4326", "featureProjection": "EPSG:3857"});

                let points = json_line.geometry.coordinates;

                // check to make sure at least one point of line is contained in area
                if(turf.lineIntersect(json_line, json_area).features.length > 0){
                    let newCoords = [];

                    // loop through line coordinates
                    points.forEach(coord => {
                        if(!turf.booleanContains(json_area, turf.point(coord))){

                            let possibleNewCoords = [];

                            // find intersection points with current line and polygon edges
                            area_segments.features.forEach(edge => {
                                let intersection = turf.lineIntersect(edge, json_line);
                                if(intersection.features.length > 0){
                                    possibleNewCoords.push(turf.point(intersection.features[0].geometry.coordinates));
                                }
                            });

                            // add nearest coord
                            let nearest = nearestPoint(turf.point(coord), turf.featureCollection(possibleNewCoords)).geometry.coordinates;
                            newCoords.push(this.sm.proj4("EPSG:4326", this.sm.view.getProjection().getCode(), nearest));
                        } else {
                            newCoords.push(this.sm.proj4("EPSG:4326", this.sm.view.getProjection().getCode(), coord));
                        }
                    });

                    // reset the line coordinates
                    line.getGeometry().setCoordinates(newCoords);
                }
            });
        });

        this.sm.map.on("pointermove", (e) => 
        {
            this.interactions.pointerMove(e);

            this.tipper.pointerMove(e, this.interactions.getActive("draw-line"), this.interactions.getActive("draw-area"));
        });

        this.sm.map.getViewport().addEventListener("mouseout", () => 
        {
            this.tipper.hideHelp();
        });
    }

    addFeature(feature, addToSource)
    {
        // create unique id
        let id = utils.generateGuid();
        
        // set feature id
        feature.setId(id);

        // set events for geometry
        feature.getGeometry().on("change", (e) => {
            this.tipper.changeHandler(e);
        });

        // add feature
        if(feature.getGeometry() instanceof ol.geom.LineString)
        {
            if(addToSource){ this.sm.lineSource.addFeature(feature); }

            // add node for line
            this.lineData[this.lineData.length - 1].nodes.push({
                text: "Line " + id,
                state: {
                    checked: false
                },
                feature: feature
            });

            // update treeview
            this.refreshLineTree();
        }
        else if(feature.getGeometry() instanceof ol.geom.Polygon)
        {
            if(addToSource){ this.sm.areaSource.addFeature(feature); }

            // add node for area
            this.areaData[this.areaData.length - 1].nodes.push({
                text: "Area " + id,
                state: {
                    checked: false
                },
                feature: feature
            });

            // update treeview
            this.refreshAreaTree();
        }
        else 
        {
            BootstrapDialog.show({
                type: BootstrapDialog.TYPE_DANGER,
                title: "Invalid Geometry",
                message: "Cannot add geometry of type: " + feature.getGeometry().getType()
            });
        }
    }

    refreshLineTree()
    {
        this.linesTree.treeview({data: this.lineData, showCheckbox: true});
        this._refreshTreeviewEvents();
        this.linesTree.treeview("expandAll", {levels: 2, silent: true});
    }

    refreshAreaTree()
    {
        this.areasTree.treeview({data: this.areaData, showCheckbox: true});
        this._refreshTreeviewEvents();
        this.areasTree.treeview("expandAll", {levels: 2, silent: true});
    }

    _refreshTreeviewEvents()
    {
        this.linesTree.on("nodeSelected", (event, node) => {
            if(node.feature)
            {
                this.interactions.get("select").getFeatures().clear();
                this.interactions.get("select").getFeatures().push(node.feature);
            }
            else
            {
                this.interactions.get("select").getFeatures().clear();
                node.nodes.forEach(child => {
                    this.interactions.get("select").getFeatures().push(child.feature);
                });
            }
        });

        this.linesTree.on("nodeUnselected", (event, node) => {
            if(node.feature)
            {
                this.interactions.get("select").getFeatures().clear();
                this.interactions.get("select").getFeatures().push(node.feature);
            }
            else
            {
                this.interactions.get("select").getFeatures().clear();
                node.nodes.forEach(child => {
                    this.interactions.get("select").getFeatures().push(child.feature);
                });
            }
        });

        this.areasTree.on("nodeSelected", (event, node) => {
            if(node.feature)
            {
                this.interactions.get("select").getFeatures().clear();
                this.interactions.get("select").getFeatures().push(node.feature);
            }
            else
            {
                this.interactions.get("select").getFeatures().clear();
                node.nodes.forEach(child => {
                    this.interactions.get("select").getFeatures().push(child.feature);
                });
            }
        });

        this.areasTree.on("nodeUnselected", (event, node) => {
            if(node.feature)
            {
                this.interactions.get("select").getFeatures().clear();
                this.interactions.get("select").getFeatures().push(node.feature);
            }
            else
            {
                this.interactions.get("select").getFeatures().clear();
                node.nodes.forEach(child => {
                    this.interactions.get("select").getFeatures().push(child.feature);
                });
            }
        });

        this.linesTree.on("nodeChecked", (event, node) => {
            if(!node.feature)
            {
                node.nodes.forEach(child => {
                    this.linesTree.treeview("checkNode", [child.nodeId, {silent: true}]);
                });
            }
        });

        this.linesTree.on("nodeUnchecked", (event, node) => {
            if(!node.feature)
            {
                node.nodes.forEach(child => {
                    this.linesTree.treeview("uncheckNode", [child.nodeId, {silent: true}]);
                });
            }
        });

        this.areasTree.on("nodeChecked", (event, node) => {
            if(!node.feature)
            {
                node.nodes.forEach(child => {
                    this.areasTree.treeview("checkNode", [child.nodeId, {silent: true}]);
                });
            }
        });

        this.areasTree.on("nodeUnchecked", (event, node) => {
            if(!node.feature)
            {
                node.nodes.forEach(child => {
                    this.areasTree.treeview("uncheckNode", [child.nodeId, {silent: true}]);
                });
            }
        });
    }

    zoomToFeatures(features)
    {
        let extent = features[0].getGeometry().getExtent().slice(0);
        features.forEach((feature) =>
        {
            ol.extent.extend(extent, feature.getGeometry().getExtent());
        });
        this.sm.map.getView().fit(extent, {
            size: this.sm.map.getSize(),
            maxZoom: this.sm.map.getView().getMaxZoom(),
            padding: [20, 20, 20, 20],
            duration: 2000
        });
    }
}
