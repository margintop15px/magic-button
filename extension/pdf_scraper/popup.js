
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
    let selector = document.body.getElementsByTagName("main")[0].innerHTML
    window.postMessage(
        {type : "FROM_PAGE", text : selector}, "*");
    return selector
}

const bytesToBase64 = (bytes) => {
    var binString = '';
    for(var i = 0; i < Math.ceil(bytes.length / 32768.0); i++) {
        binString += String.fromCharCode.apply(null, bytes.slice(i * 32768, Math.min((i+1) * 32768, bytes.length)))
    }
  return btoa(binString);
}

function receiveText(resultsArray){
    console.log(resultsArray[0]);

    var pages = resultsArray[0].result;
    var e = document.getElementById("projects");
    var value = e.options[e.selectedIndex].value;
    chrome.runtime.sendMessage(
    {
        "set": "send_html",
        "html": bytesToBase64(new TextEncoder().encode(pages)),
        "project" : value
    })
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

var button = document.getElementById("send_pdf");
button.addEventListener('click', () => {

    let queryOptions = { active: true, currentWindow: true };
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

chrome.runtime.sendMessage({"get": "current_state"}, (response) => {
    if (typeof response !== "undefined") {
        checkbox.checked = response.is_enabled_pdf
        validateView(response.is_enabled_pdf)
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
    console.log("Content script received: " + event.data.text);
    port.postMessage(event.data.text);
  }
}, false);
