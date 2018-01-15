import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

import * as utils from "../utils.js";


export class InfoBar
{
    constructor(sm)
    {
        this.sm = sm;
        this._set_events();
        InfoBar._init();
    }

    _set_events()
    {
        // Handle info bar
        $("#info-bar-toggle").click( (event) =>
        {
            event.preventDefault();
            $("#info-bar").toggle();
        });
    }

    static _init()
    {
        // Hide the info bar (not in debug mode)
        if(!utils.debug)
        {
            $("#info-bar").show();
            utils.displayMessage(utils.versionString);
        }
    }
}
