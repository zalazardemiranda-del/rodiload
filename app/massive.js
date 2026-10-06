// massive.js - Lógica de Cubicación Masiva
let massiveData = [];
let availableUnitsConfig = {};
let generatedTrips = [];
let shipmentsUnsubscribe = null;

window.rodiloadAlert = function(message, type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-alert-overlay');
        const title = document.getElementById('custom-alert-title');
        const msg = document.getElementById('custom-alert-message');
        const btnOk = document.getElementById('custom-alert-btn-ok');
        const btnCancel = document.getElementById('custom-alert-btn-cancel');
        const icon = document.getElementById('custom-alert-icon');
        if (!overlay) { alert(message); return resolve(true); }
        
        let iconName = 'info';
        let iconColor = '#52b5d4';
        let titleText = 'Información';
        
        if (message.includes('⚠️')) {
            iconName = 'alert-triangle';
            iconColor = '#f59e0b';
            titleText = 'Atención';
            message = message.replace(/⚠️/g, '').trim();
        } else if (message.includes('✅')) {
            iconName = 'check-circle';
            iconColor = '#10b981';
            titleText = 'Éxito';
            message = message.replace(/✅/g, '').trim();
        } else if (type === 'confirm') {
            iconName = 'help-circle';
            iconColor = '#DE8B2A';
            titleText = 'Confirmar Acción';
        }
        
        msg.innerHTML = message.replace(/\n/g, '<br>');
        title.textContent = titleText;
        icon.setAttribute('data-lucide', iconName);
        icon.style.color = iconColor;
        
        if (window.lucide) window.lucide.createIcons();
        
        if (type === 'confirm') {
            btnCancel.style.display = 'block';
            btnOk.textContent = 'Sí, Continuar';
        } else {
            btnCancel.style.display = 'none';
            btnOk.textContent = 'Aceptar';
        }
        
        overlay.style.display = 'flex';
        
        const cleanup = () => {
            overlay.style.display = 'none';
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
        };
        
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        
        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
};

