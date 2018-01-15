import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

export class DraggableDiv
{
    constructor(draggableDiv, grabDiv, yOffset)
    {
        this.draggableDiv = draggableDiv;
        this.grabDiv = grabDiv;

        this.x_pos = 0;
        this.y_pos = 0;
        this.yOffset = yOffset;

        this._enable_grab_cursor();
        this._add_listeners();
    }

    _enable_grab_cursor()
    {
        // set the grab cursor for draggable header
        this.grabDiv.mouseenter( () =>
        {
            this.draggableDiv.addClass("draggable");
        });

        // unset the grab cursor for draggable header
        this.grabDiv.mouseleave( () =>
        {
            this.draggableDiv.removeClass("draggable");
        });
    }

    _add_listeners()
    {
        const mapLegendOffset = this.draggableDiv.offset();
        this.x_pos = mapLegendOffset.left;
        this.y_pos = mapLegendOffset.top;

        this.grabDiv.on("mousedown", $.proxy(this._mouse_down, this));
        $(document).on("mouseup", $.proxy(this._mouse_up, this));
    }

    _mouse_up()
    {
        $(document).off("mousemove", $.proxy(this._div_move, this));
        this.draggableDiv.removeClass("dragging");
    }

    _mouse_down(e)
    {
        const mapLegendOffset = this.draggableDiv.offset();
        this.x_pos = e.clientX - mapLegendOffset.left;
        this.y_pos = e.clientY - mapLegendOffset.top + this.yOffset;  // it is unclear why I had to tweak with +56

        $(document).on("mousemove", $.proxy(this._div_move, this));
    }

    _div_move(e)
    {
        this.draggableDiv.css({
            position: "absolute",
            top: e.clientY - this.y_pos,
            left: e.clientX - this.x_pos,
        });
        this.draggableDiv.addClass("dragging");
    }
}
