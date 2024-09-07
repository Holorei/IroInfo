import { rgbToHsv, rgbToHsl, highlightHslMap, hexToRgb } from "./utils.js";
import { highlightOnSphere } from "./scene.js";

// Setup the color picker and handle the color picking process using the EyeDropper API
export function setupColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker-click');

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