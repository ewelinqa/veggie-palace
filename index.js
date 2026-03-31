// Default plant palette
const defaultPlants = [
    { emoji: '🌹', name: 'Rose', type: 'flower' },
    { emoji: '🌷', name: 'Tulip', type: 'flower' },
    { emoji: '🌻', name: 'Sunflower', type: 'flower' },
    { emoji: '🌺', name: 'Hibiscus', type: 'flower' },
    { emoji: '🌳', name: 'Tree', type: 'tree' },
    { emoji: '🌲', name: 'Pine', type: 'tree' },
    { emoji: '🍒', name: 'Cherry', type: 'tree' },
    { emoji: '🍎', name: 'Apple Tree', type: 'tree' },
    { emoji: '🌿', name: 'Shrub', type: 'shrub' },
    { emoji: '🪴', name: 'Potted', type: 'shrub' },
    { emoji: '🌾', name: 'Grass', type: 'grass' },
    { emoji: '💐', name: 'Mixed', type: 'flower' },
    { emoji: '🥕', name: 'Carrot', type: 'vegetable' },
    { emoji: '🍅', name: 'Tomato', type: 'vegetable' },
    { emoji: '🥬', name: 'Lettuce', type: 'vegetable' },
    { emoji: '🫑', name: 'Pepper', type: 'vegetable' },
    { emoji: '🌱', name: 'Seedling', type: 'herb' },
    { emoji: '🪻', name: 'Lavender', type: 'flower' },
    { emoji: '🪨', name: 'Rock', type: 'structure' },
    { emoji: '❓', name: 'Unknown', type: 'shrub' },
];

// Garden photos - first 7 are front yard
const photos = [
    { file: '17299.jpg', yard: 'front' },
    { file: '17302.jpg', yard: 'front' },
    { file: '17305.jpg', yard: 'front' },
    { file: '17308.jpg', yard: 'front' },
    { file: '17311.jpg', yard: 'front' },
    { file: '17314.jpg', yard: 'front' },
    { file: '17317.jpg', yard: 'front' },
    { file: '17320.jpg', yard: 'back' },
    { file: '17323.jpg', yard: 'back' },
    { file: '17326.jpg', yard: 'back' },
    { file: '17329.jpg', yard: 'back' }
];

// Front yard: extended grid with surroundings
// Each cell = 1m × 1m
// Original yard: 33×18, with 1m margins for paths/neighbors
const GRID_COLS = 35;  // 1 + 33 + 1
const GRID_ROWS = 20;  // 1 + 18 + 1
const YARD_OFFSET_COL = 1;  // Yard starts at column 1
const YARD_OFFSET_ROW = 1;  // Yard starts at row 1

// Zone definitions - original yard layout preserved
// Outside yard area: neighbor or street
// Inside yard (offset by 1):
// Gravel: rows 0-3, cols 0-2
// Stairs: rows 0-3, col 19
// Toolshed: rows 0-2, cols 0-1
// Top foil: rows 0-3, cols 3-32 (excluding stairs)
// Left foil: rows 4-14, cols 0-2
// Lawn: rows 4-14, cols 3-26
// Right foil: rows 4-17, cols 27-32
// Bottom foil: rows 15-17, cols 0-26
// Veggie Palace: rows 7-10, cols 30-32

function getZone(row, col) {
    // Check if outside yard boundaries
    const inYard = row >= YARD_OFFSET_ROW && row < YARD_OFFSET_ROW + 18 &&
                  col >= YARD_OFFSET_COL && col < YARD_OFFSET_COL + 33;

    if (!inYard) {
        // Top row = street/path
        if (row < YARD_OFFSET_ROW) return 'street';
        // Other areas = neighbor
        return 'neighbor';
    }

    // Translate to yard-relative coordinates
    const yRow = row - YARD_OFFSET_ROW;
    const yCol = col - YARD_OFFSET_COL;

    // Veggie Palace (3 cols × 4 rows)
    if (yRow >= 7 && yRow <= 10 && yCol >= 30 && yCol <= 32) return 'veggie-palace';
    // Toolshed (2 cols × 3 rows)
    if (yRow >= 0 && yRow <= 2 && yCol >= 0 && yCol <= 1) return 'toolshed';
    // Stairs (column 19, rows 0-3)
    if (yRow >= 0 && yRow <= 3 && yCol === 19) return 'stairs';
    // Gravel area (top-left, excluding toolshed)
    if (yRow >= 0 && yRow <= 3 && yCol >= 0 && yCol <= 2) return 'gravel';
    // Top foil (excluding stairs at col 19)
    if (yRow >= 0 && yRow <= 3 && yCol >= 3 && yCol <= 32 && yCol !== 19) return 'top-foil';
    // Left foil
    if (yRow >= 4 && yRow <= 14 && yCol >= 0 && yCol <= 2) return 'left-foil';
    // Right foil
    if (yRow >= 4 && yRow <= 17 && yCol >= 27 && yCol <= 32) return 'right-foil';
    // Bottom foil
    if (yRow >= 15 && yRow <= 17 && yCol >= 0 && yCol <= 26) return 'bottom-foil';
    // Lawn (center)
    if (yRow >= 4 && yRow <= 14 && yCol >= 3 && yCol <= 26) return 'lawn';

    return 'unknown';
}

