// massive.js - Lógica de Cubicación Masiva
let massiveData = [];
let availableUnitsConfig = {};
let generatedTrips = [];
let shipmentsUnsubscribe = null;

function listenToShipments() {
    const tenant = window.appTenant || "default";
    if (shipmentsUnsubscribe) shipmentsUnsubscribe();
    
    if (window.db) {
        shipmentsUnsubscribe = window.db.collection('companies').doc(tenant).collection('shipments')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                generatedTrips = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    generatedTrips.push(data);
                });
                // Recalcular paginación y renderizar
                const totalPages = Math.ceil(generatedTrips.length / ITEMS_PER_PAGE);
                if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
                renderResults();
            }, error => {
                console.error("Error escuchando embarques:", error);
            });
    }
}
let currentPage = 1;
const ITEMS_PER_PAGE = 3;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Interceptar el Login
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const appCont = document.querySelector('.app-container');
                    if (appCont && appCont.style.display !== 'none' && !window.modeSelected) {
                        appCont.style.display = 'none';
                        document.getElementById('mode-selection-screen').style.display = 'flex';
                    }
                }
            });
        });
        observer.observe(document.querySelector('.app-container'), { attributes: true });
    }

    // 2. Mode Selection
    document.getElementById('btn-mode-individual')?.addEventListener('click', () => {
        window.modeSelected = true;
        document.getElementById('mode-selection-screen').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';

        // Limpiar completamente el estado del cubicador individual
        if (window.app) {
            // 1. Limpiar carga y escena 3D
            window.app.clearCargo(false);

            // 2. Volver a la primera unidad (default)
            window.app.currentUnitIndex = 0;
            window.app.switchUnit(UNITS[0]);

            // 3. Limpiar campos del formulario
            ['input-length','input-width','input-height','input-weight','input-quantity','input-description','input-sku'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const cbFragile = document.getElementById('cb-fragile');
            const cbStack   = document.getElementById('cb-stackable');
            const cbDanger  = document.getElementById('cb-dangerous');
            const cbRefrig  = document.getElementById('cb-refrigerated');
            if (cbFragile) cbFragile.checked = false;
            if (cbStack)   cbStack.checked   = true;
            if (cbDanger)  cbDanger.checked  = false;
            if (cbRefrig)  cbRefrig.checked  = false;

            // 4. Resetear flag de masivo
            window.fromMassiveResult = false;
            window.app._notifiedOverweight = false;
        }

        // Forzar resize para Three.js
        window.dispatchEvent(new Event('resize'));
    });

    document.getElementById('btn-mode-massive')?.addEventListener('click', () => {
        window.modeSelected = true;
        document.getElementById('mode-selection-screen').style.display = 'none';
        document.getElementById('massive-cubing-container').style.display = 'flex';
        renderMassiveUnits();
        listenToShipments();
    });

    document.getElementById('btn-mode-game')?.addEventListener('click', () => {
        window.location.href = '../CUBICADORGAME/index.html';
    });

    document.getElementById('btn-menu-principal')?.addEventListener('click', () => {
        document.getElementById('massive-cubing-container').style.display = 'none';
        document.getElementById('mode-selection-screen').style.display = 'flex';
    });

    // Hearbeat: mantener el candado vivo cada 60s
    setInterval(() => {
        if (window.currentActiveShipmentId && window.db) {
            const tenant = window.appTenant || "default";
            window.db.collection('companies').doc(tenant).collection('shipments').doc(window.currentActiveShipmentId).update({
                lockedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(e => console.error("Error en heartbeat", e));
        }
    }, 60000);

    // Liberar el candado si el usuario cierra la pestaña a la fuerza
    window.addEventListener('beforeunload', () => {
        if (window.currentActiveShipmentId && window.db) {
            const tenant = window.appTenant || "default";
            // Usar objeto simple para asegurar el envío rápido antes del cierre
            window.db.collection('companies').doc(tenant).collection('shipments').doc(window.currentActiveShipmentId).update({
                lockedBy: null,
                lockedAt: null
            });
        }
    });

    document.getElementById('btn-massive-back')?.addEventListener('click', () => {
        document.getElementById('massive-cubing-container').style.display = 'none';
        document.getElementById('mode-selection-screen').style.display = 'flex';
    });

    document.getElementById('btn-new-massive')?.addEventListener('click', () => {
        // Action: Limpiar Resultados
        if (confirm("¿Estás seguro de que deseas limpiar TODOS los resultados compartidos? Esto borrará los embarques para todos los usuarios de la empresa.")) {
            const tenant = window.appTenant || "default";
            generatedTrips.forEach(trip => {
                if (trip.id && window.db) {
                    window.db.collection('companies').doc(tenant).collection('shipments').doc(trip.id).delete();
                }
            });
            generatedTrips = [];
            currentPage = 1;
            document.getElementById('massive-results-grid').innerHTML = '';
            document.getElementById('massive-results-section').style.display = 'none';
        }
    });

    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
        }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(generatedTrips.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderResults();
        }
    });

    // Units list is now always visible (flat list, no dropdown toggle needed)

    // 2.5 Volver al Menú desde el Cubicador Individual
    document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
        if (window.fromMassiveResult) {
            // Liberar el candado si estábamos en un viaje
            if (window.currentActiveShipmentId && window.db) {
                const tenant = window.appTenant || "default";
                window.db.collection('companies').doc(tenant).collection('shipments').doc(window.currentActiveShipmentId).update({
                    lockedBy: null,
                    lockedAt: null
                }).catch(e => console.error("Error al liberar candado", e));
                window.currentActiveShipmentId = null;
            }

            document.querySelector('.app-container').style.display = 'none';
            document.getElementById('massive-cubing-container').style.display = 'flex';
            window.fromMassiveResult = false;
            
            const btnMenu = document.getElementById('btn-back-to-menu');
            if (btnMenu && btnMenu.dataset.originalHtml) {
                btnMenu.innerHTML = btnMenu.dataset.originalHtml;
                btnMenu.style.borderColor = '';
                btnMenu.style.color = '';
            }
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        document.querySelector('.app-container').style.display = 'none';
        document.getElementById('mode-selection-screen').style.display = 'flex';
    });

    // 3. Download Template
    document.getElementById('btn-download-template')?.addEventListener('click', async () => {
        if (typeof ExcelJS === 'undefined') {
            alert('La librería para crear la plantilla aún se está cargando. Intenta de nuevo en unos segundos.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Carga');

        // Definir columnas
        worksheet.columns = [
            { header: 'SKU', key: 'sku', width: 15 },
            { header: 'Origen', key: 'origen', width: 15 },
            { header: 'Destino', key: 'destino', width: 15 },
            { header: 'Largo', key: 'largo', width: 12 },
            { header: 'Ancho', key: 'ancho', width: 12 },
            { header: 'Alto', key: 'alto', width: 12 },
            { header: 'Peso', key: 'peso', width: 12 },
            { header: 'Cantidad', key: 'cantidad', width: 12 },
            { header: 'Descripcion', key: 'descripcion', width: 30 }
        ];

        // Estilos de la cabecera
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFBDD7EE' } // Azul claro similar a la imagen
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Agregar 12 filas en blanco con bordes
        for (let i = 0; i < 12; i++) {
            worksheet.addRow([]);
        }

        // Aplicar bordes y centrado a las filas de datos
        for (let i = 2; i <= 13; i++) {
            const row = worksheet.getRow(i);
            for (let col = 1; col <= 9; col++) {
                const cell = row.getCell(col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
        }

        // Generar archivo y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Plantilla_Cubicacion_Masiva.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

    // 4. File Upload
    const dropZone = document.getElementById('excel-drop-zone');
    const fileInput = document.getElementById('excel-file-input');
    
    dropZone?.addEventListener('click', () => fileInput.click());
    
    dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#00e5ff';
    });
    dropZone?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(82, 181, 212, 0.5)';
    });
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(82, 181, 212, 0.5)';
        if(e.dataTransfer.files.length > 0) {
            handleExcelFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput?.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            handleExcelFile(e.target.files[0]);
        }
    });

    // 5. Process Button
    document.getElementById('btn-process-massive')?.addEventListener('click', runMassiveCubing);

    // 6. Save Fleet Default Toggle
    const btnFleetSave = document.getElementById('btn-fleet-save');
    const btnFleetClear = document.getElementById('btn-fleet-clear');
    
    btnFleetSave?.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid closing dropdown
        const fleetConfig = [];
        document.querySelectorAll('.unit-cb').forEach(cb => {
            if (cb.checked) {
                const key = cb.getAttribute('data-key');
                const qtyInput = document.querySelector(`.unit-qty[data-key="${key}"]`);
                fleetConfig.push({ key: key, qty: parseInt(qtyInput.value) || 0 });
            }
        });
        localStorage.setItem('rodiload_default_fleet', JSON.stringify(fleetConfig));
        
        btnFleetSave.classList.add('active');
        btnFleetSave.style.background = 'var(--primary)';
        btnFleetSave.style.color = '#060b13';
        
        btnFleetClear.classList.remove('active');
        btnFleetClear.style.background = 'transparent';
        btnFleetClear.style.color = '#94a3b8';
    });

    btnFleetClear?.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('rodiload_default_fleet');
        
        btnFleetClear.classList.add('active');
        btnFleetClear.style.background = 'var(--primary)';
        btnFleetClear.style.color = '#060b13';
        
        btnFleetSave.classList.remove('active');
        btnFleetSave.style.background = 'transparent';
        btnFleetSave.style.color = '#94a3b8';
    });
});

