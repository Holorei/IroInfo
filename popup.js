import { rgbToHsv, rgbToHsl, drawHslMap, highlightHslMap, hexToRgb } from "./utils.js";
import { setupScene, setupSliderControl, animate, highlightOnSphere } from "./scene.js";


// Main initialization after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupHoverColorPicker();
    setupColorPicker()
    setupScene();
    setupSliderControl();
    drawHslMap();
    animate();
});


// Setup the color picker and handle the color picking process using the EyeDropper API
function setupColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker-click');

    // Check if the EyeDropper API is supported
    if (!window.EyeDropper) {
        alert("Your browser doesn't support the EyeDropper API.");
        return;
    }

    colorPickerBtn.addEventListener('click', async () => {
        try {
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            displayClickedColor(result.sRGBHex);  // Pass the picked color to display
        } catch (err) {
            console.error('Error using EyeDropper:', err);
        }
    });
}

// Display the picked color in different formats (RGB, HSV, HSL)
function displayClickedColor(sRGBHex) {
    const colorDisplay = document.getElementById('color-display');

    // Convert sRGB hex to RGB
    const rgb = hexToRgb(sRGBHex);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    colorDisplay.innerHTML = `
        <div>RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</div>
        <div>HSV: ${hsv.h}°, ${hsv.s}%, ${hsv.v}%</div>
        <div>HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%</div>
    `;

    highlightHslMap(hsl.h, hsl.s, hsl.l);
    highlightOnSphere(hsl);
}


// Setup the hover color picker and toggle it on button click
function setupHoverColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker-hover');
    let isPicking = false;  // Flag to track whether the hover color picker is active
    let getColor;  // Declare the getColor function outside so we can remove it later
    let messageListener;  // To store and remove the message listener

    colorPickerBtn.addEventListener('click', async () => {
        if (isPicking) {
            // If picking is active, stop picking and remove event listeners
            isPicking = false;
            colorPickerBtn.textContent = 'Start Hover Color Picker'; // Update button text
            document.removeEventListener('mousemove', getColor);  // Remove hover listener
            document.removeEventListener('click', stopEyedropper); // Remove click listener

            // Remove the runtime message listener
            if (messageListener) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        } else {
            // If picking is not active, start picking
            isPicking = true;
            colorPickerBtn.textContent = 'Stop Hover Color Picker'; // Update button text

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

function stopEyedropper() {
    if (isPicking) {
        document.removeEventListener('mousemove', getColor); // Remove hover listener
        document.removeEventListener('click', stopEyedropper); // Remove click listener
        isPicking = false;

        // Remove the runtime message listener if it exists
        if (messageListener) {
            chrome.runtime.onMessage.removeListener(messageListener);
        }
    }
}

// Display the picked color in different formats (RGB, HSV, HSL)
function displayHoveredColor(rgbColor) {
    const colorDisplay = document.getElementById('color-display');
    const rgb = rgbColor.match(/\d+/g).map(Number);
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

    colorDisplay.innerHTML = `
        <div>RGB: ${rgbColor}</div>
        <div>HSV: ${hsv.h}°, ${hsv.s}%, ${hsv.v}%</div>
        <div>HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%</div>
    `;

    highlightHslMap(hsl.h, hsl.s, hsl.l);
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

// Adding listener to get the picked color even after popup closes
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'colorPicked') {
        chrome.storage.local.get('pickedColor', (data) => {
            if (data.pickedColor) {
                displayHoveredColor(data.pickedColor);
            }
        });
    }
});


// Activate the eyedropper tool on the captured image
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
        document.addEventListener('click', stopEyedropper);
    };
    img.onerror = () => alert('Failed to load image for color picking.');
}
