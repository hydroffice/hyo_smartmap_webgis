import ol from "openlayers";
import $ from "jquery";
import jQuery from "jquery";

window.$ = $;
window.jQuery = jQuery;


export class InteractionManager
{
    constructor(survey_planner)
    {
        // console.debug("IO");
        this.sp = survey_planner;

        this.interactions = 
        {
            "select": {
                "object": new ol.interaction.Select({
                    layers: [this.sp.sm.lineLayer, this.sp.sm.areaLayer]
                }),
                "button": $("#survey-planner-select-objects"),
                "reqs": []
            },
            "draw-line": {
                "object": new ol.interaction.Draw({
                    source: this.sp.sm.lineSource,
                    type: "LineString"
                }),
                "button": $("#survey-planner-draw-lines"),
                "reqs": []
            },
            "modify-line": {
                "object": new ol.interaction.Modify({
                    source: this.sp.sm.lineSource
                }),
                "button": $("#survey-planner-modify-lines"),
                "reqs": ["snap-line"]
            },
            "draw-area": {
                "object": new ol.interaction.Draw({
                    source: this.sp.sm.areaSource,
                    type: "Polygon"
                }),
                "button": $("#survey-planner-draw-polygons"),
                "reqs": []
            },
            "modify-area": {
                "object": new ol.interaction.Modify({
                    source: this.sp.sm.areaSource
                }),
                "button": $("#survey-planner-modify-areas"),
                "reqs": ["snap-area"]
            },
            "snap-line": {
                "object": new ol.interaction.Snap({
                    source: this.sp.sm.lineSource
                }),
                "button": false,
                "reqs": []
            },
            "snap-area": {
                "object": new ol.interaction.Snap({
                    source: this.sp.sm.areaSource
                }),
                "button": false,
                "reqs": []
            }
        };

        this._addInterations();
        this._setEvents();   
    }

    _addInterations()
    {
        $.each( this.interactions, ( name, interaction ) => {
            interaction["object"].setActive(false);
            this.sp.sm.map.addInteraction(interaction["object"]);
        });
    }

    _setEvents()
    {
        // activation events
        $.each( this.interactions, ( name ) => 
        {
            if (this.interactions[name]["button"])
            {
                this.interactions[name]["button"].on("click", () => {
                    if(this.getActive(name))
                    {
                        // remove interaction
                        this.setActive(name, false);
                        if(name.includes("draw"))
                        {
                            this.sp.tipper.hide();
                        }
                    }
                    else
                    {
                        this.disableAllInterations();
                        this.setActive(name, true);
                    }
                });
            }
        });

        this.get("select").getFeatures().on("add", (e) =>
        {
            let feature = e.element; //the feature selected

            if(feature.getGeometry().getType().includes("Line"))
            {
                this.sp.lineData.forEach(parent => {
                    parent.nodes.forEach(node => {
                        node.state.selected = node.feature.getId() === feature.getId();
                    });
                    // update treeview
                    this.sp.refreshLineTree();
                });

                // set line tab in focus
                $(".survey-planner-editor a[href=\"#survey-planner-tab-lines\"]").tab("show");
            }
            else
            {
                this.sp.areaData.forEach(parent => {
                    parent.nodes.forEach(node => {
                        node.state.selected = node.feature.getId() === feature.getId();
                    });
                    // update treeview
                    this.sp.refreshAreaTree();
                });

                // set area tab in focus
                $(".survey-planner-editor a[href=\"#survey-planner-tab-areas\"]").tab("show");
            }

        });

        this.get("draw-line").on("drawstart", (e) =>
        {
            this.sp.tipper.start(e);
        });

        this.get("draw-line").on("drawend", (e) =>
        {
            if(this.sp.lineData[0].text.includes("No"))
            {
                this.sp.lineData[0].text = "Survey Lines:";
            }

            this.sp.addFeature(e.feature, false);

            this.sp.tipper.stop();
        });

        this.get("draw-area").on("drawstart", (e) =>
        {
            this.sp.tipper.start(e);
        });

        this.get("draw-area").on("drawend", (e) =>
        {
            if(this.sp.areaData[0].text.includes("No"))
            {
                this.sp.areaData[0].text = "Survey Areas:";
            }
            
            this.sp.addFeature(e.feature, false);

            this.sp.tipper.stop();
        });
    }

    pointerMove(e)
    {
        // change cursor to pointer if on feature and select interaction active
        let hit = this.sp.sm.map.forEachFeatureAtPixel([e.originalEvent.offsetX, e.originalEvent.offsetY], () =>
        {
            return true;
        });

        if (hit && this.getActive("select"))
        {
            this.sp.sm.map.getTargetElement().style.cursor = "pointer";
        }
        else
        {
            this.sp.sm.map.getTargetElement().style.cursor = "";
        }
    }

    disableAllInterations()
    {
        $.each( this.interactions, ( name ) => {
            this.setActive(name, false);
        });
    }

    get(name)
    {
        return this.interactions[name]["object"];
    }

    getActive(name)
    {
        return this.interactions[name]["object"].getActive();
    }

    setActive(name, flag)
    {
        // activate desired interaction
        this.interactions[name]["object"].setActive(flag);

        // activate any requirements
        $.each( this.interactions[name]["reqs"], ( index, req_name ) => {
            this.setActive(req_name, false);
        });

        // add active class to corresponding button
        if(this.interactions[name]["button"])
        {
            if (flag)
            {
                this.interactions[name]["button"].addClass("active");
            }
            else
            {
                this.interactions[name]["button"].removeClass("active");
            }
        }
    }
}