// State
let selectedPlant = null;
let selectedZone = null;  // For painting zones
let selectedCells = new Set();  // For multi-select
let copiedCellData = null;      // For copy/paste
let gardenData = {
    frontYard: {
        cells: {},  // key: "row-col", value: plant data
        zones: {}   // key: "row-col", value: zone type (overrides default)
    },
    yard2: { cols: 8, rows: 6, cells: {} },
    customPlants: [],
    workLog: []
};
let editingCell = null;

// Select zone for painting
function selectZone(zone) {
    selectedZone = zone;
    selectedPlant = null;
    updateModeIndicator();
    renderPalette();
    renderZonePalette();
}

// Clear zone selection (back to plant mode)
function clearZoneSelection() {
    selectedZone = null;
    updateModeIndicator();
    renderZonePalette();
}

// Update mode indicator
function updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (selectedZone) {
        indicator.textContent = '🎨 Zone Mode: ' + selectedZone;
        indicator.className = 'mode-indicator zone-mode';
    } else {
        indicator.textContent = '🌱 Plant Mode';
        indicator.className = 'mode-indicator plant-mode';
    }
}

// Render zone palette
function renderZonePalette() {
    document.querySelectorAll('.zone-btn').forEach(btn => {
        const zone = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        btn.classList.toggle('selected', selectedZone === zone);
    });
}

// Get cell zone (custom or default)
function getCellZone(row, col) {
    const cellId = `${row}-${col}`;
    // Check if custom zone is set
    if (gardenData.frontYard.zones && gardenData.frontYard.zones[cellId]) {
        return gardenData.frontYard.zones[cellId];
    }
    // Return default zone
    const defaultZone = getZone(row, col);
    // Normalize zone names for CSS
    if (defaultZone === 'lawn') return 'grass';
    if (defaultZone === 'top-foil' || defaultZone === 'left-foil' ||
        defaultZone === 'right-foil' || defaultZone === 'bottom-foil') return 'foil';
    return defaultZone;
}

// Shared refresh helpers
function refreshFrontYard() {
    renderFrontYard();
    updateStats();
    saveData();
}

function refreshBackYard(yardId) {
    updateSimpleGrid(yardId);
    updateStats();
    saveData();
}

// Initialize
async function init() {
    await loadData();
    renderPalette();
    renderPhotos();
    renderFrontYard();
    updateSimpleGrid('yard2');
    updateStats();
    renderCalendar();
    document.getElementById('work-date-input').valueAsDate = new Date();
}

// Render plant palette
function renderPalette() {
    const palette = document.getElementById('palette');
    const allPlants = [...defaultPlants, ...gardenData.customPlants];
    const defaultCount = defaultPlants.length;

    palette.innerHTML = allPlants.map((plant, i) => {
        const isCustom = i >= defaultCount;
        const customIndex = i - defaultCount;
        return `
        <div class="palette-item ${selectedPlant === i ? 'selected' : ''} ${isCustom ? 'custom' : ''}"
             onclick="selectPlant(${i})" title="${plant.name}${isCustom ? ' (custom)' : ''}">
            ${isCustom ? `<button class="palette-delete-btn" onclick="event.stopPropagation(); deleteCustomPlant(${customIndex})">✕</button>` : ''}
            <span class="emoji">${plant.emoji}</span>
            <span class="label">${plant.name}</span>
        </div>
    `}).join('');
}

// Delete custom plant
function deleteCustomPlant(customIndex) {
    if (confirm('Delete this custom plant from palette?')) {
        gardenData.customPlants.splice(customIndex, 1);
        selectedPlant = null;
        renderPalette();
        saveData();
    }
}

// Render photos with yard indicators
function renderPhotos() {
    const grid = document.getElementById('photos-grid');
    grid.innerHTML = photos.map(photo => `
        <div class="photo-thumb ${photo.yard}-yard" onclick="viewPhoto('${photo.file}')">
            <img src="garden pic/${photo.file}" alt="${photo.file}" onerror="this.parentElement.innerHTML='📷'">
        </div>
    `).join('');
}

// Select plant from palette
function selectPlant(index) {
    selectedPlant = selectedPlant === index ? null : index;
    selectedZone = null;  // Clear zone selection when selecting plant
    updateModeIndicator();
    renderPalette();
    renderZonePalette();
}

