import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;


export class BasePicker
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
    }

    _set_events()
    {
        // Handle basemap selector
        $(".base-pick").click($.proxy(this.sm.changeBaseMap, this.sm));
    }
}
