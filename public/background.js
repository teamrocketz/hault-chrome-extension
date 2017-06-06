// https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extensionconsole.log('hello planet, from background script');
const tabs = chrome.tabs;
const storage = chrome.storage.local;
const history = chrome.history;
const windows = chrome.windows;
let config;

// ------extension production/development routes------
const dev = 'http://localhost:3000/';
const prod = 'https://hault.herokuapp.com/';

chrome.management.getSelf((result) => {
  if (result.installType === 'development') {
    config = dev;
  } else {
    config = prod;
  }
});
// ------extension production/development routes------

const snippets = {};
const sendSnippet = (page) => {
  if (page.snippet.length > 0) {
    console.log(Object.keys(snippets).length);
    console.log(page.snippet);
    snippets[page.url] = page.snippet;
  } else {
    snippets[page.url] = '';
  }
};

const scrapeHTML = (tabId, changeInfo, tab) => {
  if (tab.id) {
    chrome.tabs.executeScript(tab.id, {
      file: scraper.js, // eslint-disable-line no-undef
    });
  }
};


const tabUpdate = (tabId, changeInfo, tab) => {
  setTimeout(() => {
    history.deleteRange({
      startTime: Date.now() - 30000,
      endTime: Date.now() + 10000,
    }, () => {
      console.log('-----History cleared-----');
    });
  }, 4000);

  const validUpdate = tab.status === 'complete'
                   && !tab.title.match(' messaged you') // Could pair this with url matching facebook
                   && (!tab.url.match('chrome://') && !tab.url.match('localhost:') && !tab.url.match('about://'))
                   && tab.url
                   && tab.title
                   && tab.favIconUrl;
                   // && snippets[tab.url] !== undefined;
                   // && !tab.url.match(tab.title)
  if (validUpdate) {
    console.log(tab.id);
    console.log(tab.id);
    console.log(tab.id);
    console.log(tab.id);
    fetch(`${config}pageviews/visitpage`, {
      method: 'post',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        extension: true,
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        icon: tab.favIconUrl,
        snippet: snippets[tab.url],
      }),
    })
    .then(response =>
      response.json(),
    )
    .then((data) => {
      delete snippets[tab.url];
      if (!data.err) {
        delete snippets[tab.url];
        storage.set({ [tabId]: { url: tab.url, DBid: data.id } }, () => {
          console.log(`[${tabId}]: { url: ${tab.url}, DBid: ${data.id} } ...NOW IN LOCAL STORAGE`);
          console.log(`${tab.url} will be sent to databse`);
        });
      } else {
        console.log('Duplicate entry, local storage unchanged');
      }
    })
    .catch((err) => {
      console.error(err);
    });
  }
};

const tabRemoved = (e) => {
  console.log('TAB REMOVED');
  storage.remove([e.toString()]);
};

const storageChanged = (changes) => {
  windows.getAll((browsers) => {
    if (browsers.length > 0) {
      Object.keys(changes).forEach((key) => {
        const storageChange = changes[key];
        if (storageChange.oldValue !== undefined) {
          fetch(`${config}pageviews/deactivate`, {
            method: 'post',
            credentials: 'include',
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              extension: true,
            },
            body: JSON.stringify({
              url: storageChange.oldValue.url,
              id: storageChange.oldValue.DBid,
            }),
          })
          .then(() => {
            console.log(`${storageChange.oldValue.url} Updated to inactive in DB`);
          })
          .catch((err) => {
            console.error(err);
          });
        }
      });
    }
  });
};


// A new URL has loaded in a tab
tabs.onUpdated.addListener(tabUpdate);
tabs.onUpdated.addListener(scrapeHTML);

// A tab has been closed
tabs.onRemoved.addListener(tabRemoved);

// Storage has been edited
chrome.storage.onChanged.addListener(storageChanged);

// // A message has been received from scraper.js
chrome.runtime.onMessage.addListener(sendSnippet);

// // History has been removed
// history.onVisitRemoved.addListener(() => {
//   console.log('Item has been removed from history successfully');
// });


// A new window has been opened
windows.onCreated.addListener(() => {
  windows.getAll((browsers) => {
    if (browsers.length === 1) {
      console.log('first window opened, adding storage event listener');
      chrome.storage.onChanged.addListener(storageChanged);
    }
  });
});

// // Please keep this here for popup:background communication
// chrome.extension.onConnect.addListener((port) => {
//   port.onMessage.addListener((msg) => {
//     console.log(msg);
//   });
// });