// Render unified front yard grid
function renderFrontYard() {
    const grid = document.getElementById('front-yard-grid');
    if (!grid) return;

    // Render column labels (top)
    const colLabelsTop = document.getElementById('col-labels-top');
    if (colLabelsTop) {
        let colHtml = '<div class="col-label-spacer"></div>';
        for (let col = 0; col < GRID_COLS; col++) {
            colHtml += `<div class="col-label">${col + 1}</div>`;
        }
        colHtml += '<div class="col-label-spacer"></div>';
        colLabelsTop.innerHTML = colHtml;
    }

    // Render column labels (bottom)
    const colLabelsBottom = document.getElementById('col-labels-bottom');
    if (colLabelsBottom) {
        let colHtml = '<div class="col-label-spacer"></div>';
        for (let col = 0; col < GRID_COLS; col++) {
            colHtml += `<div class="col-label">${col + 1}</div>`;
        }
        colHtml += '<div class="col-label-spacer"></div>';
        colLabelsBottom.innerHTML = colHtml;
    }

    // Render row labels (left)
    const rowLabelsLeft = document.getElementById('row-labels-left');
    if (rowLabelsLeft) {
        let rowHtml = '';
        for (let row = 0; row < GRID_ROWS; row++) {
            rowHtml += `<div class="row-label">${row + 1}</div>`;
        }
        rowLabelsLeft.innerHTML = rowHtml;
    }

    // Render row labels (right)
    const rowLabelsRight = document.getElementById('row-labels-right');
    if (rowLabelsRight) {
        let rowHtml = '';
        for (let row = 0; row < GRID_ROWS; row++) {
            rowHtml += `<div class="row-label">${row + 1}</div>`;
        }
        rowLabelsRight.innerHTML = rowHtml;
    }

    let html = '';
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const cellId = `${row}-${col}`;
            const zone = getCellZone(row, col);
            const cellData = gardenData.frontYard.cells[cellId];

            // Determine zone label for structures (offset by 1)
            let zoneLabel = '';
            // Toolshed at yard row 1, col 0 = grid row 2, col 1
            if (zone === 'toolshed' && row === 2 && col === 1) zoneLabel = '🔧';
            // Veggie palace at yard row 8, col 31 = grid row 9, col 32
            if (zone === 'veggie-palace' && row === 9 && col === 32) zoneLabel = '🥬';
            // Stairs at yard row 1, col 19 = grid row 2, col 20
            if (zone === 'stairs' && row === 2 && col === 20) zoneLabel = '🪜';

            const isSelected = selectedCells.has(cellId);
            const selectedClass = isSelected ? ' cell-selected' : '';

            if (cellData) {
                // Check if cell is subdivided
                if (cellData.subdivided) {
                    const quadrants = cellData.quadrants || [{},{},{},{}];
                    html += `
                        <div class="grid-cell zone-${zone} subdivided${selectedClass}"
                             data-cell-id="${cellId}" onclick="handleCellClick(event, '${cellId}')"
                             title="Subdivided cell (${row+1},${col+1}) - shift+click to select, click quadrant to edit">
                            <button class="copy-btn" onclick="event.stopPropagation(); copyCellData('${cellId}')">⧉</button>
                            ${quadrants.map((q, qi) => {
                                if (q.emoji) {
                                    return `<div class="quadrant has-plant" onclick="event.stopPropagation(); if(copiedCellData){handleCellClick(event,'${cellId}');}else if(event.shiftKey){toggleCellSelection('${cellId}');}else{editQuadrant('${cellId}', ${qi});}" title="${q.name || ''} - click to edit, shift+click to select">
                                        <button class="mini-edit" onclick="event.stopPropagation(); editQuadrant('${cellId}', ${qi})">✎</button>
                                        <button class="mini-delete" onclick="event.stopPropagation(); deleteQuadrant('${cellId}', ${qi})">✕</button>
                                        <span class="mini-emoji">${q.emoji}</span>
                                    </div>`;
                                } else {
                                    return `<div class="quadrant empty" onclick="event.stopPropagation(); if(copiedCellData){handleCellClick(event,'${cellId}');}else if(event.shiftKey){toggleCellSelection('${cellId}');}else{placeInQuadrant('${cellId}', ${qi});}" title="Click to add plant, shift+click to select">+</div>`;
                                }
                            }).join('')}
                        </div>
                    `;
                } else {
                    html += `
                        <div class="grid-cell zone-${zone} has-plant type-${cellData.type}${selectedClass}"
                             data-cell-id="${cellId}" onclick="handleCellClick(event, '${cellId}')"
                             title="${cellData.name}${cellData.notes ? '\\n' + cellData.notes : ''}">
                            <button class="edit-btn" onclick="event.stopPropagation(); editFrontYardCell('${cellId}')">✎</button>
                            <button class="delete-btn" onclick="event.stopPropagation(); deleteFrontYardCell('${cellId}')">✕</button>
                            <button class="copy-btn" onclick="event.stopPropagation(); copyCellData('${cellId}')">⧉</button>
                            <span class="plant-emoji">${cellData.emoji}</span>
                        </div>
                    `;
                }
            } else {
                html += `
                    <div class="grid-cell zone-${zone}${selectedClass}" data-cell-id="${cellId}" onclick="handleCellClick(event, '${cellId}')" title="${zone} (${row},${col})">
                        ${zoneLabel}
                    </div>
                `;
            }
        }
    }

    grid.innerHTML = html;
}

