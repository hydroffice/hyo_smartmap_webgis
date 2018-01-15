import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;


export class SourcePicker
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
    }

    _set_events()
    {
        // Handle source selector
        $(".source-pick").click($.proxy(this.sm.changeDateAndSource, this.sm));
    }
}
