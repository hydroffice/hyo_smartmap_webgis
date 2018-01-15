import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;
let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");


export class About
{
    constructor(sm)
    {
        this.sm = sm;

        this._set_events();
        this._init();
    }

    _set_events()
    {
        // More in about dialog
        $("#about-dialog-more").on("click", (event) =>
        {
            event.preventDefault();

            const win = window.open("https://www.hydroffice.org/smartmap/main", "_blank");
            if(win)
            {
                //Browser has allowed it to be opened
                win.focus();
            } else
            {
                //Browser has blocked it
                BootstrapDialog.alert("First allow SmartMap to open popups!");
            }
        });

        // Manual in about dialog
        $("#about-dialog-manual").on("click", (event) =>
        {
            event.preventDefault();

            const win = window.open("https://www.hydroffice.org/manuals/smartmap_webgis/index.html", "_blank");
            if(win)
            {
                //Browser has allowed it to be opened
                win.focus();
            } else
            {
                //Browser has blocked it
                BootstrapDialog.alert("First allow SmartMap to open popups!");
            }
        });
    }

    _init()
    {
    }
}

