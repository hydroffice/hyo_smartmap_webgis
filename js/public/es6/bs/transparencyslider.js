import $ from "jquery";
import jQuery from "jquery";
window.$ = $;
window.jQuery = jQuery;
import * as common from "../common.js";


export class TransparencySlider
{
    constructor(sm)
    {
        this.sm = sm;
        this.toggle = $("#transparency-slider-toggle");
        this.slider = $("#transparency-slider[type='range']");
        this.value = $("#transparency-slider-value");
        this.bar = $("#transparency-slider-bar");
        this.animationBar = $("#animation-slider-bar");

        this._set_events();
        this._init();
    }

    _set_events()
    {
        this.toggle.on("click", (event) =>
        {
            event.preventDefault();

            if(this.bar.is(":hidden"))
            {
                if(this.animationBar.is(":visible"))
                {
                    this.animationBar.hide();
                }
                this.bar.show();
            }
            else
            {
                this.bar.hide();
            }
        });

        this.slider.change(() =>
        {
            this.sm.transparency = this.slider.val();
            this.value.text("Transparency: " + this.sm.transparency + ".0%");

            let counter = 0;
            this.sm.map.getLayers().forEach((lyr) =>
            {
                if(counter === 0)
                {  // skip base map
                    counter += 1;
                    return;
                }

                if((lyr.type === common.LayerType.SOURCE) || (lyr.type === common.LayerType.SOURCE_STEP))
                {
                    // console.debug(lyr.id);
                    lyr.setOpacity((100 - this.sm.transparency) / 100);
                }
                counter += 1;
            });
        });
    }

    _init()
    {
        this.slider.val(this.sm.transparency);
        this.value.text("Transparency: " + this.sm.transparency + ".0%");
        this.bar.hide();
    }
}