// Multi-select: toggle a cell in/out of the selection
function toggleCellSelection(cellId) {
    if (selectedCells.has(cellId)) {
        selectedCells.delete(cellId);
    } else {
        selectedCells.add(cellId);
    }
    updateMultiselectBar();
    renderFrontYard();
}

function clearSelection() {
    selectedCells.clear();
    updateMultiselectBar();
    renderFrontYard();
}

function updateMultiselectBar() {
    const bar = document.getElementById('multiselect-bar');
    const count = selectedCells.size;
    if (count === 0) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    document.getElementById('multiselect-count').textContent = `${count} cell${count > 1 ? 's' : ''} selected`;
}

// Bulk: remove division from all selected divided cells
function mergeSelectedCells() {
    const divided = [...selectedCells].filter(id => gardenData.frontYard.cells[id]?.subdivided);
    if (divided.length === 0) {
        alert('None of the selected cells are divided.');
        return;
    }
    if (!confirm(`Remove division from ${divided.length} cell${divided.length > 1 ? 's' : ''}? All quadrant plants will be cleared.`)) return;
    divided.forEach(id => delete gardenData.frontYard.cells[id]);
    clearSelection();
    refreshFrontYard();
}

// Bulk: clear all plants from selected cells
function clearSelectedPlants() {
    const withPlants = [...selectedCells].filter(id => gardenData.frontYard.cells[id]);
    if (withPlants.length === 0) {
        alert('None of the selected cells have plants.');
        return;
    }
    if (!confirm(`Clear plants from ${withPlants.length} cell${withPlants.length > 1 ? 's' : ''}?`)) return;
    withPlants.forEach(id => delete gardenData.frontYard.cells[id]);
    clearSelection();
    refreshFrontYard();
}

// Copy a cell's plant data and enter paste mode
function copyCellData(cellId) {
    const cellData = gardenData.frontYard.cells[cellId];
    if (!cellData) return;
    copiedCellData = JSON.parse(JSON.stringify(cellData));
    document.getElementById('paste-bar').style.display = 'flex';
    document.getElementById('front-yard-grid').classList.add('paste-mode');
    const label = copiedCellData.subdivided
        ? `subdivided cell (${copiedCellData.quadrants.filter(q => q.emoji).length} plants)`
        : `${copiedCellData.emoji} ${copiedCellData.name}`;
    document.getElementById('paste-info').textContent =
        `📋 ${label} — shift+click to paste into multiple cells, click to paste once`;
}

function cancelCopy() {
    copiedCellData = null;
    document.getElementById('paste-bar').style.display = 'none';
    document.getElementById('front-yard-grid').classList.remove('paste-mode');
}

// Handle cell click - either paste, paint zone, or place plant
function handleCellClick(event, cellId) {
    if (copiedCellData) {
        gardenData.frontYard.cells[cellId] = JSON.parse(JSON.stringify(copiedCellData));
        if (!event.shiftKey) cancelCopy();
        refreshFrontYard();
        return;
    }
    if (event.shiftKey) {
        toggleCellSelection(cellId);
        return;
    }
    if (selectedCells.size > 0) {
        clearSelection();
        return;
    }
    if (selectedZone) {
        // Paint zone
        if (!gardenData.frontYard.zones) {
            gardenData.frontYard.zones = {};
        }
        gardenData.frontYard.zones[cellId] = selectedZone;
        renderFrontYard();
        saveData();
    } else {
        // Place plant
        placeFrontYardCell(cellId);
    }
}

function setModalMode(isQuadrant) {
    document.getElementById('divide-btn').style.display = isQuadrant ? 'none' : '';
    document.getElementById('merge-btn').style.display = isQuadrant ? '' : 'none';
    // Repopulate emoji picker with current palette (default + custom)
    const picker = document.getElementById('edit-emoji-picker');
    const allPlants = [...defaultPlants, ...gardenData.customPlants];
    picker.innerHTML = '<option value="">— pick a plant —</option>' +
        allPlants.map((p, i) => `<option value="${i}">${p.emoji} ${p.name}</option>`).join('');
}

