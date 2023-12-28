
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

var button = document.getElementById("send_pdf");
button.addEventListener('click', async function() {

    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    const printPdf = () => {
        var doc = new jsPDF();
        console.log('!!!')
        var elementHandler = {
            '#ignorePDF': function (element, renderer) {
                return true;
            }
        };
        var source = window.document.getElementsByTagName("body")[0];
        doc.fromHTML(
            source,
            15,
            15,
            {
                'width': 180,'elementHandlers': elementHandler
            });

        doc.output("dataurlnewwindow");
    }

    chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: printPdf
    }).then(() => console.log('Injected a function!'));
})

chrome.runtime.sendMessage({"get": "current_state"}, (response) => {
    if (typeof response !== "undefined") {
        checkbox.checked = response.is_enabled_pdf
        validateView(response.is_enabled_pdf)

    }
})

chrome.runtime.sendMessage(
    {
        "set": "get_tables"
    }, async (response) => {
        if (response != undefined && response != "") {
            await loadlist(response);
        }

    })
