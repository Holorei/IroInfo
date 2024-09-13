import * as THREE from './lib/three.module.js';
// Scene, camera, and renderer setup for 3D view
let scene, camera, renderer, sphere, geometry;

export function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hsl-sphere'), antialias: true });
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
    
    renderer.domElement.addEventListener('wheel', (event) => {
        const zoomSpeed = 0.0005;

        camera.position.z += event.deltaY * zoomSpeed;

        // Clamp the zoom to prevent excessive zoom in or out
        camera.position.z = Math.max(0.3, Math.min(3, camera.position.z));
    });
}

// Setup transparency control slider
export function setupSliderControl() {
    const slider = document.getElementById('transparency-slider');
    slider.addEventListener('input', function () {
        const opacity = slider.value / 100;
        sphere.material.opacity = opacity;
        console.log("Sphere transparency set to:", opacity);
    });
}

// Highlight a specific color on the sphere based on HSL values
export function highlightOnSphere(hsl) {
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
    console.log("Marker added");
}

// Animation loop
export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}