function applyEmojiPicker() {
    const picker = document.getElementById('edit-emoji-picker');
    if (!picker.value) return;
    const allPlants = [...defaultPlants, ...gardenData.customPlants];
    const plant = allPlants[parseInt(picker.value)];
    document.getElementById('edit-emoji').value = plant.emoji;
    document.getElementById('edit-name').value = plant.name;
    document.getElementById('edit-type').value = plant.type;
    picker.value = '';
}

// Place plant in front yard
function placeFrontYardCell(cellId) {
    if (selectedPlant !== null) {
        const allPlants = [...defaultPlants, ...gardenData.customPlants];
        const plant = allPlants[selectedPlant];
        gardenData.frontYard.cells[cellId] = { ...plant, notes: '' };
        refreshFrontYard();
    } else {
        const existingData = gardenData.frontYard.cells[cellId];
        editingCell = { type: 'frontYard', cellId };
        document.getElementById('edit-emoji').value = existingData?.emoji || '';
        document.getElementById('edit-name').value = existingData?.name || '';
        document.getElementById('edit-type').value = existingData?.type || 'shrub';
        document.getElementById('edit-notes').value = existingData?.notes || '';
        document.getElementById('edit-plant-date').value = existingData?.plantDate || '';
        setModalMode(false);
        document.getElementById('edit-modal').classList.add('active');
    }
}

// Edit front yard cell
function editFrontYardCell(cellId) {
    const cellData = gardenData.frontYard.cells[cellId];
    editingCell = { type: 'frontYard', cellId };
    document.getElementById('edit-emoji').value = cellData.emoji;
    document.getElementById('edit-name').value = cellData.name;
    document.getElementById('edit-type').value = cellData.type;
    document.getElementById('edit-notes').value = cellData.notes || '';
    document.getElementById('edit-plant-date').value = cellData.plantDate || '';
    setModalMode(false);
    document.getElementById('edit-modal').classList.add('active');
}

// Delete front yard cell
function deleteFrontYardCell(cellId) {
    if (!confirm('Do you really want to delete this plant?')) return;
    delete gardenData.frontYard.cells[cellId];
    refreshFrontYard();
}

// Divide cell into 4 quadrants
function divideCell() {
    if (!editingCell) return;

    // Get cellId - handle both frontYard and quadrant types
    let cellId;
    if (editingCell.type === 'frontYard') {
        cellId = editingCell.cellId;
    } else if (editingCell.type === 'quadrant') {
        // Already subdivided, can't divide further
        alert('This cell is already divided!');
        return;
    } else {
        return;
    }

    const existingData = gardenData.frontYard.cells[cellId];

    // Don't divide if already subdivided
    if (existingData && existingData.subdivided) {
        alert('This cell is already divided!');
        return;
    }

    // Create subdivided cell with first quadrant containing existing plant
    gardenData.frontYard.cells[cellId] = {
        subdivided: true,
        quadrants: [
            existingData && existingData.emoji ? { emoji: existingData.emoji, name: existingData.name, type: existingData.type } : {},
            {},
            {},
            {}
        ]
    };

    closeModal();
    refreshFrontYard();
}

// Place plant in quadrant
function placeInQuadrant(cellId, quadrantIndex) {
    if (selectedPlant !== null) {
        const allPlants = [...defaultPlants, ...gardenData.customPlants];
        const plant = allPlants[selectedPlant];

        if (!gardenData.frontYard.cells[cellId]) {
            gardenData.frontYard.cells[cellId] = { subdivided: true, quadrants: [{},{},{},{}] };
        }

        gardenData.frontYard.cells[cellId].quadrants[quadrantIndex] = {
            emoji: plant.emoji,
            name: plant.name,
            type: plant.type
        };

        refreshFrontYard();
    } else {
        // Open mini edit for quadrant
        editingCell = { type: 'quadrant', cellId, quadrantIndex };
        document.getElementById('edit-emoji').value = '';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-type').value = 'shrub';
        document.getElementById('edit-notes').value = '';
        document.getElementById('edit-plant-date').value = '';
        setModalMode(true);
        document.getElementById('edit-modal').classList.add('active');
    }
}

// Edit quadrant
function editQuadrant(cellId, quadrantIndex) {
    const cellData = gardenData.frontYard.cells[cellId];
    const quadrant = cellData.quadrants[quadrantIndex];

    editingCell = { type: 'quadrant', cellId, quadrantIndex };
    document.getElementById('edit-emoji').value = quadrant.emoji || '';
    document.getElementById('edit-name').value = quadrant.name || '';
    document.getElementById('edit-type').value = quadrant.type || 'shrub';
    document.getElementById('edit-notes').value = '';
    document.getElementById('edit-plant-date').value = quadrant.plantDate || '';
    setModalMode(true);
    document.getElementById('edit-modal').classList.add('active');
}

