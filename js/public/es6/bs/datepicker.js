import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;


export class DatePicker
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
    }

    _set_events()
    {
        $(".input-group.date").datepicker({
            todayBtn: "linked"
        }).on("changeDate", $.proxy(this.sm.changeDateAndSource, this.sm));
    }
}
