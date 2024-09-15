import * as THREE from '../../lib/three.module.js';
import { GLTFExporter } from '../../lib/GLTFExporter.js';

let scene, camera, renderer, sphere, geometry, markers = [];

export function setupScene() {
    scene = new THREE.Scene();

    // For perspective Camera
    //camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    const aspect = 1; 
    const frustumSize = 2; 

    const left = -frustumSize / 2;
    const right = frustumSize / 2;
    const top = frustumSize / 2;
    const bottom = -frustumSize / 2;
    
    // For Orthographic Camera
    camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hsl-sphere'), antialias: true });
    scene.background = new THREE.Color(0xd9d9d9);
    renderer.setSize(240, 240);

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

// Highlight a specific color on the sphere based on HSL values
export function highlightOnSphere(hsl) {
    const h = hsl.h / 360; 
    const s = hsl.s / 100; 
    const l = hsl.l / 100;

    const radius = 1; 

    const y = (l * 2) - 1; // Map lightness (0 to 1) to Y position (-1 to 1)

    // Saturation (S) controls distance from Y-axis (XZ-plane)
    const distanceFromYAxis = s * Math.sqrt(1 - y * y); // Radial distance based on height (y)

    // Hue (H) controls the angle around the Y-axis (rotation in XZ-plane)
    const theta = h * Math.PI * 2; // Angle in radians

    // Calculate X and Z based on angle (theta) and radial distance
    const x = distanceFromYAxis * Math.cos(theta);
    const z = distanceFromYAxis * Math.sin(theta);

    const position = new THREE.Vector3(x, y, z);

    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h, s, l) });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    markerMesh.position.copy(position);

    sphere.add(markerMesh);
    markers.push(markerMesh);

    console.log("Marker added:", position);
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
                    THREE.MathUtils.degToRad(deltaMove.y * 0.5),
                    THREE.MathUtils.degToRad(deltaMove.x * 0.5),
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
    
    renderer.domElement.addEventListener('wheel', (event) => {
        const zoomSpeed = 0.0005;

        // For perspective Camera
        // camera.position.z += event.deltaY * zoomSpeed;
        // camera.position.z = Math.max(0.3, Math.min(3, camera.position.z));

        camera.zoom -= event.deltaY * zoomSpeed;
        camera.zoom = Math.max(0.5, Math.min(3, camera.zoom));  
        camera.updateProjectionMatrix();
    });
}

// Setup control sliders
export function setupSliderControl() {

    const transparencySlider = document.getElementById('transparency-slider');
    const transparencyValue = document.getElementById('transparency-value');

    transparencySlider.addEventListener('input', function () {
        const opacity = transparencySlider.value / 100;
        sphere.material.opacity = opacity;
        transparencyValue.textContent = transparencySlider.value;
    });

    const bgSlider = document.getElementById('bg-slider');
    const bgValue = document.getElementById('bg-value');
    bgSlider.addEventListener('input', function () {
        const lightness = bgSlider.value / 100;
        let hslColor = new THREE.Color(0xd9d9d9).getHSL({});
        hslColor.l = lightness;
        scene.background.setHSL(hslColor.h, hslColor.s, hslColor.l);
        bgValue.textContent = bgSlider.value;
    });

}


export function exportSceneAsGLTF() {
    const exportBtn = document.getElementById('export-model');
    const gltfExporter = new GLTFExporter();

    exportBtn.addEventListener('click', function () {
        const markersGroup = new THREE.Group();

        markers.forEach(marker => {
            markersGroup.add(marker);
        });

        gltfExporter.parse(
            markersGroup,
            function (result) {
                const json = JSON.stringify(result, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'scene.gltf'; 
                link.click();
            },
            { binary: true } 
        );
    });
}


// Animation loop
export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}