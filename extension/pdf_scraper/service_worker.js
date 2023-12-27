const environment = 'production';

function getVariables(key) {
  var value ;
  chrome.storage.local.get([key]).then((result) => {
    value = result[key];
  });
  return value;
}

function setVariables(name, value) {
  console.log({[name] : value});
  chrome.storage.local.set({[name] : value}).then(() => {
      console.log("Value is set");
    });
}

function initVariables(extensionRootTabId, extensionId, extensionPath, env) {

    setVariables('is_enabled_pdf', true)
}

async function start(tab) {
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: initVariables,
    args: [tab.id, chrome.runtime.id, chrome.runtime.getURL("/").replace(/\/$/, ""), environment]
  })
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['']
  });
  // }
}

self.addEventListener("install", event => {
  setVariables('is_enabled_pdf', true);
  console.log("Service Worker installing.");
});

// Register popup messages listener
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        /* getters */
       var isEnabled = getVariables('is_enabled_pdf');
        if ('is_enabled_pdf' === request.get) {
            sendResponse({
                is_enabled_pdf: isEnabled
            });
        }

        if ('current_state' === request.get) {
            sendResponse({
                is_enabled_pdf: isEnabled
            });
        }

        /* setters */
        if ('is_enabled_pdf' === request.set) {
            // if changed
            if (request.value !== isEnabled) {
                isEnabled = request.value;
                setVariables('is_enabled_pdf', isEnabled);
            }
        }

      if ('get_tables' === request.set) {
        fetch('/api/v1/get_tables').then(res => {
          res.json();
          sendResponse({items : []});
        }, err => {
          console.log(err);
        })
        .then(parseRooms, err => {
          console.log(err);
        })
      }
    });