// Remove division and restore cell to a single empty cell
function mergeCell() {
    if (!editingCell || editingCell.type !== 'quadrant') return;
    if (!confirm('Remove division? All quadrant plants will be cleared.')) return;

    delete gardenData.frontYard.cells[editingCell.cellId];
    closeModal();
    refreshFrontYard();
}

// Delete quadrant content
function deleteQuadrant(cellId, quadrantIndex) {
    if (!confirm('Do you really want to delete this plant?')) return;
    gardenData.frontYard.cells[cellId].quadrants[quadrantIndex] = {};

    // Check if all quadrants are empty - if so, remove the cell entirely
    const allEmpty = gardenData.frontYard.cells[cellId].quadrants.every(q => !q.emoji);
    if (allEmpty) {
        delete gardenData.frontYard.cells[cellId];
    }

    refreshFrontYard();
}

// Update simple grid (back yard)
function updateSimpleGrid(yardId) {
    const cols = parseInt(document.getElementById(`${yardId}-cols`).value);
    const rows = parseInt(document.getElementById(`${yardId}-rows`).value);
    const grid = document.getElementById(`${yardId}-grid`);

    gardenData[yardId].cols = cols;
    gardenData[yardId].rows = rows;

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    let html = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellId = `${r}-${c}`;
            const cellData = gardenData[yardId].cells[cellId];

            if (cellData) {
                html += `
                    <div class="grid-cell has-plant type-${cellData.type}"
                         onclick="editCell('${yardId}', '${cellId}')"
                         title="${cellData.name}${cellData.notes ? '\n' + cellData.notes : ''}"
                         style="min-height: 50px;">
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteCell('${yardId}', '${cellId}')">✕</button>
                        <span class="plant-emoji" style="font-size: 1.5em;">${cellData.emoji}</span>
                        <span class="plant-name">${cellData.name}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="grid-cell" onclick="placeOrEdit('${yardId}', '${cellId}')" style="min-height: 50px;">
                    </div>
                `;
            }
        }
    }

    grid.innerHTML = html;
    saveData();
}

// Place plant or open edit modal
function placeOrEdit(yardId, cellId) {
    if (selectedPlant !== null) {
        const allPlants = [...defaultPlants, ...gardenData.customPlants];
        const plant = allPlants[selectedPlant];
        gardenData[yardId].cells[cellId] = { ...plant, notes: '' };
        updateSimpleGrid(yardId);
        updateStats();
    } else {
        editingCell = { type: 'simple', yardId, cellId };
        document.getElementById('edit-emoji').value = '';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-type').value = 'flower';
        document.getElementById('edit-notes').value = '';
        document.getElementById('edit-plant-date').value = '';
        setModalMode(false);
        document.getElementById('edit-modal').classList.add('active');
    }
}

// Edit existing cell
function editCell(yardId, cellId) {
    const cellData = gardenData[yardId].cells[cellId];
    editingCell = { type: 'simple', yardId, cellId };
    document.getElementById('edit-emoji').value = cellData.emoji;
    document.getElementById('edit-name').value = cellData.name;
    document.getElementById('edit-type').value = cellData.type;
    document.getElementById('edit-notes').value = cellData.notes || '';
    document.getElementById('edit-plant-date').value = cellData.plantDate || '';
    document.getElementById('edit-modal').classList.add('active');
}

// Save edit
function saveEdit() {
    const emoji = document.getElementById('edit-emoji').value || '🌱';
    const name = document.getElementById('edit-name').value || 'Plant';
    const type = document.getElementById('edit-type').value;
    const notes = document.getElementById('edit-notes').value;
    const plantDate = document.getElementById('edit-plant-date').value;

    if (editingCell.type === 'frontYard') {
        gardenData.frontYard.cells[editingCell.cellId] = {
            emoji, name, type, notes, plantDate
        };
        closeModal();
        refreshFrontYard();
    } else if (editingCell.type === 'quadrant') {
        const cellData = gardenData.frontYard.cells[editingCell.cellId];
        if (!cellData) {
            gardenData.frontYard.cells[editingCell.cellId] = { subdivided: true, quadrants: [{},{},{},{}] };
        }
        gardenData.frontYard.cells[editingCell.cellId].quadrants[editingCell.quadrantIndex] = {
            emoji, name, type, notes, plantDate
        };
        closeModal();
        refreshFrontYard();
    } else {
        gardenData[editingCell.yardId].cells[editingCell.cellId] = {
            emoji, name, type, notes, plantDate
        };
        closeModal();
        refreshBackYard(editingCell.yardId);
    }
    renderCalendar();
}

// Close modal
function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingCell = null;
}