window.rodiloadConfirm = function(message) {
    return window.rodiloadAlert(message, 'confirm');
};


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
        renderMassiveUnitsDropdown();
        initMassiveTable();
        switchMassiveTab('registro');
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

    document.getElementById('btn-new-massive')?.addEventListener('click', async () => {
        // Action: Limpiar Resultados
        if (await window.rodiloadConfirm("¿Estás seguro de que deseas limpiar TODOS los resultados compartidos? Esto borrará los embarques para todos los usuarios de la empresa.")) {
            const tenant = window.appTenant || "default";
            generatedTrips.forEach(trip => {
                if (trip.id && window.db) {
                    window.db.collection('companies').doc(tenant).collection('shipments').doc(trip.id).delete();
                }
            });
            generatedTrips = [];
            currentPage = 1;
            renderResults();
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

    // 3. Navegación por pestañas (Registro de Carga vs Embarques cubicados)
    document.getElementById('btn-tab-registro')?.addEventListener('click', () => switchMassiveTab('registro'));
    document.getElementById('btn-tab-cubicados')?.addEventListener('click', () => switchMassiveTab('cubicados'));
    document.getElementById('btn-back-to-registro-view')?.addEventListener('click', () => switchMassiveTab('registro'));
    document.getElementById('btn-empty-go-registro')?.addEventListener('click', () => switchMassiveTab('registro'));

    // 4. Menú Desplegable de Unidades Disponibles (Imagen 1 y 2)
    const btnUnitsToggle = document.getElementById('btn-units-dropdown-toggle');
    const unitsDropdown = document.getElementById('units-dropdown-menu');
    const unitsChevron = document.getElementById('units-dropdown-chevron');

    btnUnitsToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = unitsDropdown.style.display === 'block';
        unitsDropdown.style.display = isOpen ? 'none' : 'block';
        if (unitsChevron) unitsChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    document.addEventListener('click', (e) => {
        const container = document.getElementById('units-dropdown-container');
        if (container && !container.contains(e.target)) {
            if (unitsDropdown) unitsDropdown.style.display = 'none';
            if (unitsChevron) unitsChevron.style.transform = 'rotate(0deg)';
        }
    });

    // Seleccionar / deseleccionar todas las unidades
    document.getElementById('btn-toggle-all-units')?.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#massive-units-list-dropdown .unit-cb');
        const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = anyUnchecked;
            const parentItem = cb.closest('.unit-dropdown-item');
            if (parentItem) {
                if (anyUnchecked) parentItem.classList.add('checked');
                else parentItem.classList.remove('checked');
            }
        });
        updateSelectedUnitsCount();
        evaluateAllRows();
    });

    // 5. Botones de Tabla: Agregar Fila y Limpiar
    document.getElementById('btn-add-table-row')?.addEventListener('click', () => {
        addTableRow();
    });

    document.getElementById('btn-clear-table-rows')?.addEventListener('click', async () => {
        if (await window.rodiloadConfirm("¿Deseas limpiar todos los registros de la tabla?")) {
            const tbody = document.getElementById('cargo-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                for (let i = 0; i < 20; i++) addTableRow();
            }
        }
    });

    // Pegar contenido desde Excel / Portapapeles (Ctrl + V en cualquier celda)
    document.getElementById('cargo-table-body')?.addEventListener('paste', (e) => {
        const text = e.clipboardData?.getData('text');
        if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
        e.preventDefault();

        const lines = text.trim().split(/\r?\n/).map(line => line.split('\t'));
        const activeInput = document.activeElement;
        const currentTr = activeInput ? activeInput.closest('tr') : null;
        let startRowIndex = currentTr ? Array.from(currentTr.parentNode.children).indexOf(currentTr) : 0;

        const allTrs = Array.from(document.querySelectorAll('#cargo-table-body tr'));

        lines.forEach((cols, rIdx) => {
            let targetTr = allTrs[startRowIndex + rIdx];
            if (!targetTr) {
                targetTr = addTableRow();
            }
            const inputs = [
                targetTr.querySelector('.col-sku'),
                targetTr.querySelector('.col-origen'),
                targetTr.querySelector('.col-destino'),
                targetTr.querySelector('.col-largo'),
                targetTr.querySelector('.col-ancho'),
                targetTr.querySelector('.col-alto'),
                targetTr.querySelector('.col-peso'),
                targetTr.querySelector('.col-cantidad'),
                targetTr.querySelector('.col-desc')
            ];
            cols.forEach((val, cIdx) => {
                if (inputs[cIdx] && val !== undefined) inputs[cIdx].value = val.trim();
            });
            evaluateRow(targetTr);
        });
        evaluateAllRows();
    });

    // 6. Botón Comenzar Cubicación
    document.getElementById('btn-process-massive')?.addEventListener('click', runMassiveCubing);
});

// --- NAVEGACIÓN ENTRE VISTAS ---
function switchMassiveTab(tab) {
    const tabRegistro = document.getElementById('btn-tab-registro');
    const tabCubicados = document.getElementById('btn-tab-cubicados');
    const viewRegistro = document.getElementById('massive-view-registro');
    const viewCubicados = document.getElementById('massive-view-cubicados');

    if (tab === 'registro') {
        if (tabRegistro) tabRegistro.classList.add('active');
        if (tabCubicados) tabCubicados.classList.remove('active');
        if (viewRegistro) viewRegistro.style.display = 'flex';
        if (viewCubicados) viewCubicados.style.display = 'none';
    } else {
        if (tabCubicados) tabCubicados.classList.add('active');
        if (tabRegistro) tabRegistro.classList.remove('active');
        if (viewRegistro) viewRegistro.style.display = 'none';
        if (viewCubicados) viewCubicados.style.display = 'flex';
        renderResults();
    }
    if (window.lucide) lucide.createIcons();
}

