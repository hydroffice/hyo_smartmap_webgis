import $ from "jquery";


export const version = "2.0.0";
export const versionString = "Version " + version;
export const debug = true;


export let pad = (pad, str, padLeft) =>
{
    if(typeof str === "undefined")
    {
        return pad;
    }
    if(padLeft)
    {
        return (pad + str).slice(-pad.length);
    } else
    {
        return (str + pad).substring(0, pad.length);
    }
};

export let displayMessage = (str) =>
{
    if(debug)
    {
        console.debug(str);
    }
    $("#info-bar-message").text(str);
    setTimeout(function()
    {
        $("#info-bar-message").text("");
    }, 3000);
};

export let formatDateString = (date) =>
{
    let str = date.getFullYear();
    str += pad("00", date.getMonth() + 1, true);
    str += pad("00", date.getDate(), true);
    return str;
};

// Polyfill required by Array.find() on IE11
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if(!Array.prototype.find)
{
    Object.defineProperty(Array.prototype, "find", {
        value: function(predicate)
        {
            // 1. Let O be ? ToObject(this value).
            if(this === null)
            {
                throw new TypeError("this is null or not defined");
            }

            let o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            let len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if(typeof predicate !== "function")
            {
                throw new TypeError("predicate must be a function");
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            let thisArg = arguments[1];

            // 5. Let k be 0.
            let k = 0;

            // 6. Repeat, while k < len
            while(k < len)
            {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                let kValue = o[k];
                if(predicate.call(thisArg, kValue, k, o))
                {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        }
    });
}

export let isDateInDates = (dates, date) =>
{
    return !!dates.find(item =>
    {
        return item.getTime() === date.getTime();
    });
};

export let makeLegendDate = (date, with_day_of_week=false) =>
{
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed","Thu","Fri", "Sat"];

    if(with_day_of_week)
    {
        return "" + days[date.getDay()] + "," + date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
    }
    else
    {
        return "" + date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
    }
};

export let makeLegendMonth = (date) =>
{
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
        "November", "December"];
    return "" + months[date.getMonth()] + " ";
};

export let makeProductLayerName = (src, product, date) =>
{
    return src + "_" + product + "_" + formatDateString(date) + "_0000";
};

export let generateGuid = () =>
{
    let S4 = () =>
    {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4()/*+S4()*/ + "-" + S4() + "-" + S4()/*+"-"+S4()+"-"+S4()+S4()+S4()*/);
};

export let runEveryDay = (funct, hour) => {
    let now = new Date(),
        start,
        wait;

    if (now.getHours() < hour-1) {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, 0, 0, 0);
    }

    wait = start.getTime() - now.getTime();

    if(wait <= 0) { //If missed 8am before going into the setTimeout
        runEveryDay(funct, hour); //Retry
    } else {
        return setTimeout(() => { //Wait 8am
            funct();
            setInterval(() => {
                funct();
            }, 86400000); //Every day
        }, wait);
    }
};
