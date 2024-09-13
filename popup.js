import {  drawHslMap, displayShortCuts, toggleMap } from "./utils.js";
import { setupScene, setupSliderControl, animate } from "./scene.js";
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
    displayShortCuts();
    toggleMap();
});