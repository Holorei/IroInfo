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

export function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

export function rgbToHex(r, g, b) {
    const redHex = r.toString(16).padStart(2, '0');
    const greenHex = g.toString(16).padStart(2, '0');
    const blueHex = b.toString(16).padStart(2, '0');
    
    return `#${redHex}${greenHex}${blueHex}`;
}

export function drawHslMap() {
    const canvas = document.getElementById('hl-map');
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
    const canvas = document.getElementById('hl-map');
    const rect = canvas.getBoundingClientRect(); // Get the size and position of the canvas

    // Calculate the x and y position relative to the canvas size
    const x = (h / 360) * rect.width;
    const y = ((100 - l) / 100) * rect.height;

    console.log(`Highlighting HSL: h=${h}, s=${s}, l=${l}, x=${x}, y=${y}`);

    if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        // Create a new marker element
        const newMarker = document.createElement('div');

        newMarker.classList.add('color-marker');
        newMarker.style.position = 'absolute';
        newMarker.style.left = `${rect.left + x - 5}px`; // Adjust for marker size
        newMarker.style.top = `${rect.top + y - 5}px`;   // Adjust for marker size
        newMarker.style.width = '0.5rem';
        newMarker.style.height = '0.5rem';
        newMarker.style.borderRadius = '30%';
        newMarker.style.border = '0.01rem solid black';
        newMarker.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;

        newMarker.classList.add('marker-for-hl-map');

        canvas.parentElement.appendChild(newMarker);
    } else {
        console.error('Calculated marker position is out of bounds:', { x, y });
    }
}


export function displayShortCuts(){

    document.addEventListener('keydown', function (event) {
        if (event.altKey && event.key === 'h') {
            document.getElementById('color-picker-hover').click();
        }
        
        if (event.altKey && event.key === 'c') {
            document.getElementById('color-picker-click').click();
        }
    });
}

export function toggleMap(){

    const hlMapLabel = document.getElementById('hl-map-label');
    const hlMap = document.getElementById('hl-map');
    console.log(hlMap.style.display)

    
    hlMapLabel.addEventListener('click', function() {
        const markers = document.querySelectorAll('.marker-for-hl-map');
        
        if (hlMap.style.display === "none" || hlMap.style.display === "") {
            hlMap.style.display = "block"; 
            markers.forEach(marker => marker.style.display = 'block');
        } else {
            hlMap.style.display = "none";  
            markers.forEach(marker => marker.style.display = 'none');
        }
    });
}

