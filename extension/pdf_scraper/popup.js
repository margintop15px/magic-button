const button = document.getElementById("send_pdf")
const spinner = document.getElementById("spinner")

const validateView = async (is_enabled) => {
    var checkbox = document.querySelector("input[id=toggleSwitch]");
    if (is_enabled) {
        document.getElementById("togle").innerHTML="on";
        var inform     = document.getElementById('inform');
        inform.innerHTML = 'Плагин включен';
        inform.style.color = 'green';
    }
    else
    {
        document.getElementById("togle").innerHTML="off";
        var inform     = document.getElementById('inform');
        inform.innerHTML = 'Плагин выключен';
        inform.style.color = 'red';
    }
}

const spinnerView = async (isSpinner) => {
    if (isSpinner) {
        spinner.classList.remove("hidden")
        button.disabled = true
    }
    else
    {
        spinner.classList.add("hidden")
        button.disabled = false
    }
}

const loadlist = async(request) => {
    console.log(request);
    var selectElement = document.getElementById('projects')

    for (var i = 0; i <= request.length; i++) {
        selectElement.add(new Option(request[i].name, request[i].id))
    }
}

var checkbox = document.querySelector("input[id=toggleSwitch]");

checkbox.addEventListener('change', function() {

    if (this.checked) {
        chrome.runtime.sendMessage({
            "set" : "is_enabled_pdf",
            "value": true
        });
        validateView(true);
    } else {
        chrome.runtime.sendMessage({
            "set" : "is_enabled_pdf",
            "value": false
        });
        validateView(false);
    }
})

const domtostring = () => {
    const simulatedClick = (target, options) => {

        var event = target.ownerDocument.createEvent('MouseEvents'),
            options = options || {},
            opts = { // These are the default values, set up for un-modified left clicks
                type: 'click',
                canBubble: true,
                cancelable: true,
                view: target.ownerDocument.defaultView,
                detail: 1,
                screenX: 0, //The coordinates within the entire page
                screenY: 0,
                clientX: 0, //The coordinates within the viewport
                clientY: 0,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
                button: 0, //0 = left, 1 = middle, 2 = right
                relatedTarget: null,
            };

        //Merge the options with the defaults
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                opts[key] = options[key];
            }
        }

        //Pass in the options
        event.initMouseEvent(
            opts.type,
            opts.canBubble,
            opts.cancelable,
            opts.view,
            opts.detail,
            opts.screenX,
            opts.screenY,
            opts.clientX,
            opts.clientY,
            opts.ctrlKey,
            opts.altKey,
            opts.shiftKey,
            opts.metaKey,
            opts.button,
            opts.relatedTarget
        );

        //Fire the event
        target.dispatchEvent(event);
    }

    let selector = document.body.getElementsByTagName("main")[0].innerHTML
    /*/html/body/div[6]/div[3]/div/div/div[2]/div/div/main/section[1]/div[2]/div[2]/div[2]/span[2]/a*/
    var xPathContact = document.evaluate ('//html/body/div[6]/div[3]/div/div/div[2]/div/div/main/section[1]/div[2]/div[2]/div[2]/span[2]/a', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    //xPathContact.singleNodeValue.click()
    simulatedClick(xPathContact.singleNodeValue)
    var xPathPopUpContact = document.evaluate ('/html/body/div[3]/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML
    var xPathPopUpClose = document.evaluate ('/html/body/div[3]/div/div/button', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    //xPathPopUpClose.singleNodeValue.click()
    simulatedClick(xPathPopUpClose.singleNodeValue)
    window.postMessage(
        {type : "FROM_PAGE", value : {text : selector, url : window.location.href, contact : xPathPopUpContact}}, "*");
    return {text : selector, url : window.location.href, contact : xPathPopUpContact}
}

const bytesToBase64 = (bytes) => {
    var binString = '';
    for(var i = 0; i < Math.ceil(bytes.length / 32768.0); i++) {
        binString += String.fromCharCode.apply(null, bytes.slice(i * 32768, Math.min((i+1) * 32768, bytes.length)))
    }
  return btoa(binString);
}

const  receiveText = (resultsArray) => {
    const pages = resultsArray[0].result.text;
    const url = resultsArray[0].result.url;
    const contact = resultsArray[0].result.contact;
    var e = document.getElementById("projects");
    var value = e.options[e.selectedIndex].value;
    (async () => {
        const response = await chrome.runtime.sendMessage(
            {
                "set": "send_html",
                "value" : {
                    "html": bytesToBase64(new TextEncoder().encode(pages)),
                    "project": value,
                    "url": bytesToBase64(new TextEncoder().encode(url)),
                    "contact": bytesToBase64(new TextEncoder().encode(url)),
                }
            })
        console.log(response)
        await spinnerView(false)
    })()
    /*html2PDF(pages, {
            jsPDF: {
                format: 'a4',
            },
            imageType: 'image/jpeg',
            output: './pdf/generate.pdf'
        })
    */
    /*var doc = new jsPDF('p', 'pt', 'a4');
        var elementHandler = {
            '#ignorePDF': function (element, renderer) {
                return true;
            }
        };
    var source = resultsArray[0].result;
        doc.html(
            source,
            {x:10,
             y:10})
    doc.output("dataurlnewwindow");*/
}

button.addEventListener('click', () => {

    spinner.classList.remove("hidden")
    button.disabled = true

    chrome.runtime.sendMessage({
        "set" : "spinner",
        "value": true
    });

    let queryOptions = { active: true, currentWindow: true }

    chrome.tabs.query(queryOptions).then((tabs) => {
        var activeTabId = tabs[0];
        if (activeTabId) {
            return chrome.scripting.executeScript({
                target: { tabId: activeTabId.id },
                func: domtostring,
            }, receiveText)
        }
    }).then((results) => {

    }).catch((error) => {
        message = 'There was an error injecting script : \n' + error.message;
    });

})

chrome.runtime.sendMessage({"get": "current_state"}, async (response) => {
    if (typeof response !== "undefined") {
        checkbox.checked = response.is_enabled_pdf
        await validateView(response.is_enabled_pdf)
    }
})

chrome.runtime.sendMessage({"get": "spinner"}, async (response) => {
    if (typeof response !== "undefined") {
            await spinnerView(response.spinner)
    }
})

chrome.runtime.sendMessage(
    {
        "get": "get_tables"
    }, async (response) => {
        if (typeof response !== 'undefined' && response != "") {
            await loadlist(response);
        }

    })

//window.jsPDF = window.jspdf.jsPDF;

var port = chrome.runtime.connect();

window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type && (event.data.type === "FROM_PAGE")) {
      console.log("Content script received: " + event.data.value);
      port.postMessage(event.data.value);
  }
}, false);