function renderMassiveUnits() {
    const list = document.getElementById('massive-units-list');
    list.innerHTML = '';

    UNITS.forEach((u, index) => {
        const item = document.createElement('div');
        item.className = 'unit-select-item';
        
        let isChecked = index === 0 ? 'checked' : '';
        
        const checked = isChecked === 'checked';
        item.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            background: ${checked ? 'var(--primary-light)' : '#ffffff'};
            border: 1px solid ${checked ? 'var(--primary)' : 'var(--border)'};
            border-radius: 8px; padding: 8px 12px; transition: all 0.2s; cursor: pointer;
        `;
        item.onmouseover = () => { if (!item.querySelector('.unit-cb').checked) item.style.background = 'var(--bg-hover)'; };
        item.onmouseout  = () => { if (!item.querySelector('.unit-cb').checked) item.style.background = '#ffffff'; };

        item.innerHTML = `
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1; min-width:0;">
                <input type="checkbox" class="unit-cb" data-key="${u.key}" ${isChecked} style="accent-color: var(--primary);">
                <span style="font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color: var(--text-main);">${u.name} <span style="color: var(--text-muted); font-weight:400;">(Max: ${u.maxPayload.toLocaleString()}kg)</span></span>
            </label>
        `;

        // Resaltar borde al marcar/desmarcar
        item.querySelector('.unit-cb').addEventListener('change', function() {
            item.style.background    = this.checked ? 'var(--primary-light)' : '#ffffff';
            item.style.borderColor   = this.checked ? 'var(--primary)' : 'var(--border)';
        });

        list.appendChild(item);
    });

    updateSelectedUnitText();

    document.querySelectorAll('.unit-cb').forEach(cb => {
        cb.addEventListener('change', updateSelectedUnitText);
    });
}

function updateSelectedUnitText() {
    // Ya no cambiamos el texto porque está estático en "Tipo de Unidad", 
    // pero mantenemos la lógica si es necesaria en el futuro, o para controlar UI.
    const checkedBoxes = document.querySelectorAll('.unit-cb:checked');
    const btnCalc = document.getElementById('btn-process-massive');
    
    if (btnCalc && massiveData && massiveData.length > 0) {
        btnCalc.disabled = checkedBoxes.length === 0;
    }
}

function handleExcelFile(file) {
    const info = document.getElementById('excel-file-info');
    info.style.display = 'block';
    info.innerHTML = `Leyendo ${file.name}...`;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});

            // Leer TODAS las hojas y combinar sus registros
            let allRows = [];
            const sheetSummary = [];

            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];

                // Estrategia robusta: leer fila por fila usando el rango real de celdas
                const ref = sheet['!ref'];
                if (!ref) return;
                
                // Obtener todos los datos sin filas en blanco
                const rawData = XLSX.utils.sheet_to_json(sheet, { 
                    header: 1,      // Array de arrays, sin cabeceras
                    defval: '',
                    blankrows: false
                });
                
                if (rawData.length < 2) return; // Sin datos o solo cabecera
                
                // Primera fila = cabeceras
                const headers = rawData[0].map(h => String(h).trim());
                console.log(`[RODILOAD] Hoja "${sheetName}" - Cabeceras detectadas:`, headers);
                console.log(`[RODILOAD] Total filas brutas (incluyendo cabecera):`, rawData.length);
                
                const findHeader = (possibleNames) => {
                    const upperNames = possibleNames.map(n => n.toUpperCase());
                    return headers.findIndex(h => upperNames.includes(String(h).toUpperCase()));
                };

                const idxLargo = findHeader(['Largo', 'LARGO_CM']);
                const idxAncho = findHeader(['Ancho', 'ANCHO_CM']);
                const idxAlto  = findHeader(['Alto', 'ALTO_CM']);
                const idxPeso  = findHeader(['Peso', 'PESO_KG']);
                
                if (idxLargo === -1 || idxAncho === -1 || idxAlto === -1 || idxPeso === -1) {
                    console.warn('[RODILOAD] No se encontraron las columnas requeridas (Largo, Ancho, Alto, Peso)');
                    return;
                }

                const colMap = {
                    SKU:        findHeader(['SKU']),
                    Origen:     findHeader(['Origen']),
                    Destino:    findHeader(['Destino']),
                    Largo:      idxLargo,
                    Ancho:      idxAncho,
                    Alto:       idxAlto,
                    Peso:       idxPeso,
                    Cantidad:   findHeader(['Cantidad']),
                    Descripcion:findHeader(['Descripcion'])
                };

                const sheetRows = [];
                // Iterar filas de datos (saltando cabecera)
                for (let i = 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    const largo = parseFloat(row[colMap.Largo]);
                    const ancho = parseFloat(row[colMap.Ancho]);
                    const alto  = parseFloat(row[colMap.Alto]);
                    const peso  = parseFloat(row[colMap.Peso]);
                    
                    // Solo aceptar filas con valores numéricos reales y positivos en las 4 columnas clave
                    if (!isNaN(largo) && largo > 0 &&
                        !isNaN(ancho) && ancho > 0 &&
                        !isNaN(alto)  && alto  > 0 &&
                        !isNaN(peso)  && peso  > 0) {
                        sheetRows.push({
                            SKU:         colMap.SKU         >= 0 ? String(row[colMap.SKU]         || '').trim() : '',
                            Origen:      colMap.Origen      >= 0 ? String(row[colMap.Origen]      || '').trim() : '',
                            Destino:     colMap.Destino     >= 0 ? String(row[colMap.Destino]     || '').trim() : '',
                            Largo:       largo,
                            Ancho:       ancho,
                            Alto:        alto,
                            Peso:        peso,
                            Cantidad:    colMap.Cantidad    >= 0 ? Math.max(1, parseInt(row[colMap.Cantidad]) || 1) : 1,
                            Descripcion: colMap.Descripcion >= 0 ? String(row[colMap.Descripcion] || '').trim() : ''
                        });
                    }
                }
                
                console.log(`[RODILOAD] Filas válidas en hoja "${sheetName}":`, sheetRows.length, sheetRows);
                
                if (sheetRows.length > 0) {
                    allRows = allRows.concat(sheetRows);
                    sheetSummary.push(`${sheetName}: ${sheetRows.length}`);
                }
            });

            massiveData = allRows;

            // Auto-limpiar resultados anteriores al cargar nuevo archivo
            generatedTrips = [];
            currentPage = 1;
            document.getElementById('massive-results-grid').innerHTML = '';
            document.getElementById('massive-results-section').style.display = 'none';

            const totalSheets = sheetSummary.length;
            const detailText = totalSheets > 1
                ? ` (${sheetSummary.join(' | ')})`
                : '';

            info.innerHTML = `<i data-lucide="check-circle"></i> Archivo cargado: ${massiveData.length} registros válidos encontrados${detailText}.`;
            lucide.createIcons();
            document.getElementById('btn-process-massive').disabled = massiveData.length === 0;
        } catch(err) {
            console.error(err);
            info.innerHTML = `<i data-lucide="alert-triangle"></i> Error al leer el archivo. Asegúrate de usar la plantilla.`;
            info.style.color = '#F43F5E';
        }
    };
    reader.readAsArrayBuffer(file);
}

function showAddUnitsModal(route) {
    return new Promise((resolve) => {
        const modal = document.getElementById('add-units-modal');
        const select = document.getElementById('extra-unit-select');
        const qtyInput = document.getElementById('extra-unit-qty');
        const btnCancel = document.getElementById('btn-cancel-extra-units');
        const btnAdd = document.getElementById('btn-add-extra-units');
        const msg = document.getElementById('add-units-message');

        msg.textContent = `Sin unidades disponibles para la ruta ${route}.`;
        
        select.innerHTML = UNITS.map(u => `<option value="${u.key}">${u.name} (Max: ${u.maxPayload}kg / ${u.volume}m³)</option>`).join('');
        qtyInput.value = 1;

        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            btnCancel.removeEventListener('click', onCancel);
            btnAdd.removeEventListener('click', onAdd);
        };

        const onCancel = () => {
            cleanup();
            resolve(null);
        };

        const onAdd = () => {
            cleanup();
            resolve({
                unitKey: select.value,
                qty: parseInt(qtyInput.value) || 1
            });
        };

        btnCancel.addEventListener('click', onCancel);
        btnAdd.addEventListener('click', onAdd);
    });
}

async function runMassiveCubing() {
    // Gather selected units config
    availableUnitsConfig = {};
    document.querySelectorAll('.unit-cb').forEach(cb => {
        if(cb.checked) {
            const key = cb.getAttribute('data-key');
            availableUnitsConfig[key] = 999; // Set a high quantity since there is no limit now
        }
    });

    if(Object.keys(availableUnitsConfig).length === 0) {
        alert("Selecciona al menos un tipo de unidad disponible.");
        return;
    }

    // Show loading
    const loader = document.getElementById('loading-screen');
    const loaderText = loader.querySelector('.loader-text');
    loaderText.innerText = "Cubicando masivamente...";
    loader.style.display = 'flex';
    
    // Small delay to let the loading screen render, then run async calculation
    await new Promise(r => setTimeout(r, 100));
    await calculateTrips();
    loader.style.display = 'none';
    document.getElementById('massive-results-section').style.display = 'block';
}

function itemFitsUnit(item, u) {
    // Verificar si la pieza cabe en ALGUNA unidad cerrada
    let fitsClosed = false;
    for (let checkU of UNITS) {
        if (checkU.openDeck) continue;
        const cULong = Math.max(checkU.length, checkU.width);
        const cUShort = Math.min(checkU.length, checkU.width);
        const cILong = Math.max(item.l, item.w);
        const cIShort = Math.min(item.l, item.w);
        if (item.weight <= checkU.maxPayload && item.h <= checkU.height && cILong <= cULong && cIShort <= cUShort) {
            fitsClosed = true;
            break;
        }
    }

    const requiresOpenDeck = !fitsClosed;

    // Si la unidad es openDeck pero la pieza NO requiere openDeck (es estándar), rechazar
    if (u.openDeck && !requiresOpenDeck) {
        return false;
    }

    const uLong  = Math.max(u.length, u.width);
    const uShort = Math.min(u.length, u.width);
    const iLong  = Math.max(item.l, item.w);
    const iShort = Math.min(item.l, item.w);
    
    const wFits = (iLong <= uLong && iShort <= uShort);

    return (
        item.weight <= u.maxPayload &&
        item.h <= u.height &&
        (wFits || u.openDeck)
    );
}

// Simula el empaquetado 3D exacto usando el motor de app.js sin dibujar nada
function simulate3DPacking(items, unit) {
    if (!window.app || !window.app.calculatePositionAndAdd) return null;
    
    const origCargoList = window.app.cargoList;
    const origUnit = window.app.currentUnit;
    const origOffset = window.app.currentCargoOffset;
    const origAddBox = window.app.addBox;

    window.app.cargoList = [];
    window.app.currentUnit = unit;
    window.app.currentCargoOffset = {
        x: -unit.length / 2,
        y: unit.type === 'trailer' ? 1.5 : 0.5,
        z: 0
    };
    if (unit.openDeck) window.app.currentCargoOffset.y = 1.0; 
    
    window.app.addBox = function(w, l, h, x, y, z, weight, stackable, sku) {
        this.cargoList.push({
            w, l, h, weight, stackable: stackable !== undefined ? stackable : true, sku, desc: sku,
            position: {x,y,z},
            rotation: {x:0, y:0, z:0}
        });
    };

    let packedItemsList = [];
    let remainingItemsList = [];
    let totalWeight = 0;
    let totalVolume = 0;

    for (let item of items) {
        if (!itemFitsUnit(item, unit)) {
            remainingItemsList.push(item);
            continue;
        }

        if (totalWeight + item.weight > unit.maxPayload) {
            remainingItemsList.push(item);
            continue;
        }
        const success = window.app.calculatePositionAndAdd(item.w, item.l, item.h, item.weight, true, item.sku || "");
        if (success) {
            packedItemsList.push(item);
            totalWeight += item.weight;
            totalVolume += (item.w * item.l * item.h);
        } else {
            remainingItemsList.push(item);
        }
    }

    window.app.cargoList = origCargoList;
    window.app.currentUnit = origUnit;
    window.app.currentCargoOffset = origOffset;
    window.app.addBox = origAddBox;

    return {
        packedItems: packedItemsList,
        remainingItems: remainingItemsList,
        totalWeight,
        totalVolume
    };
}

async function calculateTrips() {
    // Group by route (Origen - Destino)
    const routes = {};
    let skuCounter = 0;
    const skuMap = {};

    massiveData.forEach(row => {
        const routeKey = `${row.Origen || 'Sin Origen'} ➔ ${row.Destino || 'Sin Destino'}`;
        if (!routes[routeKey]) routes[routeKey] = [];

        const itemTypeKey = `${row.Largo}_${row.Ancho}_${row.Alto}_${row.Peso}_${row.Descripcion || ''}`;
        let sku = (row.SKU && String(row.SKU).trim() !== '') ? String(row.SKU).trim() : null;
        if (!sku) {
            if (!skuMap[itemTypeKey]) {
                skuCounter++;
                skuMap[itemTypeKey] = `SKU-${String(skuCounter).padStart(2, '0')}`;
            }
            sku = skuMap[itemTypeKey];
        }

        const qty = parseInt(row.Cantidad) || 1;
        for (let i = 0; i < qty; i++) {
            routes[routeKey].push({
                l:      parseFloat(row.Largo) / 100,
                w:      parseFloat(row.Ancho) / 100,
                h:      parseFloat(row.Alto)  / 100,
                weight: parseFloat(row.Peso),
                desc:   row.Descripcion || 'Pieza Masiva',
                sku:    sku
            });
        }
    });

    // Build a SHARED pool of available units (consumed across all routes, as before)
    let unitPool = [];
    UNITS.forEach(u => {
        const qty = availableUnitsConfig[u.key] || 0;
        for (let i = 0; i < qty; i++) unitPool.push({...u});
    });
    // Sort smallest-first so we always try the most economical unit first
    unitPool.sort((a, b) => a.volume - b.volume);

    // ─── Bin-packing per route ───────────────────────────────────────────────
    for (const [route, items] of Object.entries(routes)) {
        // Sort items heaviest-first so the best-fit logic works better
        let remainingItems = [...items].sort((a, b) => b.weight - a.weight);

        while (remainingItems.length > 0) {
            if (unitPool.length === 0) {
                const extraChoice = await showAddUnitsModal(route);
                if (extraChoice) {
                    const unitConfig = UNITS.find(u => u.key === extraChoice.unitKey);
                    if (unitConfig) {
                        for (let i = 0; i < extraChoice.qty; i++) {
                            unitPool.push({ ...unitConfig, isExtra: true });
                        }
                        unitPool.sort((a, b) => a.volume - b.volume);
                        continue; // try packing again with the new units
                    }
                }
                break; // skipped or canceled
            }

            let bestUnitIndex = -1;
            let bestSimulation = null;

            // 1. Smallest unit that fits ALL remaining items PHYSICALLY in 3D
            for (let i = 0; i < unitPool.length; i++) {
                const u = unitPool[i];
                const sim = simulate3DPacking(remainingItems, u);
                if (sim && sim.remainingItems.length === 0) {
                    bestUnitIndex = i;
                    bestSimulation = sim;
                    break;
                }
            }

            // 2. No single unit fits everything → find the LARGEST unit to maximize packed pieces
            if (bestUnitIndex === -1) {
                let maxPackedCount = -1;
                for (let i = unitPool.length - 1; i >= 0; i--) {
                    const sim = simulate3DPacking(remainingItems, unitPool[i]);
                    if (sim && sim.packedItems.length > maxPackedCount && sim.packedItems.length > 0) {
                        maxPackedCount = sim.packedItems.length;
                        bestUnitIndex = i;
                        bestSimulation = sim;
                        // Si es la unidad más grande y acomodó cosas, no necesitamos buscar más abajo
                        break; 
                    }
                }
            }

            // 3. Truly nothing works → skip remaining items with an error
            if (bestUnitIndex === -1 || !bestSimulation || bestSimulation.packedItems.length === 0) {
                const skipped = [...new Set(remainingItems.map(it => it.sku || it.desc))].join(', ');
                alert(`⚠️ Las siguientes piezas de la ruta "${route}" no caben en ninguna de las unidades seleccionadas y serán omitidas:\n${skipped}`);
                remainingItems = [];
                continue;
            }

            const selectedUnit = unitPool.splice(bestUnitIndex, 1)[0];

            const trip = {
                id:          'TRIP-' + Math.floor(Math.random() * 10000),
                route:       route,
                unit:        selectedUnit,
                isExtra:     selectedUnit.isExtra || false,
                items:       bestSimulation.packedItems,
                totalWeight: bestSimulation.totalWeight,
                totalVolume: bestSimulation.totalVolume
            };

            // Update remaining for the next pass
            remainingItems = bestSimulation.remainingItems;

            const tenant = window.appTenant || "default";
            const cleanTrip = JSON.parse(JSON.stringify(trip)); // Quitar referencias complejas
            if (window.db) {
                cleanTrip.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                cleanTrip.lockedBy = null;
                cleanTrip.lockedAt = null;
                window.db.collection('companies').doc(tenant).collection('shipments').add(cleanTrip).catch(err => console.error(err));
            } else {
                generatedTrips.push(trip);
            }
        }
    }

    // La renderización se manejará automáticamente por listenToShipments si Firebase está activo
    if (!window.db) renderResults();
}

function renderResults() {
    const grid = document.getElementById('massive-results-grid');
    const paginator = document.getElementById('massive-paginator');
    const pageIndicator = document.getElementById('page-indicator');
    const section = document.getElementById('massive-results-section');
    grid.innerHTML = '';
    
    const totalPages = Math.ceil(generatedTrips.length / ITEMS_PER_PAGE);
    
    if (generatedTrips.length > 0) {
        if (section) section.style.display = 'block';
        if (paginator) paginator.style.display = 'flex';
        if (pageIndicator) pageIndicator.textContent = `Página ${currentPage} de ${totalPages || 1}`;
        
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');
        if (btnPrev) {
            btnPrev.style.opacity = currentPage === 1 ? '0.3' : '1';
            btnPrev.style.pointerEvents = currentPage === 1 ? 'none' : 'auto';
        }
        if (btnNext) {
            btnNext.style.opacity = currentPage === totalPages || totalPages === 0 ? '0.3' : '1';
            btnNext.style.pointerEvents = currentPage === totalPages || totalPages === 0 ? 'none' : 'auto';
        }
    } else {
        if (paginator) paginator.style.display = 'none';
    }
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const tripsToRender = generatedTrips.slice(startIndex, endIndex);
    
    tripsToRender.forEach((trip, index) => {
        const absoluteIndex = startIndex + index;
        // Aggregate items by SKU for the item list
        const itemSummary = {};
        trip.items.forEach(item => {
            const key = item.sku || item.desc || 'Sin SKU';
            if (!itemSummary[key]) {
                itemSummary[key] = {
                    sku: item.sku || '',
                    desc: item.desc || 'Pieza',
                    l: item.l,
                    w: item.w,
                    h: item.h,
                    weight: item.weight,
                    qty: 0
                };
            }
            itemSummary[key].qty += 1;
        });

        // Build the item list HTML
        let itemListHTML = '<div class="trip-item-list" style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">';
        itemListHTML += '<div style="font-size:11px; color:#94a3b8; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;"><i data-lucide="list" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;"></i>Detalle de Mercancía</div>';
        
        Object.values(itemSummary).forEach(it => {
            itemListHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:5px 8px; margin-bottom:3px; background:rgba(255,255,255,0.03); border-radius:6px; font-size:11px;">
                    <div style="display:flex; flex-direction:column; gap:1px; flex:1; min-width:0;">
                        <span style="color:#e2e8f0; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.sku || it.desc}</span>
                        <span style="color:#64748b; font-size:10px;">${(it.l*100).toFixed(0)}×${(it.w*100).toFixed(0)}×${(it.h*100).toFixed(0)} cm · ${it.weight} kg</span>
                    </div>
                    <span style="color:#7BA7B8; font-weight:700; font-size:12px; flex-shrink:0; margin-left:8px;">×${it.qty}</span>
                </div>`;
        });
        itemListHTML += '</div>';

        const headerHtml = `
            <div class="trip-route" style="display: flex; justify-content: space-between; align-items: center;">
                <span><i data-lucide="map"></i> ${trip.route}</span>
                <button class="btn-delete-trip" onclick="deleteTrip(${absoluteIndex})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.background='transparent'" title="Eliminar Viaje">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">${trip.unit.name}</div>
        `;
        const statsHtml = `
            <div class="trip-details">
                <p><i data-lucide="box"></i> Piezas: ${trip.items.length}</p>
                <p><i data-lucide="weight"></i> Peso Total: ${trip.totalWeight.toFixed(1)} kg / ${trip.unit.maxPayload} kg</p>
                <p><i data-lucide="maximize"></i> Vol. Total: ${trip.totalVolume.toFixed(1)} m³ / ${trip.unit.volume} m³</p>
            </div>
        `;

        const currentUser = window.appUserName || "Anónimo";
        const isLocked = trip.lockedBy && trip.lockedBy !== currentUser;
        let lockInfo = '';
        let btnDisabled = '';
        let btnStyle = '';
        
        if (isLocked) {
            const lockedAtTime = trip.lockedAt ? (trip.lockedAt.seconds * 1000) : 0;
            const now = Date.now();
            if (now - lockedAtTime < 120000) {
                lockInfo = `<div style="color: #F43F5E; font-size: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 5px;"><i data-lucide="lock" style="width: 14px; height: 14px;"></i> Editando: ${trip.lockedBy}</div>`;
                btnDisabled = 'disabled';
                btnStyle = 'opacity: 0.5; cursor: not-allowed; border-color: #333; color: #888;';
            }
        }

        const actionHtml = `
            ${lockInfo}
            <button class="btn-menu-option" style="width: 100%; justify-content: center; ${btnStyle}" onclick="acquireLockAndLoad(${absoluteIndex})" ${btnDisabled}>
                <i data-lucide="eye"></i> VER EN 3D
            </button>
        `;

        const card = document.createElement('div');
        card.className = trip.isExtra ? 'trip-card extra-unit' : 'trip-card';
        card.innerHTML = `${headerHtml}${statsHtml}${itemListHTML}${actionHtml}`;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

window.deleteTrip = function(index) {
    if(confirm("¿Estás seguro de que deseas eliminar este viaje?")) {
        const trip = generatedTrips[index];
        if (trip.id && window.db) {
            const tenant = window.appTenant || "default";
            window.db.collection('companies').doc(tenant).collection('shipments').doc(trip.id).delete();
        } else {
            generatedTrips.splice(index, 1);
            renderResults();
        }
    }
};

window.acquireLockAndLoad = async function(tripIndex) {
    const trip = generatedTrips[tripIndex];
    if (!trip) return;
    
    if (window.db && trip.id) {
        const tenant = window.appTenant || "default";
        const docRef = window.db.collection('companies').doc(tenant).collection('shipments').doc(trip.id);
        
        try {
            await docRef.update({
                lockedBy: window.appUserName || "Anónimo",
                lockedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            window.currentActiveShipmentId = trip.id;
            loadShipmentDataIntoApp(tripIndex);
        } catch(e) {
            console.error("Error adquiriendo bloqueo", e);
            alert("No se pudo acceder al embarque. Es posible que alguien más haya entrado en este instante.");
        }
    } else {
        loadShipmentDataIntoApp(tripIndex);
    }
};

window.loadShipmentDataIntoApp = function(tripIndex) {
    const trip = generatedTrips[tripIndex];
    
    // Hide massive screens
    document.getElementById('massive-cubing-container').style.display = 'none';
    
    // Show 3D App
    document.querySelector('.app-container').style.display = 'flex';
    window.dispatchEvent(new Event('resize'));
    
    // Set Unit in App
    const unitIndex = UNITS.findIndex(u => u.key === trip.unit.key);
    if(unitIndex !== -1 && window.app) {
        // Set the flag early to prevent stats warning alert from triggering
        window.fromMassiveResult = true;
        
        // Clear BOTH pending cargo AND already-placed cargo from previous trip visualization BEFORE switching unit/updating stats
        window.app.pendingCargo = [];
        window.app.cargoList = [];
        if (window.app.boxesGroup) {
            while (window.app.boxesGroup.children.length > 0)
                window.app.boxesGroup.remove(window.app.boxesGroup.children[0]);
        }

        window.app.currentUnitIndex = unitIndex;
        window.app.switchUnit(UNITS[unitIndex]);
        
        // Update UI Dropdown so runSmartCubicaje sees it as selected
        const wrapper = document.getElementById('custom-unit-select');
        if(wrapper) {
            const labelSpan = wrapper.querySelector('#custom-select-label');
            if (labelSpan) labelSpan.innerText = UNITS[unitIndex].name;
            
            const allCb = wrapper.querySelector('.custom-option[data-value="all"] input');
            if(allCb) {
                allCb.checked = false;
                allCb.closest('.custom-option').classList.remove('selected');
            }
            
            wrapper.querySelectorAll('.custom-option:not([data-value="all"])').forEach(opt => {
                if (opt.dataset.value === trip.unit.key) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
        
        // Reset color caches so each trip gets fresh, per-SKU colors
        window.app.skuColors = {};
        window.app.sharedMaterials = {};
        
        // Force the app to compute the layout for these specific items (aggregated by identical dimensions AND SKU)
        let aggregatedItems = [];
        trip.items.forEach(item => {
            let existing = aggregatedItems.find(i => 
                i.l === item.l && i.w === item.w && i.h === item.h && i.weight === item.weight && i.sku === item.sku
            );
            if (existing) {
                existing.qty += 1;
            } else {
                aggregatedItems.push({
                    l: item.l,
                    w: item.w,
                    h: item.h,
                    weight: item.weight,
                    desc: item.desc,
                    qty: 1,
                    fragile: false,
                    stackable: true,
                    sku: item.sku || 'MASIVO'
                });
            }
        });
        window.app.pendingCargo = aggregatedItems;
        
        // Limpiar campos del formulario para dashboard limpio
        document.getElementById('input-length').value = '';
        document.getElementById('input-width').value = '';
        document.getElementById('input-height').value = '';
        document.getElementById('input-weight').value = '';
        document.getElementById('input-quantity').value = '';
        document.getElementById('input-description').value = '';
        const skuInput = document.getElementById('input-sku');
        if (skuInput) skuInput.value = '';

        // Update pending list UI (auto-generar lista de mercancía)
        window.app.renderPendingList();
        
        // Configurar Boton Superior para Volver
        window.fromMassiveResult = true;
        const btnMenu = document.getElementById('btn-back-to-menu');
        if (btnMenu) {
            if (!btnMenu.dataset.originalHtml) btnMenu.dataset.originalHtml = btnMenu.innerHTML;
            btnMenu.innerHTML = '<i data-lucide="arrow-left"></i> Panel';
            btnMenu.style.borderColor = '#00e5ff';
            btnMenu.style.color = '#00e5ff';
            if (window.lucide) window.lucide.createIcons();
        }

        // Remover el boton dinámico viejo si existía
        let btnBackMassive = document.getElementById('btn-back-massive');
        if(btnBackMassive) btnBackMassive.remove();
        
        setTimeout(async () => {
            if(window.app.runSmartCubicaje) {
                await window.app.runSmartCubicaje();
                
                // Después de cubicar, reconstruir la lista visual desde las piezas colocadas
                if (window.fromMassiveResult && window.app.cargoList.length > 0) {
                    const placedSummary = [];
                    window.app.cargoList.forEach(box => {
                        let existing = placedSummary.find(i => 
                            i.l === box.l && i.w === box.w && i.h === box.h && i.weight === box.weight && i.sku === box.sku
                        );
                        if (existing) {
                            existing.qty += 1;
                        } else {
                            placedSummary.push({
                                l: box.l, w: box.w, h: box.h,
                                weight: box.weight,
                                desc: box.sku || box.originalDesc || 'Pieza',
                                qty: 1,
                                fragile: false,
                                stackable: box.stackable,
                                sku: box.sku
                            });
                        }
                    });
                    window.app.pendingCargo = placedSummary;
                    window.app.renderPendingList();
                }
            }
        }, 500);
    }
};
