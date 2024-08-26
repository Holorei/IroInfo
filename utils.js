export function rgbToHsv(r, g, b) {
    // Normalise Rgb values
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta === 0) {
        hue = 0;
    } else if (max === r) {
        hue = ((g - b) / delta) % 6;
    } else if (max === g) {
        hue = (b - r) / delta + 2;
    } else {
        hue = (r - g) / delta + 4;
    }

    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    const value = Math.round(max * 100);
    const saturation = max === 0 ? 0 : Math.round((delta / max) * 100);

    return { h: hue, s: saturation, v: value };
}

export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta === 0) {
        hue = 0;
    } else if (max === r) {
        hue = ((g - b) / delta) % 6;
    } else if (max === g) {
        hue = (b - r) / delta + 2;
    } else {
        hue = (r - g) / delta + 4;
    }

    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    const lightness = (max + min) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

    return { h: hue, s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export function drawHslMap() {
    const canvas = document.getElementById('hsl-map');
    const ctx = canvas.getContext('2d');

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const hue = (x / canvas.width) * 360;
            const lightness = 100 - (y / canvas.height) * 100;
            ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

export function highlightHslMap(h, s, l) {
    const canvas = document.getElementById('hsl-map');
    const marker = document.getElementById('color-marker');
    const rect = canvas.getBoundingClientRect();  // Get the size and position of the canvas

    // Calculate the x and y position relative to the canvas size
    const x = (h / 360) * rect.width;
    const y = ((100 - l) / 100) * rect.height;

    console.log(`Highlighting HSL: h=${h}, s=${s}, l=${l}, x=${x}, y=${y}`);

    if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        // Position the marker relative to the canvas
        marker.style.left = `${rect.left + x - 5}px`; // Adjust for marker size
        marker.style.top = `${rect.top + y - 5}px`;  // Adjust for marker size
        marker.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
        marker.style.display = 'block';  // Ensure the marker is visible
    } else {
        console.error('Calculated marker position is out of bounds:', { x, y });
    }
}