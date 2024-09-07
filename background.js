chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'colorPicked') {
        chrome.storage.local.get('pickedColor', (data) => {
            if (data.pickedColor) {
                sendResponse({color: data.pickedColor});
            } else {
                sendResponse({color: null});
            }
        });
        // keep the message channel open
        return true;
    }
});