// --- MENÚ DESPLEGABLE DE UNIDADES DISPONIBLES (IMAGEN 2) ---
function renderMassiveUnitsDropdown() {
    const list = document.getElementById('massive-units-list-dropdown');
    if (!list) return;
    list.innerHTML = '';

    // Leer unidades guardadas o default
    let defaultKeys = [];
    const savedFleet = localStorage.getItem('rodiload_default_fleet');
    if (savedFleet) {
        try {
            defaultKeys = JSON.parse(savedFleet).map(f => f.key);
        } catch(e) {}
    }
    if (defaultKeys.length === 0) {
        defaultKeys = [UNITS[0].key]; // Por defecto la primera unidad (20' Standard)
    }

    UNITS.forEach((u) => {
        const item = document.createElement('div');
        item.className = 'unit-dropdown-item';
        const isChecked = defaultKeys.includes(u.key);
        if (isChecked) item.classList.add('checked');

        item.innerHTML = `
            <label style="display:flex; align-items:center; width:100%; cursor:pointer; user-select:none;">
                <input type="checkbox" class="unit-cb" data-key="${u.key}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary);">
                <div style="display:flex; flex-direction:column; line-height:1.2;">
                    <span style="font-size:13px; font-weight:700; color: #163A45;">${u.name} <span style="font-size:11px; color:#829598; font-weight:400; margin-left:4px;">(Max: ${u.maxPayload.toLocaleString()}kg)</span></span>
                </div>
            </label>
        `;

        const cb = item.querySelector('.unit-cb');
        cb.addEventListener('change', (e) => {
            e.stopPropagation();
            if (cb.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
            updateSelectedUnitsCount();
            evaluateAllRows();
        });

        item.addEventListener('click', (e) => {
            if (e.target !== cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(item);
    });

    updateSelectedUnitsCount();
}

function updateSelectedUnitsCount() {
    const checked = document.querySelectorAll('#massive-units-list-dropdown .unit-cb:checked');
    const badge = document.getElementById('units-selected-count');
    if (badge) badge.textContent = checked.length;
}

function getSelectedUnits() {
    const checked = Array.from(document.querySelectorAll('#massive-units-list-dropdown .unit-cb:checked'));
    const keys = checked.map(cb => cb.getAttribute('data-key'));
    return UNITS.filter(u => keys.includes(u.key));
}

// --- EVALUACIÓN DE FILA Y NOTA (SUGERENCIA DE SOBREDIMENSIONADO) ---
function evaluateRow(tr) {
    if (!tr) return;
    const inputLargo = tr.querySelector('.col-largo');
    const inputAncho = tr.querySelector('.col-ancho');
    const inputAlto  = tr.querySelector('.col-alto');
    const inputPeso  = tr.querySelector('.col-peso');
    const cellNota   = tr.querySelector('.col-nota');

    if (!inputLargo || !inputAncho || !inputAlto || !inputPeso || !cellNota) return;

    const largo = parseFloat(inputLargo.value) || 0;
    const ancho = parseFloat(inputAncho.value) || 0;
    const alto  = parseFloat(inputAlto.value)  || 0;
    const peso  = parseFloat(inputPeso.value)  || 0;

    // Si los campos están vacíos o incompletos
    if (largo <= 0 || ancho <= 0 || alto <= 0 || peso <= 0) {
        tr.classList.remove('row-orange');
        cellNota.innerHTML = '<span class="nota-text">—</span>';
        return;
    }

    const item = {
        l: largo / 100,
        w: ancho / 100,
        h: alto / 100,
        weight: peso
    };

    const selectedUnits = getSelectedUnits();
    const fitsInSelected = selectedUnits.some(u => itemFitsUnit(item, u));

    if (fitsInSelected) {
        tr.classList.remove('row-orange');
        cellNota.innerHTML = '<span class="nota-text" style="color:#059669; font-weight: 600;">✓ Compatible</span>';
    } else {
        // No cabe en las unidades seleccionadas -> fila en naranja
        tr.classList.add('row-orange');

        // Buscar unidades del sistema donde SÍ quepa
        const candidateUnits = UNITS.filter(u => itemFitsUnit(item, u));

        if (candidateUnits.length > 0) {
            candidateUnits.sort((a, b) => a.volume - b.volume);
            const suggested = candidateUnits[0].name;
            cellNota.innerHTML = `
                <span class="nota-text oversized" style="color: #c2410c; display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: #ea580c; flex-shrink: 0;"></i>
                    <span>Sobredimensionado · Sugerencia: <strong>${suggested}</strong></span>
                </span>`;
        } else {
            cellNota.innerHTML = `
                <span class="nota-text oversized" style="color: #dc2626; display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="alert-circle" style="width: 14px; height: 14px; color: #dc2626; flex-shrink: 0;"></i>
                    <span>Sobredimensionado · Excede capacidades del sistema</span>
                </span>`;
        }
        if (window.lucide) lucide.createIcons();
    }

    // Auto-expand table by 20 rows if the last row is being typed in
    if (tr === tr.parentNode.lastElementChild) {
        if (largo > 0 || ancho > 0 || alto > 0 || peso > 0) {
            for (let i = 0; i < 20; i++) {
                addTableRow();
            }
        }
    }
}

function evaluateAllRows() {
    const rows = document.querySelectorAll('#cargo-table-body tr');
    rows.forEach(tr => evaluateRow(tr));
}

// --- GESTIÓN DE TABLA (REGISTRO DE CARGA) ---
function addTableRow(data = {}) {
    const tbody = document.getElementById('cargo-table-body');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="cell-input col-sku" placeholder="" value="${data.sku || ''}"></td>
        <td><input type="text" class="cell-input col-origen" placeholder="" value="${data.origen || ''}"></td>
        <td><input type="text" class="cell-input col-destino" placeholder="" value="${data.destino || ''}"></td>
        <td><input type="number" step="any" min="0" class="cell-input col-largo" placeholder="" value="${data.largo || ''}"></td>
        <td><input type="number" step="any" min="0" class="cell-input col-ancho" placeholder="" value="${data.ancho || ''}"></td>
        <td><input type="number" step="any" min="0" class="cell-input col-alto" placeholder="" value="${data.alto || ''}"></td>
        <td><input type="number" step="any" min="0" class="cell-input col-peso" placeholder="" value="${data.peso || ''}"></td>
        <td><input type="number" min="1" class="cell-input col-cantidad" placeholder="" value="${data.cantidad || ''}"></td>
        <td><input type="text" class="cell-input col-desc" placeholder="" value="${data.descripcion || ''}"></td>
        <td>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: left; margin: 0 auto; width: 100%; max-width: 170px;">
                <label style="font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" class="cb-fragil" ${data.fragil ? 'checked' : ''} style="accent-color: var(--primary);"> FRÁGIL
                </label>
                <label style="font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" class="cb-apilable" ${data.apilable === false ? '' : 'checked'} style="accent-color: var(--primary);"> APILABLE
                </label>
                <label style="font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" class="cb-peligroso" ${data.peligroso ? 'checked' : ''} style="accent-color: var(--primary);"> PELIGROSO
                </label>
                <label style="font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" class="cb-refrigerado" ${data.refrigerado ? 'checked' : ''} style="accent-color: var(--primary);"> REFRIG.
                </label>
            </div>
        </td>
        <td class="col-nota" style="text-align: left; padding: 6px 12px;"><span class="nota-text"></span></td>
    `;

    // Listeners para evaluar en vivo
    tr.querySelectorAll('.col-largo, .col-ancho, .col-alto, .col-peso').forEach(input => {
        input.addEventListener('input', () => evaluateRow(tr));
        input.addEventListener('change', () => evaluateRow(tr));
    });

    tbody.appendChild(tr);
    if (window.lucide) lucide.createIcons();

    // Evaluar si vino con datos
    if (data.largo && data.ancho && data.alto && data.peso) {
        evaluateRow(tr);
    }

    return tr;
}

function initMassiveTable() {
    const tbody = document.getElementById('cargo-table-body');
    if (!tbody) return;
    if (tbody.children.length === 0) {
        for (let i = 0; i < 20; i++) {
            addTableRow();
        }
    }
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
    evaluateAllRows();

    // 1. Obtener unidades seleccionadas en el menú desplegable
    const selectedUnits = getSelectedUnits();
    if (selectedUnits.length === 0) {
        await window.rodiloadAlert("⚠️ Por favor selecciona al menos un tipo de unidad disponible en el menú desplegable.");
        const menu = document.getElementById('units-dropdown-menu');
        if (menu) menu.style.display = 'block';
        return;
    }

    availableUnitsConfig = {};
    selectedUnits.forEach(u => {
        availableUnitsConfig[u.key] = 999; // Disponibilidad ilimitada de unidades seleccionadas
    });

    // 2. Extraer datos directamente de la tabla (Registro de Carga)
    const rows = document.querySelectorAll('#cargo-table-body tr');
    const validItems = [];
    const oversizedItems = [];

    rows.forEach((tr, idx) => {
        const sku = tr.querySelector('.col-sku')?.value.trim() || `SKU-${String(idx + 1).padStart(2, '0')}`;
        const origen = tr.querySelector('.col-origen')?.value.trim() || 'Planta Origen';
        const destino = tr.querySelector('.col-destino')?.value.trim() || 'Destino General';
        const largo = parseFloat(tr.querySelector('.col-largo')?.value) || 0;
        const ancho = parseFloat(tr.querySelector('.col-ancho')?.value) || 0;
        const alto = parseFloat(tr.querySelector('.col-alto')?.value) || 0;
        const peso = parseFloat(tr.querySelector('.col-peso')?.value) || 0;
        const cantidad = Math.max(1, parseInt(tr.querySelector('.col-cantidad')?.value) || 1);
        const desc = tr.querySelector('.col-desc')?.value.trim() || 'Mercancía';
        const fragil = tr.querySelector('.cb-fragil')?.checked || false;
        const apilable = tr.querySelector('.cb-apilable')?.checked ?? true;
        const peligroso = tr.querySelector('.cb-peligroso')?.checked || false;
        const refrigerado = tr.querySelector('.cb-refrigerado')?.checked || false;

        if (largo > 0 && ancho > 0 && alto > 0 && peso > 0) {
            const rawItem = {
                SKU: sku,
                Origen: origen,
                Destino: destino,
                Largo: largo,
                Ancho: ancho,
                Alto: alto,
                Peso: peso,
                Cantidad: cantidad,
                Descripcion: desc,
                Fragil: fragil,
                Apilable: apilable,
                Peligroso: peligroso,
                Refrigerado: refrigerado
            };

            const fitsAny = selectedUnits.some(u => itemFitsUnit({
                l: largo / 100,
                w: ancho / 100,
                h: alto / 100,
                weight: peso
            }, u));

            if (fitsAny) {
                validItems.push(rawItem);
            } else {
                oversizedItems.push(rawItem);
            }
        }
    });

    if (validItems.length === 0 && oversizedItems.length === 0) {
        await window.rodiloadAlert("⚠️ Por favor ingresa al menos una mercancía en la tabla con dimensiones (Largo, Ancho, Alto) y Peso.");
        return;
    }

    if (validItems.length === 0) {
        await window.rodiloadAlert("⚠️ Ninguna de las mercancías cabe en las unidades seleccionadas actualmente.\nRevisa las filas marcadas en naranja y las sugerencias en la columna 'Nota' para añadir la unidad adecuada en el menú desplegable.");
        return;
    }

    massiveData = validItems;

    // Mostrar loader
    const loader = document.getElementById('loading-screen');
    const loaderText = loader.querySelector('.loader-title') || loader.querySelector('.loader-text');
    if (loaderText) loaderText.innerText = "Cubicando embarques...";
    loader.style.display = 'flex';

    await new Promise(r => setTimeout(r, 120));
    await calculateTrips();
    loader.style.display = 'none';

    // Cambiar a la vista "Embarques cubicados" (Imagen 3)
    switchMassiveTab('cubicados');

    if (oversizedItems.length > 0) {
        setTimeout(async () => {
            await window.rodiloadAlert(`✅ Carga cubicada con éxito.\n\n⚠️ Atención: ${oversizedItems.length} mercancía(s) no cupieron en las unidades seleccionadas y aparecen resaltadas en naranja con su sugerencia en la pestaña 'Registro de Carga'.`);
        }, 300);
    }
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
        const success = window.app.calculatePositionAndAdd(item.w, item.l, item.h, item.weight, item.stackable !== false, item.sku || "");
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
                sku:    sku,
                fragile: row.Fragil || false,
                stackable: row.Apilable !== false, // defaults to true
                dangerous: row.Peligroso || false,
                refrigerated: row.Refrigerado || false
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
                await window.rodiloadAlert(`⚠️ Las siguientes piezas de la ruta "${route}" no caben en ninguna de las unidades seleccionadas y serán omitidas:\n${skipped}`);
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
    const emptyMsg = document.getElementById('massive-empty-results-msg');
    if (!grid) return;
    grid.innerHTML = '';
    
    const totalPages = Math.ceil(generatedTrips.length / ITEMS_PER_PAGE);
    
    if (generatedTrips.length > 0) {
        if (emptyMsg) emptyMsg.style.display = 'none';
        grid.style.display = 'grid';
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
        if (emptyMsg) emptyMsg.style.display = 'block';
        grid.style.display = 'none';
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

window.deleteTrip = async function(index) {
    if(await window.rodiloadConfirm("¿Estás seguro de que deseas eliminar este viaje?")) {
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
            await window.rodiloadAlert("No se pudo acceder al embarque. Es posible que alguien más haya entrado en este instante.");
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
                    fragile: item.fragile || false,
                    stackable: item.stackable !== false,
                    dangerous: item.dangerous || false,
                    refrigerated: item.refrigerated || false,
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
            btnMenu.style.borderColor = '#ffffff';
            btnMenu.style.color = '#ffffff';
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
