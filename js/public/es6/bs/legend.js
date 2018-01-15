import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

import {DraggableDiv} from "./draggablediv.js";

export class Legend extends DraggableDiv
{
    constructor(sm)
    {
        super($("#map-legend"), $("#map-legend-info"), 56);

        this.sm = sm;

        this.legendDiv = this.draggableDiv;

        this._set_events();
        this._init();
    }

    _set_events()
    {
        // toggle in the tool bar
        $("#map-legend-toggle").on("click", (event) =>
        {
            event.preventDefault();
            this.legendDiv.toggle();
        });

        // close button in the legend
        $("#map-legend-close").on("click", (event) =>
        {
            event.preventDefault();
            this.legendDiv.toggle();
        });
    }

    _init()
    {
        this.legendDiv.show();
    }
}

