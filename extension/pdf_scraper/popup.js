
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

(function($) {

    // Switcher
    $(document).ready(function() {
        var checkbox = document.querySelector("input[id=toggleSwitch]");

        checkbox.addEventListener('change', async function() {
            if (this.checked) {
               chrome.runtime.sendMessage({
                "set" : "is_enabled_pdf",
                "value": true
            });
                await validateView(true);
            } else {
               chrome.runtime.sendMessage({
                "set" : "is_enabled_pdf",
                "value": false
            });
                await validateView(true);
            }
        });

        chrome.runtime.sendMessage({"get": "current_state"}, async (response) => {
            console.log('current_state')
            console.log(response)
            await validateView(response)
        });

    chrome.runtime.sendMessage(
            {
                "set": "get_tables"
            }, async (response) => {
                if (response != undefined && response != "") {
                    await loadlist(response);
                }

    })

    });

})(jQuery);
