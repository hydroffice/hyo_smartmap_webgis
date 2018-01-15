import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;


export class LocationTracker
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
    }

    _set_events()
    {
        // Handle location tracking
        $("#location-tracking-toggle").on("click", (event) =>
        {
            event.preventDefault();

            if(this.sm.isLocationTracking())
            {
                this.sm.removeLocationTracking();
            }
            else
            {
                this.sm.addLocationTracking();
            }
        });
    }
}