// Delete cell
function deleteCell(yardId, cellId) {
    if (!confirm('Do you really want to delete this plant?')) return;
    delete gardenData[yardId].cells[cellId];
    refreshBackYard(yardId);
}

// Add custom plant to palette
function addCustomPlant() {
    const emoji = document.getElementById('custom-emoji').value || '🌱';
    const name = document.getElementById('custom-name').value || 'Custom';
    const type = document.getElementById('custom-type').value;

    gardenData.customPlants.push({ emoji, name, type });

    document.getElementById('custom-emoji').value = '';
    document.getElementById('custom-name').value = '';

    renderPalette();
    saveData();
}

// Update stats
function updateStats() {
    let total = 0;
    const types = new Set();

    // Count front yard cells
    Object.values(gardenData.frontYard.cells).forEach(cell => {
        total++;
        types.add(cell.type);
    });

    // Count back yard
    Object.values(gardenData.yard2.cells).forEach(cell => {
        total++;
        types.add(cell.type);
    });

    document.getElementById('total-plants').textContent = total;
    document.getElementById('plant-types').textContent = types.size;
}

// View photo
function viewPhoto(filename) {
    document.getElementById('photo-view').src = `garden pic/${filename}`;
    document.getElementById('photo-modal').classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photo-modal').classList.remove('active');
}

// Save to localStorage
function saveData() {
    localStorage.setItem('gardenPlannerData_v3', JSON.stringify(gardenData));
}

// Load from localStorage
async function loadData() {
    const saved = localStorage.getItem('gardenPlannerData_v3');
    if (saved) {
        const parsed = JSON.parse(saved);
        gardenData = { ...gardenData, ...parsed };
    } else {
        // No local state — try loading default from state.json
        try {
            const res = await fetch('state.json');
            if (res.ok) {
                const parsed = await res.json();
                gardenData = { ...gardenData, ...parsed };
            }
        } catch (e) {
            // state.json not present or unreadable — start fresh
        }
    }
    if (gardenData.yard2) {
        document.getElementById('yard2-cols').value = gardenData.yard2.cols || 8;
        document.getElementById('yard2-rows').value = gardenData.yard2.rows || 6;
    }
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(gardenData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garden_plan.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import data from file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate structure
            if (!importedData.frontYard) {
                alert('Invalid file format: missing frontYard data');
                return;
            }

            // Merge imported data
            gardenData = {
                frontYard: importedData.frontYard || { cells: {}, zones: {} },
                yard2: importedData.yard2 || { cols: 8, rows: 6, cells: {} },
                customPlants: importedData.customPlants || [],
                workLog: importedData.workLog || []
            };

            // Save to localStorage and refresh
            renderPalette();
            refreshFrontYard();
            refreshBackYard('yard2');
            renderCalendar();

            alert('✅ Garden data loaded successfully!');
        } catch (err) {
            alert('Error loading file: ' + err.message);
        }
    };
    reader.readAsText(file);

    // Reset file input so same file can be loaded again
    event.target.value = '';
}

// Clear all
function clearAll() {
    if (confirm('Are you sure you want to clear all plants?')) {
        gardenData.frontYard.cells = {};
        gardenData.yard2.cells = {};
        refreshFrontYard();
        refreshBackYard('yard2');
    }
}

// ── Calendar ─────────────────────────────────────────────────────────────────

const WORK_TYPES = [
    { value: 'weeding',     label: '🌿 Weeding' },
    { value: 'watering',    label: '💧 Watering' },
    { value: 'pruning',     label: '✂️ Pruning' },
    { value: 'fertilizing', label: '🌱 Fertilizing' },
    { value: 'harvesting',  label: '🧺 Harvesting' },
    { value: 'planting',    label: '🌱 Planting (manual)' },
    { value: 'other',       label: '🔧 Other' },
];

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null
};

function prevMonth() {
    calendarState.month--;
    if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
    renderCalendar();
}

function nextMonth() {
    calendarState.month++;
    if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
    renderCalendar();
}

function getAllPlantingEvents() {
    const events = [];
    Object.entries(gardenData.frontYard.cells).forEach(([cellId, cell]) => {
        if (cell.plantDate) {
            events.push({ date: cell.plantDate, type: 'planting', name: cell.name, emoji: cell.emoji, yard: 'Front Yard', cellId });
        }
        if (cell.subdivided && cell.quadrants) {
            cell.quadrants.forEach(q => {
                if (q.plantDate) {
                    events.push({ date: q.plantDate, type: 'planting', name: q.name, emoji: q.emoji, yard: 'Front Yard', cellId });
                }
            });
        }
    });
    Object.entries(gardenData.yard2.cells).forEach(([cellId, cell]) => {
        if (cell.plantDate) {
            events.push({ date: cell.plantDate, type: 'planting', name: cell.name, emoji: cell.emoji, yard: 'Back Yard', cellId });
        }
    });
    return events;
}

