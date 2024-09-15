import { rgbToHsv, rgbToHsl, highlightHslMap, rgbToHex } from "./utils.js";
import { highlightOnSphere } from "./scene.js";
// Setup the hover color picker and toggle it on button click
export function setupHoverColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker-hover');
    let isPicking = false;  
    let getColor;  
    let messageListener;  // To store and remove the message listener

    colorPickerBtn.addEventListener('click', async () => {
        if (isPicking) {
            // If picking is active, stop picking and remove event listeners
            isPicking = false;
            colorPickerBtn.textContent = 'Hover Picker'; // Update button text
            document.removeEventListener('mousemove', getColor);  // Remove hover listener

            // Remove the runtime message listener
            if (messageListener) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        } else {
            // If picking is not active, start picking
            isPicking = true;
            colorPickerBtn.textContent = 'Stop Hover Picker'; // Update button text

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                executeEyedropperScript(tab.id, dataUrl);
            });

            // Listen for color messages from the content script
            messageListener = (message) => {
                if (message.type === 'colorPicked') {
                    displayHoveredColor(message.color);
                }
            };
            chrome.runtime.onMessage.addListener(messageListener); // Attach listener
        }
    });

}

// Display the picked color in different formats (RGB, HSV, HSL)
function displayHoveredColor(rgbColor) {
    const colorDisplay = document.getElementById('color-display');
    const hlMap = document.getElementById('hl-map');
    const rgb = rgbColor.match(/\d+/g).map(Number);
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

    colorDisplay.innerHTML = `
        <div> 
            <div>RGB: ${rgbColor}</div>
            <div>HSV: ${hsv.h}°, ${hsv.s}%, ${hsv.v}%</div>
        </div>
        <div>
            <div>HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%</div>
            <div>Hex: ${hex} </div>
        </div>
    `;
    if (hlMap.style.display === "block") {
        highlightHslMap(hsl.h, hsl.s, hsl.l);
    }
    
    highlightOnSphere(hsl);
}

// Execute the eyedropper script with the captured screenshot
function executeEyedropperScript(tabId, dataUrl) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        args: [dataUrl],
        function: activateEyedropper
    });
}

//Adding listener to get the picked color even after popup closes
// chrome.runtime.onMessage.addListener((message) => {
//     if (message.type === 'colorPicked') {
//         chrome.storage.local.get('pickedColor', (data) => {
//             if (data.pickedColor) {
//                 displayHoveredColor(data.pickedColor);
//             }
//         });
//     }
// });

chrome.runtime.sendMessage({type: 'colorPicked'}, function(response) {
    if (chrome.runtime.lastError) {
        console.warn("No receiver found for message:", chrome.runtime.lastError.message);
    } else {
        console.log("Message sent successfully", response);
    }
});


function activateEyedropper(screenshotDataUrl) {
    const img = new Image();
    img.src = screenshotDataUrl;

    img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Function to get the color when mouse moves
        getColor = function (event) {
            try {
                const x = event.clientX;
                const y = event.clientY;

                const scaleX = img.width / window.innerWidth;
                const scaleY = img.height / window.innerHeight;

                const colorData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
                const rgbColor = `rgb(${colorData[0]}, ${colorData[1]}, ${colorData[2]})`;

                chrome.runtime.sendMessage({ type: 'colorPicked', color: rgbColor });
            } catch (error) {
                console.error('Error during color picking:', error);
            }
        };

        // Attach mousemove and click listeners to get color
        document.addEventListener('mousemove', getColor);
    };
    img.onerror = () => alert('Failed to load image for color picking.');
}