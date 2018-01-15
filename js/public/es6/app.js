import {SmartMap} from "./smartmap.js";

import {About} from "./bs/about.js";
import {BasePicker} from "./bs/basepicker.js";
import {DatePicker} from "./bs/datepicker.js";
import {InfoBar} from "./bs/infobar.js";
import {Legend} from "./bs/legend.js";
import {LineScale} from "./bs/linescale.js";
import {LocationTracker} from "./bs/locationtracker.js";
import {SourceExporter} from "./bs/sourceexporter.js";
import {SourcePicker} from "./bs/sourcepicker.js";
import {TransparencySlider} from "./bs/transparencyslider.js";
import {AnimationSlider} from "./bs/animationslider.js";
import {SurveyPlanner} from "./planner/surveyplanner.js";

import * as utils from "./utils.js";
import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;
require("bootstrap");
require("bootstrap-datepicker/dist/js/bootstrap-datepicker");


$(document).ready(function()
{
    "use strict";

    $("#about-dialog-version-tag").text(utils.versionString);

    const sm = new SmartMap();
    sm.scanServerCapabilities();

    new About(sm);
    new BasePicker(sm);
    new DatePicker(sm);
    new InfoBar(sm);
    new Legend(sm);
    new LineScale(sm);
    new LocationTracker(sm);
    new SourcePicker(sm);
    new SourceExporter(sm);
    new TransparencySlider(sm);
    new AnimationSlider(sm);
    new SurveyPlanner(sm);

});