function getEventsForDate(dateStr) {
    const planting = getAllPlantingEvents().filter(e => e.date === dateStr);
    const work = (gardenData.workLog || []).filter(e => e.date === dateStr);
    return [...planting, ...work];
}

function renderCalendar() {
    const { year, month } = calendarState;
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('calendar-title').textContent = `${MONTHS[month]} ${year}`;

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const allPlanting = getAllPlantingEvents().filter(e => e.date.startsWith(monthStr));
    const allWork = (gardenData.workLog || []).filter(e => e.date.startsWith(monthStr));

    const byDate = {};
    [...allPlanting, ...allWork].forEach(e => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
    });

    const sortedDates = Object.keys(byDate).sort();
    const todayStr = new Date().toISOString().slice(0, 10);

    if (sortedDates.length === 0) {
        document.getElementById('calendar-list').innerHTML = '<p class="cal-hint">No events this month.</p>';
        return;
    }

    let html = '';
    sortedDates.forEach(dateStr => {
        const date = new Date(dateStr + 'T12:00:00');
        const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const isToday = dateStr === todayStr;
        const events = byDate[dateStr];
        const count = events.length;
        const autoOpen = isToday || count <= 3;

        html += `<details class="cal-list-day" ${autoOpen ? 'open' : ''}>
            <summary class="cal-list-date${isToday ? ' is-today' : ''}">
                ${dayLabel}${isToday ? ' · today' : ''}
                <span class="cal-list-count">${count} ${count === 1 ? 'event' : 'events'}</span>
            </summary>`;
        // Group planting events by plant name, keep work entries ungrouped
        const plantingEvents = events.filter(e => e.type === 'planting');
        const workEvents = events.filter(e => e.type !== 'planting');

        const plantGroups = {};
        plantingEvents.forEach(e => {
            const key = `${e.emoji}|||${e.name}`;
            if (!plantGroups[key]) plantGroups[key] = { emoji: e.emoji, name: e.name, items: [] };
            plantGroups[key].items.push(e);
        });

        Object.values(plantGroups).forEach(group => {
            if (group.items.length === 1) {
                const e = group.items[0];
                const clickable = e.cellId ? `onclick="highlightCell('${e.cellId}')" style="cursor:pointer"` : '';
                html += `<div class="cal-list-event planting-event" ${clickable}>${e.emoji} ${e.name} <span class="event-yard">${e.yard}</span></div>`;
            } else {
                html += `<details class="cal-plant-group">
                    <summary class="cal-plant-group-header">${group.emoji} ${group.name} <span class="cal-list-count">${group.items.length}</span></summary>`;
                group.items.forEach(e => {
                    const clickable = e.cellId ? `onclick="highlightCell('${e.cellId}')" style="cursor:pointer"` : '';
                    html += `<div class="cal-list-event planting-event cal-plant-item" ${clickable}>${e.emoji} ${e.name} <span class="event-yard">${e.yard}</span></div>`;
                });
                html += `</details>`;
            }
        });

        workEvents.forEach(e => {
            const label = WORK_TYPES.find(t => t.value === e.workType)?.label || e.workType;
            html += `<div class="cal-list-event work-event">${label}${e.notes ? ': ' + e.notes : ''}
                <button class="event-delete-btn" onclick="deleteWorkEntry('${e.id}')">✕</button>
            </div>`;
        });
        html += `</details>`;
    });

    document.getElementById('calendar-list').innerHTML = html;
}

function addWorkEntryFromPanel() {
    const dateStr = document.getElementById('work-date-input').value;
    if (!dateStr) { alert('Please select a date.'); return; }
    const workType = document.getElementById('work-type-select').value;
    const notes = document.getElementById('work-notes-input').value.trim();
    if (!gardenData.workLog) gardenData.workLog = [];
    gardenData.workLog.push({ id: Date.now().toString(), date: dateStr, workType, notes, type: 'work' });
    document.getElementById('work-notes-input').value = '';
    saveData();
    renderCalendar();
}

function highlightCell(cellId) {
    document.querySelectorAll('.cell-highlighted').forEach(el => el.classList.remove('cell-highlighted'));
    const el = document.querySelector(`[data-cell-id="${cellId}"]`);
    if (!el) return;
    el.classList.add('cell-highlighted');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    setTimeout(() => el.classList.remove('cell-highlighted'), 2500);
}

function deleteWorkEntry(id) {
    gardenData.workLog = (gardenData.workLog || []).filter(e => e.id !== id);
    saveData();
    renderCalendar();
}

// ─────────────────────────────────────────────────────────────────────────────

// Close modals on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closePhotoModal();
        cancelCopy();
    }
});

// Initialize on load
init();
