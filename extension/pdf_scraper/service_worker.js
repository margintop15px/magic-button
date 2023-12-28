const environment = 'production';

async function getVariables(key) {
  var value ;
  await chrome.storage.local.get([key]).then((result) => {
    value = result[key];
  });
  return value;
}

async function setVariables(name, value) {
  console.log({[name] : value});
  await chrome.storage.local.set({[name] : value}).then(() => {
      console.log("Value is set");
    });
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await setVariables('is_enabled_pdf', true);
    console.log("Service Worker installing.");
  }
});

// Register popup messages listener
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        /* getters */
       var isEnabled = await getVariables('is_enabled_pdf');
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
        let response = await fetch('http://localhost:3000/api/v1/get-tables', {method : "GET", mode: 'cors'});
        try {
         if (response.ok) {
             const result =  await response.json();
           sendResponse(result);
         }
          else if (response.status == 404 ){
            sendResponse({
                items : []
            });
          }
          else {
             throw new Error(`Request failed with status ${response.status}`);
         }
     }
     catch(error)  {
         console.error(`Error in load function for : ${error}`);

     };


    }
    });

chrome.action.onClicked.addListener(async (tab) => {
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });

  if (nextState === "ON") {
      // Insert the CSS file when the user turns the extension on
      chrome.scripting
            .executeScript({
              target : {tabId : getTabId()},
              files : [ "lib/js/jspdf.umd.min.js" ],
            })
            .then(() => console.log("script injected"));
    }
  }
                                   );
