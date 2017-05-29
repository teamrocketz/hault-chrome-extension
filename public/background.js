console.log('hello planet, from background script');
const tabs = chrome.tabs;
const storage = chrome.storage.local;
const history = chrome.history;

// A new URL has loaded in a tab
// tabs.onUpdated.addListener((tabId, changeInfo, tab) => {    // 'tab' is unused
tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && !changeInfo.url.match('chrome://')) {
    setTimeout(() => {
      history.deleteRange({
        startTime: new Date().getTime() - 30000,
        endTime: new Date().getTime() + 10000,
      }, () => {
        console.log('History cleared');
      });
    }, 4000);

    storage.set({ [tabId]: changeInfo.url }, () => {
      console.log('tab:url was added to local storage');
      console.log(`${changeInfo.url} will be sent to databse`);
    });

    fetch('http://localhost:3000/pageviews', {
      method: 'post',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        extension: true,
      },
      body: JSON.stringify({ url: changeInfo.url }),
    })
    .then((response) => {
      console.log('success!');
      console.log(response);
    })
    .catch((err) => {
      console.error(err);
    });
  }
});

// A tab has been closed
tabs.onRemoved.addListener((e) => {
  storage.remove([e.toString()]);
});

// Local storage has been modified from tab closure or a new URL
// chrome.storage.onChanged.addListener((changes, namespace) => {   // namespace unused 
chrome.storage.onChanged.addListener((changes) => {
  changes.keys.forEach((key) => {
    const storageChange = changes[key];
    if (!!storageChange.oldValue) {//does this need to be changed?
      console.log(`Storage key ${key} in storage was changed from ${storageChange.oldValue} to ${storageChange.newValue}`);
      console.log(`${storageChange.oldValue} needs to be updated to inactive in the database!`);
    }
  });
});

// History has been removed
history.onVisitRemoved.addListener((e) => {
  console.log('Item has been removed from history successfully');
  console.log(e);
});

// Keeping this here for popup:background communication
chrome.extension.onConnect.addListener((port) => {
  console.log('Connected .....');
  port.onMessage.addListener((msg) => {
    console.log(`message recieved ${msg}`);
    port.postMessage('Hi Popup.js');
  });
});
