chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'colorPicked') {
        // Store color and any other actions you need to perform
        chrome.storage.local.set({ pickedColor: message.color }, () => {
            console.log("Color stored successfully:", message.color);
        });
    }
});
