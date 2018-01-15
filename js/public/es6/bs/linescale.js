import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;


export class LineScale
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
        this._init();
    }

    _set_events()
    {
        $("#linear-scale-toggle").click( (event) =>
        {
            event.preventDefault();
            if(this.sm.hasLineScale())
            {
                this.sm.removeLineScale();
            }
            else
            {
                this.sm.addLineScale();
            }
        });
    }

    _init()
    {
    }
}
