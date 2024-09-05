import { rgbToHsv, rgbToHsl, drawHslMap, highlightHslMap } from "./utils.js";
import * as THREE from './lib/three.module.js';

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

            colorDisplay.innerHTML = `
                <div>RGB: ${message.color}</div>
                <div>HSV: ${hsv.h}°, ${hsv.s}%, ${hsv.v}%</div>
                <div>HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%</div>
            `;
            highlightHslMap(hsl.h, hsl.s, hsl.l);
            highlightOnSphere(hsl);
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


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hsl-sphere') });
renderer.setSize(250, 250);

const geometry = new THREE.SphereGeometry(1, 256, 256);
const material = new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: false, transparent: true, opacity: 0.5 });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 2;


// Create the HSL color map on the sphere
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

// Mouse controls to rotate the sphere
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
});

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

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('transparency-slider');
    slider.addEventListener('input', function () {
        const opacity = slider.value / 100;
        sphere.material.opacity = opacity;
        console.log("Sphere transparency set to:", opacity);
    });
});


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

console.log(`Calculated theta`);
function highlightOnSphere(hsl) {
    const h = hsl.h / 360;  
    const s = hsl.s / 100;  
    const l = hsl.l / 100; 

    // Convert HSL to spherical coordinates
    const spherical = new THREE.Spherical();
    spherical.theta = h * Math.PI * 2;  // Theta based on hue
    spherical.phi = (1 - l) * Math.PI;  // Phi based on lightness 

    // Map saturation to radius: 0% -> center, 100% -> surface
    spherical.radius = s;  // Directly use saturation as radius

    // Calculate position
    const position = new THREE.Vector3().setFromSpherical(spherical);

    // Create the marker
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);  // Small sphere as marker
    const markerMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h, s, l) });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    // Set the position of the marker
    markerMesh.position.copy(position);

    // Attach the marker to the sphere
    if (typeof sphere !== 'undefined') {
        sphere.add(markerMesh);  // Make the marker a child of the sphere
        console.log("Marker added as a child of the sphere");  // Debug: Confirm marker is added to the sphere
    } else {
        console.error("Sphere is not defined.");
    }
}