import { rgbToHsv, rgbToHsl, drawHslMap, highlightHslMap } from "./utils.js";
import * as THREE from './lib/three.module.js';

// Main initialization after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupColorPicker();
    setupScene();
    setupSliderControl();
    drawHslMap();
    animate();
});

// Setup the color picker and handle the color picking process
function setupColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker');

    colorPickerBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            executeEyedropperScript(tab.id, dataUrl);
        });

        // Listen for color messages from the content script
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'colorPicked') {
                displayPickedColor(message.color);
            }
        });
    });
}

// Display the picked color in different formats (RGB, HSV, HSL)
function displayPickedColor(rgbColor) {
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
        
        function getColor(event, ctx, img) {
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
        }

        // Attach mousemove and click listeners to get color
        document.addEventListener('mousemove', (event) => getColor(event, ctx, img));
        document.addEventListener('click', stopEyedropper);
    };

    img.onerror = () => alert('Failed to load image for color picking.');
}

// Get color from the image based on mouse position


// Stop the eyedropper tool
function stopEyedropper() {
    document.removeEventListener('mousemove', getColor);
    document.removeEventListener('click', stopEyedropper);
}

// Scene, camera, and renderer setup for 3D view
let scene, camera, renderer, sphere, geometry;

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hsl-sphere'), antialias: true });
    renderer.setSize(250, 250);

    setupSphere();
    setupMouseControls();
    camera.position.z = 2;
}

// Set up the sphere and create an HSL color map on it
function setupSphere() {
    geometry = new THREE.SphereGeometry(1, 256, 256);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: false, transparent: true, opacity: 0.5 });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    addYAxis(sphere, 2);

    createHslColorMap();
}

function addYAxis(object, length) {
    const material = new THREE.LineBasicMaterial({ color: 999999 }); // Green Y-axis
    const points = [
        new THREE.Vector3(0, -length / 2, 0),  // Start point at -length/2 on the Y-axis
        new THREE.Vector3(0, length / 2, 0)    // End point at length/2 on the Y-axis
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const yAxis = new THREE.Line(geometry, material);

    object.add(yAxis);  // Add Y-axis to the object (sphere)
}

// Create the HSL color map on the sphere
function createHslColorMap() {
    const colors = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const x = geometry.attributes.position.getX(i);
        const y = geometry.attributes.position.getY(i);
        const z = geometry.attributes.position.getZ(i);

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(new THREE.Vector3(x, y, z));

        const h = THREE.MathUtils.radToDeg(spherical.theta) / 360;
        const l = 1 - (spherical.phi / Math.PI);
        const s = spherical.radius;

        const color = new THREE.Color();
        color.setHSL(h, s, l);
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

// Handle mouse controls to rotate the sphere
function setupMouseControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', () => isDragging = true);

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaMove = {
                x: event.offsetX - previousMousePosition.x,
                y: event.offsetY - previousMousePosition.y
            };

            const deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    THREE.MathUtils.degToRad(deltaMove.y * 0.3),
                    THREE.MathUtils.degToRad(deltaMove.x * 0.3),
                    0,
                    'XYZ'
                ));

            sphere.quaternion.multiplyQuaternions(deltaRotationQuaternion, sphere.quaternion);
        }

        previousMousePosition = {
            x: event.offsetX,
            y: event.offsetY
        };
    });

    document.addEventListener('mouseup', () => isDragging = false);
}

// Setup transparency control slider
function setupSliderControl() {
    const slider = document.getElementById('transparency-slider');
    slider.addEventListener('input', function () {
        const opacity = slider.value / 100;
        sphere.material.opacity = opacity;
        console.log("Sphere transparency set to:", opacity);
    });
}

// Highlight a specific color on the sphere based on HSL values
function highlightOnSphere(hsl) {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const spherical = new THREE.Spherical();
    spherical.theta = h * Math.PI * 2;
    spherical.phi = (1 - l) * Math.PI;
    spherical.radius = s;

    const position = new THREE.Vector3().setFromSpherical(spherical);

    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h, s, l) });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    markerMesh.position.copy(position);
    sphere.add(markerMesh);
    console.log("Marker added as a child of the sphere");
}

// Animation loop for rendering the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
