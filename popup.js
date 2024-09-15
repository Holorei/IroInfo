import {  drawHslMap, displayShortCuts, toggleMap } from "./assets/scripts/utils.js";
import { setupScene, setupSliderControl, animate, exportSceneAsGLTF } from "./assets/scripts/scene.js";
import { setupHoverColorPicker } from "./assets/scripts/hoverpicker.js";
import { setupColorPicker } from "./assets/scripts/colorpicker.js";


// Main initialization after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupHoverColorPicker();
    setupColorPicker()
    setupScene();
    setupSliderControl();
    displayShortCuts();
    toggleMap();
    drawHslMap();
    exportSceneAsGLTF();
    animate();
});