import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;

import * as common from "../common.js";
import * as utils from "../utils.js";

let BootstrapDialog = require("bootstrap3-dialog/dist/js/bootstrap-dialog.js");

export class AnimationSlider
{
    constructor(sm)
    {
        this.sm = sm;
        this.toggle = $("#animation-slider-toggle");
        this.slider = $("#animation-slider[type='range']");
        this.value = $("#animation-slider-value");
        this.bar = $("#animation-slider-bar");
        this.transparencyBar = $("#transparency-slider-bar");
        this.validSteps = 0;

        this.play = $("#animation-slider-play");
        this.playInterval = null;
        this.framerate = $("#play-config-slider");
        this.framerateSpeed = $("#play-config-speed");

        this.autoUpdate = $("#play-config-auto-checkbox");
        this.autoCurrentDate = new Date();
        this.autoUpdateInterval = null;

        this._set_events();
        this._init();
    }

    populate()
    {
        let selectedDate = $(".input-group.date")[0].childNodes[1].value;
        let date = new Date(selectedDate);
        this.sm.source = $("input[name=sourceDataRadios]:checked").val();
        if(utils.debug)
        {
            console.debug("cur selection: " + this.sm.source + ", " + date);
        }

        if(this.sm.source === "rtofs")
        {
            if(!utils.isDateInDates(this.sm.rtofsQfDates, date))
            {
                BootstrapDialog.alert("Selected date is not present as RTOFS source.");
                return;
            }
        }
        this.sm.reloadSourceData(date, this.sm.source);

        for(let step = 1; step < 8; step++)
        {
            const newDate = new Date(date);
            newDate.setDate(date.getDate() + step);
            console.debug("step " + step + ": " + newDate);

            if(this.sm.source === "rtofs")
            {
                if(!utils.isDateInDates(this.sm.rtofsQfDates, newDate))
                {
                    console.debug("Date not present as RTOFS source: " + newDate);
                    continue;
                }
            }
            this.sm.appendSourceData(newDate, this.sm.source);
        }
    }

    startAnimation()
    {
        return new Promise((resolve) => {
        
            if(this.sm.source === "woa13")
            {
                BootstrapDialog.alert("WOA13 source has monthly temporal resolution!");
            }

            this.populate();

            const framerateVal = parseInt(this.framerate.val());
            let delay = 1000 / (framerateVal * 0.25);
            this.playInterval = setInterval(() => this._advance_layer(), delay);

            // hide date picker
            $("li#dropdown-menu-date-picker").hide();
            
            this.play.find("i").removeClass("fa-play").addClass("fa-stop");
            
            resolve("Success for startAnimation");
        });
    }

    stopAnimation()
    {
        return new Promise((resolve) => {
            // set the slider to step zero
            const minLyr = parseInt(this.slider.attr("min"));
            this.slider.val(minLyr);
            this.slider.change();

            // clear the interval
            clearInterval(this.playInterval);
            this.playInterval = null;

            // re-show date picker
            $("li#dropdown-menu-date-picker").show();
            
            this.play.find("i").removeClass("fa-stop").addClass("fa-play");
            
            resolve("Success for stopAnimation");
        });
    }

    restartAnimation()
    {
        if(this.isPlaying())
        {
            this.stopAnimation().then(() => { return this.startAnimation();});
        }
    }

    isPlaying()
    {
        return this.playInterval !== null;
    }

    _advance_layer()
    {
        const currentLyr = parseInt(this.slider.val());
        const maxLyr = parseInt(this.slider.attr("max"));
        const minLyr = parseInt(this.slider.attr("min"));
        let nextLyr;
        if(currentLyr === maxLyr)
        {
            nextLyr = minLyr;
        }
        else
        {
            nextLyr = currentLyr + 1;
        }
        this.slider.val(nextLyr);
        this.slider.change();
    }

    _set_events()
    {
        this.toggle.on("click", (event) =>
        {
            event.preventDefault();

            if(this.bar.is(":hidden"))
            {
                if(this.transparencyBar.is(":visible"))
                {
                    this.transparencyBar.hide();
                }

                this.populate();
                this.bar.show();
            }
            else
            {
                this.bar.hide();
            }
        });

        this.play.on("click", (event) =>
        {
            event.preventDefault();

            if(!this.isPlaying())
            {
                this.startAnimation();
            }
            else
            {
                this.stopAnimation();
            }
        });

        this.autoUpdate.change(() => 
        {
            if(this.autoUpdate.prop("checked")) 
            {
                // create interval
                this.autoUpdateInterval = setInterval(() => {

                    // to avoid that the animation restarts once stopped by the user
                    if(this.playInterval === null)
                    {
                        return;
                    }

                    // update date
                    let tempDate = new Date();
                    if(tempDate.toDateString() !== this.autoCurrentDate.toDateString())
                    {
                        this.autoCurrentDate = tempDate;
                        this._rescan();
                    }

                }, 86400000/24); // every hour
            }
            else 
            {
                // clear the interval
                clearInterval(this.autoUpdateInterval);
                this.autoUpdateInterval = null;
            }
        });

        this.framerate.change(() =>
        {
            this.stopAnimation();
            const framerateVal = parseFloat(this.framerate.val());
            let framerateSpeed = framerateVal * 0.25;
            this.framerateSpeed.html(framerateSpeed.toString());
        });

        this.slider.change(() =>
        {
            const value = parseInt(this.slider.val());

            let selectedDate = $(".input-group.date")[0].childNodes[1].value;
            let date = new Date(selectedDate);
            const newDate = new Date(date);
            newDate.setDate(date.getDate() + value);
            console.debug("step " + value + ": " + newDate);

            this.value.text("[step: " + value + "] " + utils.makeLegendDate(newDate, true));
            this.sm.updateLegend(newDate);

            let counter = 0;
            this.sm.map.getLayers().forEach((lyr) =>
            {
                if(lyr.type === common.LayerType.BASE)
                {
                    return;
                }
                if(lyr.type === common.LayerType.GEOLOC)
                {
                    return;
                }
                if(lyr.type === common.LayerType.SOURCE)
                {
                    if(value === 0)
                    {
                        lyr.setVisible(true);
                    }
                    else
                    {
                        lyr.setVisible(false);
                    }
                    return;
                }
                if(lyr.type === common.LayerType.SOURCE_STEP)
                {
                    counter += 1;

                    if(value === counter)
                    {
                        lyr.setVisible(true);
                    }
                    else
                    {
                        lyr.setVisible(false);
                    }
                    return;
                }
            });
        });
    }

    _init()
    {
        if(typeof this.sm === "undefined")
        {
            setTimeout(this._init.bind(this), 250);
            return;
        }
        if(!this.sm.resourcesLoaded)
        {
            setTimeout(this._init.bind(this), 250);
            return;
        }
        // this.populate();

        const value = parseInt(this.slider.val());

        let selectedDate = $(".input-group.date")[0].childNodes[1].value;
        let date = new Date(selectedDate);
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + value);
        // console.debug("step " + value + ": " + newDate);
        this.value.text("[step: " + value + "] " + utils.makeLegendDate(newDate, true));

        this.bar.show();
    }

    _rescan()
    {
        console.debug("refresh server capabilities");

        this.stopAnimation()
        .then(() => {
            return this.sm.scanServerCapabilities();
        })
        .then(
        (result) => {
            console.debug("success in _rescan: " + result);
            this.startAnimation();
        },
        (error) => {
            console.debug("error in _rescan: " + error);
        });
    }
}
