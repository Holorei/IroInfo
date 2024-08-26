import { rgbToHsv, rgbToHsl, drawHslMap, highlightHslMap } from "./utils.js";

document.getElementById('color-picker').addEventListener('click', async () => {
    //console.log('Color picker button clicked');
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Capture the visible tab as an image
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
        //console.log('Captured visible tab');
        // Pass the captured image
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [dataUrl],
            function: activateEyedropper
        });
    });

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
        //console.log('Color picked:', message.color);
        if (message.type === 'colorPicked') {

            // Display the picked color
            const colorDisplay = document.getElementById('color-display');
            const rgb = message.color.match(/\d+/g).map(Number);
            const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
            const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

            //colorDisplay.style.backgroundColor = message.color;
            //colorDisplay.textContent = `Color: ${message.color}`;
            colorDisplay.innerHTML = `
                <div>RGB: ${message.color}</div>
                <div>HSV: ${hsv.h}°, ${hsv.s}%, ${hsv.v}%</div>
                <div>HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%</div>
            `;
            highlightHslMap(hsl.h, hsl.s, hsl.l);
        }
    });
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

        function getColor(event) {
            try {
                // location of mouse
                const x = event.clientX;
                const y = event.clientY;

                // Adjust coordinates to fit the image scale
                const scaleX = img.width / window.innerWidth;
                const scaleY = img.height / window.innerHeight;

                // Extract the color, pixel scailing required due to adjustable browser window pixels.
                // const colorData = ctx.getImageData(x, y, 1, 1).data;
                // const rgbColor = `rgb(${colorData[0]}, ${colorData[1]}, ${colorData[2]})`;

                const colorData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
                const rgbColor = `rgb(${colorData[0]}, ${colorData[1]}, ${colorData[2]})`;

                // Send the color data back to the popup script
                chrome.runtime.sendMessage({ type: 'colorPicked', color: rgbColor });
            } catch (error) {
                console.error('Error during color picking:', error);
            }
        }

        function stopEyedropper() {
            document.removeEventListener('mousemove', getColor);
            document.removeEventListener('click', stopEyedropper);
        }

        document.addEventListener('mousemove', getColor);
        document.addEventListener('click', stopEyedropper);
    };

    img.onerror = function () {
        alert('Failed to load image for color picking.');
    };
}


// Draw the HSL map when the popup loads
drawHslMap();