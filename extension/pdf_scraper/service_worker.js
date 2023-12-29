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
    chrome.action.setBadgeText({
      text: "OFF",
    });
    await setVariables('is_enabled_pdf', true);
    console.log("Service Worker installing.");
  }
});

// Register popup messages listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        /* getters */
  const promise = new Promise(async (resolve) => {
    var isEnabled = await getVariables('is_enabled_pdf');
    resolve(isEnabled)
  })
  promise.then((isEnabled) => {
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
  })

  const spinnerPromise = new Promise(async (resolve) => {
    var isSpinner = await getVariables('spinner');
    resolve(isSpinner)
  })
  spinnerPromise.then((isSpinner) => {
    if ('spinner' === request.set) {
      // if changed
      if (request.value !== isSpinner) {
        isSpinner = request.value;
        setVariables('spinner', isSpinner);
      }
    }
    if ('spinner' === request.get) {
      sendResponse({
        spinner: isSpinner
      });
    }
  })

  if ('send_html' === request.set) {
    const promiseSend = new Promise(async (resolve) => {
      let response = await fetch('https://saved-stallion-unique.ngrok-free.app/api/v1/'+ request.value.project+'/html',
                                 {method : 'POST',
                                  headers: {
			                            'Content-Type': 'application/json'
		                            },
		                            body: JSON.stringify(request.value)
                              });
      if (response.ok) {
        const result =  await new Response(response.body).text();
        resolve(result)
      }
      else {
        setVariables('spinner', false)
        sendResponse('OK');
      }
      })
      promiseSend.then((response) => {
        setVariables('spinner', false)
        sendResponse(response);
      }
      )
  }
  if ('get_tables' === request.get) {
    try {
      const promiseFetch = new Promise(async (resolve) => {
        let response = await fetch('https://saved-stallion-unique.ngrok-free.app/api/v1/get-tables', {method : "GET", mode: 'cors'});
        if (response.ok) {
          const result =  await response.json();
          resolve(result)
        }
      })
      promiseFetch.then((response) => {
        sendResponse(response);
      }
                       )
    }
    catch(error)  {
      console.error(`Error in load function for : ${error}`);
    };
  }

  return true
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
  console.log(`target ${tab.id}`, nextState)
  if (nextState === "ON") {
      // Insert the CSS file when the user turns the extension on
    await chrome.scripting
            .executeScript({
              target : {tabId : tab.id, allFrames : true},
              files : [ "./lib/js/jspdf.umd.min.js" ],
            })
            .then(injectionResults => {
              for (const {frameId, result} of injectionResults) {
                console.log(`Frame ${frameId} result:`, result);
              }

            }
                 )
  }
})
