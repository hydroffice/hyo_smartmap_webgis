import ol from "openlayers";

export class ToolTipper
{
    constructor(sm)
    {
        // console.debug("tipper");

        this.sm = sm;

        this.sketch = null;
        this.listener = null;

        this.measureElement = null;
        this.measure = null;

        // add help
        this.helpElement = document.createElement("div");
        this.helpElement.className = "tooltip hidden";
        this.help = new ol.Overlay({
            element: this.helpElement,
            offset: [15, 0],
            positioning: "center-left"
        });
        this.sm.map.addOverlay(this.help);

        // add measure
        this.measureElement = document.createElement("div");
        this.measureElement.className = "tooltip tooltip-measure";

        this.measure = new ol.Overlay({
            element: this.measureElement,
            offset: [0, -15],
            positioning: "bottom-center"
        });
        this.sm.map.addOverlay(this.measure);
    }

    start(evt)
    {
        this.measureElement.className = "tooltip tooltip-measure";
        this.sketch = evt.feature;
        this.listener = this.sketch.getGeometry().on("change", (evt) =>
        {
            this.changeHandler(evt);
        });
    }

    changeHandler(evt)
    {
        let output;
        let coord;
        const geom = evt.target;
        if(geom instanceof ol.geom.Polygon)
        {
            this.helpMsg = "Click on a point to continue drawing the area, double click to end.";
            output = ToolTipper.formatArea(geom);
            coord = geom.getInteriorPoint().getCoordinates();
        }
        else if(geom instanceof ol.geom.LineString)
        {
            this.helpMsg = "Click on a point to continue drawing the line, double click to end.";
            output = ToolTipper.formatLength(geom);
            coord = geom.getLastCoordinate();
        }
        this.measureElement.innerHTML = output;
        this.measure.setPosition(coord);
    }

    stop()
    {
        // unset tooltip
        this.measureElement.className = "tooltip tooltip-static";
        this.measure.setOffset([0, -7]);
        // unset sketch
        this.sketch = null;
        ol.Observable.unByKey(this.listener);
    }

    // format the tooltip output for line
    static formatLength(line)
    {
        const length = ol.Sphere.getLength(line);
        let output;
        if(length > 1500)
        {
            output = (Math.round(length / 1852 * 100) / 100) + " " + "NM";
        }
        else
        {
            output = (Math.round(length * 100) / 100) + " " + "m";
        }
        return output;
    }

    // format the tooltip output for area
    static formatArea(polygon)
    {
        const area = ol.Sphere.getArea(polygon);
        let output;
        if (area > 100000)
        {
            output = (Math.round(area / 3429904 * 100) / 100) + " " + "NM<sup>2</sup>";
        }
        else
        {
            output = (Math.round(area * 100) / 100) + " " + "m<sup>2</sup>";
        }
        return output;
    }

    pointerMove(evt, lineInteractionActive, areaInteractionActive)
    {
        if(evt.dragging) {
            return;
        }

        if(!this.sketch && lineInteractionActive)
        {
            this.helpMsg = "Click to start to draw a line";
        }
        else if(!this.sketch && areaInteractionActive)
        {
            this.helpMsg = "Click to start to draw an area";
        }

        if(lineInteractionActive || areaInteractionActive)
        {
            this.helpElement.innerHTML = this.helpMsg;
            this.showHelp();
            this.help.setPosition(evt.coordinate);
        }
    }

    hide()
    {
        this.hideHelp();
        this.hideMeasure();
    }

    hideHelp()
    {
        this.helpElement.classList.add("hidden");
    }


    hideMeasure()
    {
        this.measureElement.classList.add("hidden");
    }

    show()
    {
        this.showHelp();
        this.showMeasure();
    }

    showHelp()
    {
        this.helpElement.classList.remove("hidden");
    }

    showMeasure()
    {
        this.measureElement.classList.remove("hidden");
    }
}
