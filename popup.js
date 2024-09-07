import { rgbToHsv, rgbToHsl, drawHslMap, highlightHslMap, hexToRgb } from "./utils.js";
import { setupScene, setupSliderControl, animate, highlightOnSphere } from "./scene.js";
import { setupHoverColorPicker } from "./hoverpicker.js";
import { setupColorPicker } from "./colorpicker.js";


// Main initialization after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupHoverColorPicker();
    setupColorPicker()
    setupScene();
    setupSliderControl();
    drawHslMap();
    animate();
});