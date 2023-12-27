
function validateView(is_enabled) {

    chrome.runtime.sendMessage({"get": "current_state"}, function (response) {

    });
}

function loadlist(request) {
    console.log(request);
}

(function($) {

    // Switcher
    $(document).ready(function() {
        var checkbox = document.querySelector("input[id=toggleSwitch]");

        checkbox.addEventListener('change', function() {
            if (this.checked) {
               chrome.runtime.sendMessage({
                "set" : "is_enabled_pdf",
                "value": true
            });
                document.getElementById("togle").innerHTML="on";
                var inform     = document.getElementById('inform');
                inform.innerHTML = 'Плагин включен';
                inform.style.color = 'green';
                validateView(true);
            } else {
               chrome.runtime.sendMessage({
                "set" : "is_enabled_pdf",
                "value": false
            });
                document.getElementById("togle").innerHTML="off";
                var inform     = document.getElementById('inform');
                inform.innerHTML = 'Плагин выключен';
                inform.style.color = 'red';
                validateView(true);
            }
        });

        chrome.runtime.sendMessage(
            {
                "set": "get_tables"
            }, function (response) {
                if (response != undefined && response != "") {
                    loadlist(response);
                }

    });

    });

})(jQuery);
