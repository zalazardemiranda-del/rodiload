const UNITS = [
    { key: 'cont_20gp',   name: '20\' Standard (20GP)', width: 2.35, height: 2.39, length: 5.90, maxPayload: 25000, volume: 33.0, doorHeight: 2.28, model: 'assets/models/MODELO 3D CARRO PARA CONTENEDOR 20.glb', scale: 4.79,  bedHeight: 1.45, offset: { x: -3.20,y: 1.45, z: -0.3 }, modelOffset: { x: -1.45, y: 0.90, z: -0.25 } },
    { key: 'cont_40gp',   name: '40\' Standard (40GP)', width: 2.35, height: 2.39, length: 12.03,maxPayload: 27600, volume: 67.0, doorHeight: 2.28, model: 'assets/models/trailer 53 ft.glb', scale: 8.38,  bedHeight: 2.00, offset: { x: -5.96,y: 2.00, z: 0.0 }, modelOffset: { x: -1.78, y: 2.00, z: 0.00 } },
    { key: 'cont_40hc',   name: '40\' High Cube (40HC)',width: 2.35, height: 2.69, length: 12.03,maxPayload: 28600, volume: 76.0, doorHeight: 2.56, model: 'assets/models/trailer 53 ft.glb', scale: 8.23,  bedHeight: 1.55, offset: { x: -5.91,y: 1.55, z: 0.0 }, modelOffset: { x: -1.73, y: 1.60, z: 0.00 } },
    { key: 'nissan_1.5t',  name: 'PICK UP 1 TON',        width: 1.22, height: 1.12, length: 1.74, maxPayload: 1000,  volume: 2.37,  model: 'assets/models/nissan_1_5.glb',    scale: 2.15,  bedHeight: 0.68, offset: { x: -1.8, y: 0.68, z: 0.0 }, modelOffset: { x: -1.699, y: 0.957, z: 0.002 } },
    { key: 'van_3ton',     name: 'PICK UP 1.5 TON',      width: 1.69, height: 1.78, length: 2.80, maxPayload: 1500,  volume: 8.42,  model: 'assets/models/nissan_1_5.glb',    scale: 3.50,  bedHeight: 1.09, offset: { x: -2.9, y: 1.09, z: 0.0 }, modelOffset: { x: -2.798, y: 1.529, z: 0.003 } },
    { key: 'torton_3.5m', name: 'CAMIONETA DE CARGA',     width: 1.70, height: 1.80, length: 3.30, maxPayload: 2500,  volume: 10.0,  model: 'assets/models/nissan_1_5.glb',    scale: 3.70,  bedHeight: 1.30, offset: { x: -3.4, y: 1.30, z: 0.0 }, modelOffset: { x: -3.248, y: 1.640, z: 0.004 } },
    { key: 'rabon_4.5m',  name: 'TORTON',                width: 2.40, height: 2.10, length: 4.30, maxPayload: 3500,  volume: 21.0,  model: 'assets/models/modelo torton.glb', scale: 3.60,  bedHeight: 1.30, offset: { x: -1.0, y: 1.3,  z: 0.0 }, modelOffset: { x: -0.148, y: 1.257, z: 0.001 } },
    { key: 'rabon_10ton', name: 'RABON 10 TON',          width: 2.50, height: 2.50, length: 7.30, maxPayload: 10000, volume: 45.0,  model: 'assets/models/rabon 10 ton.glb', scale: 5.20,  bedHeight: 2.00, offset: { x: -2.5, y: 2.0,  z: 0.0 }, modelOffset: { x: -0.144, y: 2.387, z: 0.006 } },
    { key: 'trailer_53ft',name: 'Trailer 53 FT',         width: 2.45, height: 2.72, length: 15.50,maxPayload: 20000, volume: 102.0, model: 'assets/models/trailer 53 ft.glb',  scale: 10.60, bedHeight: 2.00, offset: { x: -7.45,y: 2.0,  z: 0.0 }, modelOffset: { x: -1.916, y: 2.089, z: 0.049 } },
    { key: 'lowboy_3ejes',name: 'LOWBOY 3 EJES',         width: 2.59, height: 6.00, length: 12.485,maxPayload: 40000, volume: 250.0, model: 'assets/models/MODELO LOWBOY.glb',  scale: 18.40, bedHeight: 1.50, offset: { x: -4.40,y: 1.50, z: -0.55 }, modelOffset: { x: -3.10, y: 2.85, z: -0.50 }, openDeck: true, secondaryDeck: { length: 3.65, width: 2.59, bedHeightOffset: 0.8, offsetX: 12.485 } }
];

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBV6eDF2Wk3dWS9bHOgUGDr1cgzPFGwgAE",
  authDomain: "rodiload.firebaseapp.com",
  projectId: "rodiload",
  storageBucket: "rodiload.firebasestorage.app",
  messagingSenderId: "1804934329",
  appId: "1:1804934329:web:1490ae8cc5452322160f68",
  measurementId: "G-B75RQH5FVE"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
window.db = db;

class CubicadorApp {
    constructor() {
        try {
            this.container = document.getElementById('three-container');
            this.cargoList = [];
            this.pendingCargo = [];
        this.shipments = []; // Nueva lista de piezas en espera
            this.currentSystem = 'metric'; // 'metric' o 'imperial'
            this.currentUnitIndex = 0; 
            this.currentUnit = UNITS[this.currentUnitIndex]; 
            this.loader = null;
            this.modelCache = {}; // Cache para modelos GLB — evita re-descargas
            if (typeof THREE.GLTFLoader !== 'undefined') {
                this.loader = new THREE.GLTFLoader();
            } else if (typeof GLTFLoader !== 'undefined') {
                this.loader = new GLTFLoader();
            } else {
                console.error("GLTFLoader no encontrado. Asegúrate de que los scripts en index.html estén cargados.");
            }
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
            this.isLocked = false;
            window.app = this;
            this.isManualMode = false;
            this.selectedBox = null;
            this.selectedCargoIndex = null;
            this.editingIndex = null;
            this.skuColors = {};
            this.colorPalette = [
                '#7BA7B8', '#C4976E', '#7BAF8E', '#B87D8A', '#9A8DB8',
                '#B8A86E', '#8A8DB8', '#B87DA8', '#7BAF9E', '#B89A7D',
                '#8EB87D', '#7D9AB8', '#B8877D', '#7DB8A8', '#A88DB8',
                '#B8B07D', '#7DB8B8', '#B87D97', '#8AB87D', '#7D87B8'
            ];
            this.raycaster = new THREE.Raycaster();

            this.initThree();
            this.renderUnitChips();
            this.initUnitSelect();
            this.setupEventListeners();
            this.setupLoginListeners();
            this.setupCalibrationListeners(); 
            this.animate();
            this.createFullUnit();
            this.updateStats();
            // Precargar todos los modelos únicos en segundo plano
            this.preloadAllModels();
        } catch (e) { console.error(e); }
    }


    preloadAllModels() {
        if (!this.loader) return;
        // Obtener lista de modelos únicos
        const uniqueModels = [...new Set(UNITS.filter(u => u.model).map(u => u.model))];
        uniqueModels.forEach(modelPath => {
            if (!this.modelCache[modelPath]) {
                this.loader.load(modelPath, (gltf) => {
                    this.modelCache[modelPath] = gltf;
                    console.log('[Preload] Listo en caché:', modelPath);
                }, null, (err) => {
                    console.warn('[Preload] Error al precargar:', modelPath, err);
                });
            }
        });
    }

    initThree() {

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x829598); // Grey
        this.scene.fog = new THREE.Fog(0x829598, 20, 100);
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(15, 10, 15);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        const OrbitCtrl = (typeof THREE !== 'undefined' && THREE.OrbitControls) ? THREE.OrbitControls : (typeof OrbitControls !== 'undefined' ? OrbitControls : null);
        if (OrbitCtrl) {
            this.controls = new OrbitCtrl(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
        }

        // Inicializar TransformControls
        const TransformCtrl = (typeof THREE !== 'undefined' && THREE.TransformControls) ? THREE.TransformControls : (typeof TransformControls !== 'undefined' ? TransformControls : null);
        if (TransformCtrl) {
            this.transformControls = new TransformCtrl(this.camera, this.renderer.domElement);
            this.transformControls.addEventListener('dragging-changed', (event) => {
                if (this.controls) this.controls.enabled = !event.value;
                if (event.value && this.transformControls.object) {
                    this.transformControls.object.userData.lastValidPos = this.transformControls.object.position.clone();
                }
                if (!event.value) {
                    this.checkAllBounds();
                    this.updateStats();
                }
            });

            // Real-time Physics & Snapping & Collision Prevention
            this.transformControls.addEventListener('change', () => {
                if (this.transformControls.object && this.transformControls.dragging) {
                    const mesh = this.transformControls.object;
                    const oldPos = mesh.userData.lastValidPos;
                    
                    this.applyPhysics(mesh);
                    
                    if (this.hasCollision(mesh)) {
                        if (oldPos) mesh.position.copy(oldPos);
                    } else {
                        mesh.userData.lastValidPos = mesh.position.clone();
                    }
                }
            });

            this.scene.add(this.transformControls);
        }

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);
        const sun1 = new THREE.DirectionalLight(0xffffff, 0.8);
        sun1.position.set(10, 20, 10);
        this.scene.add(sun1);
        const sun2 = new THREE.DirectionalLight(0xffffff, 0.5);
        sun2.position.set(-10, 10, -10);
        this.scene.add(sun2);
        const fillLight = new THREE.PointLight(0xffffff, 0.5);
        fillLight.position.set(0, 5, 10);
        this.scene.add(fillLight);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x829598, roughness: 0.8 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        this.scene.add(ground);
        
        const grid = new THREE.GridHelper(200, 100, 0x163A45, 0x163A45); // Night Ocean grid
        grid.position.y = 0;
        this.scene.add(grid);
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupCalibrationListeners() {
        const panel = document.getElementById('calibration-panel');
        if (panel) {
            document.getElementById('calib-move-left').onclick = () => { if(this.selectedModel) this.selectedModel.position.x -= 0.05; };
            document.getElementById('calib-move-right').onclick = () => { if(this.selectedModel) this.selectedModel.position.x += 0.05; };
            document.getElementById('calib-move-up').onclick = () => { if(this.selectedModel) this.selectedModel.position.y += 0.05; };
            document.getElementById('calib-move-down').onclick = () => { if(this.selectedModel) this.selectedModel.position.y -= 0.05; };
            document.getElementById('calib-move-back').onclick = () => { if(this.selectedModel) this.selectedModel.position.z -= 0.05; };
            document.getElementById('calib-move-front').onclick = () => { if(this.selectedModel) this.selectedModel.position.z += 0.05; };
            document.getElementById('calib-scale-down').onclick = () => { if(this.selectedModel) { const s = this.selectedModel.scale.x - 0.05; this.selectedModel.scale.set(s,s,s); } };
            document.getElementById('calib-scale-up').onclick = () => { if(this.selectedModel) { const s = this.selectedModel.scale.x + 0.05; this.selectedModel.scale.set(s,s,s); } };
            
            document.getElementById('btn-lock-calibration').onclick = () => { 
                if (this.selectedModel) {
                    const data = {
                        posX: this.selectedModel.position.x,
                        posY: this.selectedModel.position.y,
                        posZ: this.selectedModel.position.z,
                        scale: this.selectedModel.scale.x,
                        boxOffset: this.currentCargoOffset,
                        isLocked: true
                    };
                    localStorage.setItem(`calib_v1_${this.currentUnit.key}`, JSON.stringify(data));
                    alert(`UNIDAD BLOQUEADA: Configuración guardada para ${this.currentUnit.name}.`);
                }
                panel.style.display = 'none'; 
                this.selectedModel = null; 
            };

            document.getElementById('box-move-left').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.x -= 0.05; this.updateBlueBoxPosition(); } };
            document.getElementById('box-move-right').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.x += 0.05; this.updateBlueBoxPosition(); } };
            document.getElementById('box-move-up').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.y += 0.05; this.updateBlueBoxPosition(); } };
            document.getElementById('box-move-down').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.y -= 0.05; this.updateBlueBoxPosition(); } };
            document.getElementById('box-move-back').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.z -= 0.05; this.updateBlueBoxPosition(); } };
            document.getElementById('box-move-front').onclick = () => { if(this.blueBoxEdges) { this.currentCargoOffset.z += 0.05; this.updateBlueBoxPosition(); } };
            
            document.getElementById('btn-close-calibration').onclick = () => { panel.style.display = 'none'; };
        }
        
        const openBtn = document.getElementById('btn-open-calibration');
        if (openBtn) {
            openBtn.onclick = () => {
                const panel = document.getElementById('calibration-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                    // Activar el modelo de la unidad actual para calibrar
                    this.selectedModel = this.vehicleGroup.children.find(o => o.type === 'Group' || o.type === 'Mesh');
                }
            };
        }

        // Asegurar que el evento se dispare incluso si OrbitControls usa preventDefault en pointerdown
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('pointerdown', (e) => this.onManualMouseDown(e));
        } else {
            this.container.addEventListener('pointerdown', (e) => this.onManualMouseDown(e));
        }
        
        document.getElementById('btn-manual-mode')?.addEventListener('click', () => this.toggleManualMode());
        document.getElementById('close-manual')?.addEventListener('click', () => this.toggleManualMode(false));
        document.getElementById('close-detail')?.addEventListener('click', () => {
            const modal = document.getElementById('detail-modal');
            if (modal) modal.style.display = 'none';
        });
    }




    toggleManualMode(force) {
        this.isManualMode = force !== undefined ? force : !this.isManualMode;
        const btn = document.getElementById('btn-manual-mode');
        const panel = document.getElementById('manual-control-panel');
        if (!btn || !panel) return;

        if (this.isManualMode) {
            btn.classList.add('active');
            panel.style.display = 'block';
            this.controls.enabled = true; // Ahora permitimos mover la cámara libremente
        } else {
            btn.classList.remove('active');
            panel.style.display = 'none';
            this.controls.enabled = true;
            if (this.transformControls) this.transformControls.detach();
            this.deselectBox();
        }
    }

    onManualMouseDown(event) {
        if (!this.isManualMode) return;
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        let closestItem = null;
        let minDist = Infinity;

        if (this.boxesGroup) {
            const hits = this.raycaster.intersectObjects(this.boxesGroup.children, true);
            if (hits.length > 0) {
                const hit = hits[0];
                for (const item of this.cargoList) {
                    if (item.proxyMesh && hit.object === item.proxyMesh) {
                        closestItem = item;
                        break;
                    }
                    if (item.instancedMesh === hit.object && item.instanceId === hit.instanceId) {
                        closestItem = item;
                        break;
                    }
                }
            }
        }

        if (closestItem) {
            this.selectBox(closestItem);
        } else {
            const groundIntersects = this.raycaster.intersectObjects(this.scene.children.filter(o => o.type === 'Mesh' && !o.parent?.isGroup), false);
            if (groundIntersects.length > 0) {
                this.deselectBox();
            }
        }
    }

    selectBox(item) {
        this.deselectBox();
        this.selectedBox = item;
        
        const geo = this.getSharedGeometry(item.l, item.w, item.h);
        const mat = this.getSharedMaterial(item.sku, item.originalColor).clone();
        mat.emissive = new THREE.Color(0x00f5d4);
        mat.emissiveIntensity = 0.5;
        
        item.proxyMesh = new THREE.Mesh(geo, mat);
        item.proxyMesh.position.copy(item.position);
        item.proxyMesh.rotation.copy(item.rotation || new THREE.Euler());
        item.proxyMesh.userData = { isProxy: true, item: item };
        this.boxesGroup.add(item.proxyMesh);

        const dummy = new THREE.Object3D();
        dummy.position.copy(item.position);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        item.instancedMesh.setMatrixAt(item.instanceId, dummy.matrix);
        item.instancedMesh.instanceMatrix.needsUpdate = true;

        if (this.transformControls && this.isManualMode) {
            this.transformControls.attach(item.proxyMesh);
        }
    }

    deselectBox() {
        if (this.selectedBox) {
            const item = this.selectedBox;
            if (item.proxyMesh) {
                // Aplicar gravedad antes de confirmar la posición final
                this.applyGravity(item.proxyMesh);
                item.position.copy(item.proxyMesh.position);
                item.rotation.copy(item.proxyMesh.rotation);
                this.boxesGroup.remove(item.proxyMesh);
                item.proxyMesh = null;
            }
            const dummy = new THREE.Object3D();
            dummy.position.copy(item.position);
            dummy.rotation.copy(item.rotation);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            if (item.instancedMesh) {
                item.instancedMesh.setMatrixAt(item.instanceId, dummy.matrix);
                item.instancedMesh.instanceMatrix.needsUpdate = true;
            }
            if (this.transformControls) this.transformControls.detach();
        }
        this.selectedBox = null;
    }

    moveBoxManual(axis, amount) {
        if (!this.selectedBox || !this.selectedBox.proxyMesh) {
            alert("⚠️ Selecciona primero una pieza haciendo clic sobre ella en el modelo 3D.");
            return;
        }
        const oldPos = this.selectedBox.proxyMesh.position.clone();
        this.selectedBox.proxyMesh.position[axis] += amount;
        
        if (this.hasCollision(this.selectedBox.proxyMesh)) {
            this.selectedBox.proxyMesh.position.copy(oldPos); // Revertir si hay colisión
        } else {
            // Aplicar gravedad tras mover en X o Z (la caja puede quedar en el aire)
            if (axis !== 'y') {
                this.applyGravity(this.selectedBox.proxyMesh);
            }
        }
        
        this.checkAllBounds();
        this.updateStats();
    }

    rotateBoxManual(angle = 90) {
        if (!this.selectedBox || !this.selectedBox.proxyMesh) {
            alert("⚠️ Selecciona primero una pieza haciendo clic sobre ella en el modelo 3D.");
            return;
        }
        const oldRot = this.selectedBox.proxyMesh.rotation.clone();
        const rad = (angle * Math.PI) / 180;
        this.selectedBox.proxyMesh.rotation.y += rad;
        
        if (this.hasCollision(this.selectedBox.proxyMesh)) {
            this.selectedBox.proxyMesh.rotation.copy(oldRot); // Revertir si hay colisión
            return;
        }

        // Aplicar gravedad tras rotar (el perfil cambia y puede quedar en el aire)
        this.applyGravity(this.selectedBox.proxyMesh);
        
        // Actualizar dimensiones lógicas para estadísticas tras rotación
        // Nota: Para rotaciones no-90, esto es una aproximación
        if (angle % 180 !== 0) {
            const oldL = this.selectedBox.l;
            this.selectedBox.l = this.selectedBox.w;
            this.selectedBox.w = oldL;
        }
        
        this.checkAllBounds();
        this.updateStats();
    }

    checkAllBounds() {
        const unit = this.currentUnit;
        const offset = this.currentCargoOffset;
        
        const minX = offset.x;
        const maxX = offset.x + unit.length;
        const minY = offset.y;
        const maxY = offset.y + unit.height;
        const minZ = offset.z - unit.width / 2;
        const maxZ = offset.z + unit.width / 2;

        this.cargoList.forEach(item => {
            if (!item.proxyMesh) return;
            
            const box = new THREE.Box3().setFromObject(item.proxyMesh);
            const isOut = (
                box.min.x < minX - 0.01 || box.max.x > maxX + 0.01 ||
                box.min.y < minY - 0.01 || box.max.y > maxY + 0.01 ||
                box.min.z < minZ - 0.01 || box.max.z > maxZ + 0.01
            );

            item.proxyMesh.material.color.set(isOut ? 0xffa500 : item.originalColor);
            item.proxyMesh.material.emissive.set(isOut ? 0xff4500 : 0x00f5d4);
            item.proxyMesh.material.emissiveIntensity = isOut ? 0.8 : 0.5;
        });
    }

    applyPhysics(mesh) {
        const threshold = 0.08; // Distancia de magnetismo (8cm)
        const box = new THREE.Box3().setFromObject(mesh);
        
        // 1. Magnetismo con límites del camión
        const unit = this.currentUnit;
        const off = this.currentCargoOffset;
        const tMinX = off.x, tMaxX = off.x + unit.length;
        const tMinY = off.y;
        const tMinZ = off.z - unit.width/2, tMaxZ = off.z + unit.width/2;

        if (Math.abs(box.min.x - tMinX) < threshold) mesh.position.x += (tMinX - box.min.x);
        if (Math.abs(box.max.x - tMaxX) < threshold) mesh.position.x -= (box.max.x - tMaxX);
        if (Math.abs(box.min.y - tMinY) < threshold) mesh.position.y += (tMinY - box.min.y);
        if (Math.abs(box.min.z - tMinZ) < threshold) mesh.position.z += (tMinZ - box.min.z);
        if (Math.abs(box.max.z - tMaxZ) < threshold) mesh.position.z -= (box.max.z - tMaxZ);

        // 2. Magnetismo y Prevención de Colisión con otras cajas
        this.cargoList.forEach(item => {
            if (item.proxyMesh === mesh) return;
            
            const geo = this.getSharedGeometry(item.l, item.w, item.h);
            const temp = new THREE.Mesh(geo);
            temp.position.copy(item.proxyMesh && item.proxyMesh.parent === this.boxesGroup ? item.proxyMesh.position : item.position);
            temp.rotation.copy(item.proxyMesh && item.proxyMesh.parent === this.boxesGroup ? item.proxyMesh.rotation : (item.rotation || new THREE.Euler()));
            temp.updateMatrixWorld();
            
            const other = new THREE.Box3().setFromObject(temp);
            
            // Solo actuar si están cerca en los otros ejes para evitar saltos locos
            const nearX = Math.abs(box.max.x - other.min.x) < threshold || Math.abs(box.min.x - other.max.x) < threshold;
            const nearY = Math.abs(box.max.y - other.min.y) < threshold || Math.abs(box.min.y - other.max.y) < threshold;
            const nearZ = Math.abs(box.max.z - other.min.z) < threshold || Math.abs(box.min.z - other.max.z) < threshold;

            const overlapX = box.max.x > other.min.x + 0.01 && box.min.x < other.max.x - 0.01;
            const overlapY = box.max.y > other.min.y + 0.01 && box.min.y < other.max.y - 0.01;
            const overlapZ = box.max.z > other.min.z + 0.01 && box.min.z < other.max.z - 0.01;

            // Snapping X (si coincide en Y y Z)
            if (overlapY && overlapZ) {
                if (Math.abs(box.max.x - other.min.x) < threshold) mesh.position.x -= (box.max.x - other.min.x);
                if (Math.abs(box.min.x - other.max.x) < threshold) mesh.position.x += (other.max.x - box.min.x);
            }
            // Snapping Y (si coincide en X y Z)
            if (overlapX && overlapZ) {
                if (Math.abs(box.max.y - other.min.y) < threshold) mesh.position.y -= (box.max.y - other.min.y);
                if (Math.abs(box.min.y - other.max.y) < threshold) mesh.position.y += (other.max.y - box.min.y);
            }
            // Snapping Z (si coincide en X y Y)
            if (overlapX && overlapY) {
                if (Math.abs(box.max.z - other.min.z) < threshold) mesh.position.z -= (box.max.z - other.min.z);
                if (Math.abs(box.min.z - other.max.z) < threshold) mesh.position.z += (other.max.z - box.min.z);
            }
        });
    }

    // ── GRAVEDAD ──────────────────────────────────────────────────────────────
    // Baja el mesh al Y mínimo posible: piso de la unidad o encima de otra caja.
    // No mueve el mesh si la posición resultante tiene colisión lateral.
    applyGravity(mesh) {
        const unit    = this.currentUnit;
        const offset  = this.currentCargoOffset;
        const floorY  = offset.y;             // Y del piso de la unidad
        const halfH   = (new THREE.Box3().setFromObject(mesh)).getSize(new THREE.Vector3()).y / 2;

        // Calcular el Y mínimo apoyado: piso o tope de cualquier otra caja debajo
        let supportY = floorY;

        for (const item of this.cargoList) {
            if (item.proxyMesh === mesh) continue;

            const geo  = this.getSharedGeometry(item.l, item.w, item.h);
            const temp = new THREE.Mesh(geo);
            temp.position.copy(
                item.proxyMesh && item.proxyMesh.parent === this.boxesGroup
                    ? item.proxyMesh.position
                    : item.position
            );
            temp.rotation.copy(
                item.proxyMesh && item.proxyMesh.parent === this.boxesGroup
                    ? item.proxyMesh.rotation
                    : (item.rotation || new THREE.Euler())
            );
            temp.updateMatrixWorld();

            const other = new THREE.Box3().setFromObject(temp);

            // Solo cuenta si se superpone en X y Z (está "debajo" de la caja que cae)
            const curBox = new THREE.Box3().setFromObject(mesh);
            const overlapX = curBox.max.x > other.min.x + 0.02 && curBox.min.x < other.max.x - 0.02;
            const overlapZ = curBox.max.z > other.min.z + 0.02 && curBox.min.z < other.max.z - 0.02;

            if (overlapX && overlapZ) {
                const topOfOther = other.max.y;
                if (topOfOther > supportY && topOfOther < mesh.position.y + halfH) {
                    supportY = topOfOther;
                }
            }
        }

        const targetY = supportY + halfH;

        // Solo bajar, nunca subir (ya está apoyado o el usuario la subió adrede)
        if (targetY < mesh.position.y - 0.005) {
            mesh.position.y = targetY;
        }
    }
    // ── FIN GRAVEDAD ──────────────────────────────────────────────────────────

    hasCollision(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        box.expandByScalar(-0.01); // Tolerancia mínima
        
        // 1. Revisar límites del camión (caja azul)
        const unit = this.currentUnit;
        const offset = this.currentCargoOffset;
        if (
            box.min.x < offset.x - 0.01 || 
            box.max.x > offset.x + unit.length + 0.01 ||
            box.min.y < offset.y - 0.01 || 
            box.max.y > offset.y + unit.height + 0.01 ||
            box.min.z < offset.z - unit.width / 2 - 0.01 || 
            box.max.z > offset.z + unit.width / 2 + 0.01
        ) {
            return true; // Está fuera de los límites permitidos
        }
        
        // 2. Revisar colisiones con otras cajas
        for (const item of this.cargoList) {
            if (item.proxyMesh === mesh) continue;
            
            const geo = this.getSharedGeometry(item.l, item.w, item.h);
            const temp = new THREE.Mesh(geo);
            temp.position.copy(item.proxyMesh && item.proxyMesh.parent === this.boxesGroup ? item.proxyMesh.position : item.position);
            temp.rotation.copy(item.proxyMesh && item.proxyMesh.parent === this.boxesGroup ? item.proxyMesh.rotation : (item.rotation || new THREE.Euler()));
            temp.updateMatrixWorld();
            
            const otherBox = new THREE.Box3().setFromObject(temp);
            otherBox.expandByScalar(-0.01);
            
            if (box.intersectsBox(otherBox)) {
                return true; // Choca con otra caja
            }
        }
        return false;
    }

    updateBlueBoxPosition() {
        if (this.blueBoxEdges) {
            const config = this.currentUnit;
            this.blueBoxEdges.position.set(this.currentCargoOffset.x + config.length/2, this.currentCargoOffset.y + config.height/2, this.currentCargoOffset.z);
        }
    }

    onModelClick(event) {
        if (this.isLocked) return;
        const saved = localStorage.getItem(`calib_v1_${this.currentUnit.key}`);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.isLocked) return;
        }
        const boxSection = document.getElementById('box-calibration-section');
        if (boxSection) boxSection.style.display = 'block';

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.vehicleGroup.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            if (obj.type === 'LineSegments') return;
            document.getElementById('calibration-panel').style.display = 'block';
            while (obj.parent && obj.parent !== this.vehicleGroup) obj = obj.parent;
            this.selectedModel = obj;
        }
    }

    createFullUnit() {
        if (this.unitGroup) this.scene.remove(this.unitGroup);
        this.unitGroup = new THREE.Group();
        this.scene.add(this.unitGroup);
        this.vehicleGroup = new THREE.Group();
        this.boxesGroup = new THREE.Group();
        this.unitGroup.add(this.vehicleGroup, this.boxesGroup);

        const config = this.currentUnit;
        const saved = localStorage.getItem(`calib_v1_${config.key}`);
        if (saved) {
            const d = JSON.parse(saved);
            this.currentCargoOffset = d.boxOffset || { ...config.offset };
        } else {
            this.currentCargoOffset = { ...config.offset } || { x: 0, y: 0, z: 0 };
        }
        
        this.createBoxUnit(config);

        if (config.model && this.loader) {
            const onModelLoaded = (gltf) => {
                // Prevenir que cargas asíncronas antiguas se agreguen a la unidad actual
                if (this.currentUnit.key !== config.key) return;
                
                // Limpiar cualquier modelo existente en el grupo
                while(this.vehicleGroup.children.length > 0) {
                    this.vehicleGroup.remove(this.vehicleGroup.children[0]);
                }
                
                // Volver a dibujar la caja azul porque el loop anterior la borró
                this.createBoxUnit(config);
                
                // Clonar el modelo desde caché para no mutar el original
                const model = gltf.scene.clone(true);
                
                // Asegurar visibilidad de materiales
                model.traverse(n => { 
                    if (n.isMesh) { 
                        n.castShadow = true; 
                        n.receiveShadow = true;
                        if (n.material) {
                            n.material = n.material.clone();
                            n.material.depthWrite = true;
                            n.material.transparent = false;
                            n.material.opacity = 1;
                        }
                    } 
                });
                
                if (saved) {
                    const d = JSON.parse(saved);
                    model.position.set(d.posX, d.posY, d.posZ);
                    model.scale.set(d.scale, d.scale, d.scale);
                } else {
                    const mPos = config.modelOffset || { x: 0, y: 0, z: 0 };
                    model.position.set(mPos.x, mPos.y, mPos.z);
                    const s = config.scale || 1;
                    model.scale.set(s, s, s);
                }
                console.log('Modelo listo:', config.name);
                this.vehicleGroup.add(model);
                this.onWindowResize();
            };

            // Si ya está en caché, usar instantáneamente
            if (this.modelCache[config.model]) {
                onModelLoaded(this.modelCache[config.model]);
            } else {
                this.loader.load(config.model, (gltf) => {
                    this.modelCache[config.model] = gltf; // Guardar en caché
                    onModelLoaded(gltf);
                }, 
                (xhr) => { console.log((xhr.loaded / xhr.total * 100).toFixed(0) + '% cargado'); },
                (error) => { 
                    console.error('Error al cargar modelo:', error);
                });
            }

        } else if (!this.loader) {
            alert("SISTEMA: El motor 3D no pudo inicializar el cargador de modelos.");
        }
        if (this.controls) this.controls.target.set(this.currentCargoOffset.x + config.length/2, 1, 0);
    }

    createBoxUnit(config) {
        const { width, height, length } = config;
        const offset = this.currentCargoOffset;
        this.blueBoxEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(length, height, width)), new THREE.LineBasicMaterial({ color: 0x2563eb }));
        this.blueBoxEdges.position.set(offset.x + length/2, offset.y + height/2, offset.z);
        this.vehicleGroup.add(this.blueBoxEdges);

        if (config.secondaryDeck) {
            const { length: sdLen, width: sdWidth, bedHeightOffset, offsetX } = config.secondaryDeck;
            const sdHeight = height - bedHeightOffset;
            if (sdHeight > 0) {
                this.secondaryBlueBoxEdges = new THREE.LineSegments(
                    new THREE.EdgesGeometry(new THREE.BoxGeometry(sdLen, sdHeight, sdWidth)), 
                    new THREE.LineBasicMaterial({ color: 0x2563eb })
                );
                this.secondaryBlueBoxEdges.position.set(offset.x + offsetX + sdLen/2, offset.y + bedHeightOffset + sdHeight/2, offset.z);
                this.vehicleGroup.add(this.secondaryBlueBoxEdges);
            }
        }
    }

    addCargoToList() {
        let l = (parseFloat(document.getElementById('input-length').value) || 0);
        let w = (parseFloat(document.getElementById('input-width').value) || 0);
        let h = (parseFloat(document.getElementById('input-height').value) || 0);
        let weight = parseFloat(document.getElementById('input-weight').value) || 0;
        
        if (this.currentSystem === 'imperial') {
            l = l * 2.54;
            w = w * 2.54;
            h = h * 2.54;
            weight = weight * 0.453592;
        }
        
        l = l / 100;
        w = w / 100;
        h = h / 100;

        const qty = parseInt(document.getElementById('input-quantity').value) || 1;
        const desc = document.getElementById('input-description').value || "Caja";
        
        // Capturar características
        const fragile = document.getElementById('cb-fragile').checked;
        const stackable = document.getElementById('cb-stackable').checked;
        const sku = document.getElementById('input-sku').value || desc;

        if (l <= 0 || w <= 0 || h <= 0) { alert("Ingresa dimensiones válidas (mayores a 0)"); return; }

        let fitsInCurrent = true;
        let rejectReason = "";

        const wFits = (l <= this.currentUnit.length && w <= this.currentUnit.width) || (w <= this.currentUnit.length && l <= this.currentUnit.width);
        const allowOversize = this.currentUnit.openDeck;
        
        if (weight > this.currentUnit.maxPayload) { 
            fitsInCurrent = false; rejectReason = "peso excede carga máxima"; 
        } else if (h > this.currentUnit.height) { 
            fitsInCurrent = false; rejectReason = `altura excede la unidad (${h.toFixed(2)}m > ${this.currentUnit.height}m)`; 
        } else if (this.currentUnit.doorHeight && h > this.currentUnit.doorHeight) { 
            fitsInCurrent = false; rejectReason = "altura excede la puerta"; 
        } else if (!wFits && !allowOversize) {
            fitsInCurrent = false; rejectReason = "dimensiones base exceden la unidad";
        }

        if (!fitsInCurrent) {
            let fitsAny = false;
            for (let u of UNITS) {
                if (weight <= u.maxPayload && h <= u.height && (!u.doorHeight || h <= u.doorHeight)) {
                    let uFits = (l <= u.length && w <= u.width) || (w <= u.length && l <= u.width);
                    if (uFits || u.openDeck) {
                        fitsAny = true;
                        break;
                    }
                }
            }

            if (!fitsAny) {
                alert(`⚠️ ERROR CRÍTICO: La pieza es demasiado grande o pesada (${rejectReason}) y no cabe en NINGUNA unidad disponible.`);
                return;
            }

            alert(`⚠️ AVISO: La pieza no cabe en ${this.currentUnit.name} (${rejectReason}).\nEl sistema activará el modo Automático para calcular y asignar la unidad más adecuada para tu carga.`);

            
            const newItem = { l, w, h, weight, qty, desc, fragile, stackable, sku: sku };
            if (this.editingIndex !== null) {
                this.pendingCargo[this.editingIndex] = newItem;
                this.editingIndex = null;
                const btn = document.getElementById('btn-add-cargo');
                if(btn) {
                    btn.innerHTML = '+ AGREGAR PIEZA';
                    btn.classList.remove('btn-editing');
                }
            } else {
                this.pendingCargo.push(newItem);
            }
            this.renderPendingList();

            // Forzar Modo Automático en el dropdown
            const wrapper = document.getElementById('custom-unit-select');
            if (wrapper) {
                const masterCheckbox = wrapper.querySelector('.custom-option[data-value="all"] input');
                if (masterCheckbox && !masterCheckbox.checked) {
                    masterCheckbox.checked = true;
                    masterCheckbox.closest('.custom-option').classList.add('selected');
                    const options = wrapper.querySelectorAll('.custom-option:not([data-value="all"])');
                    options.forEach(opt => {
                        opt.classList.add('selected');
                        const cb = opt.querySelector('input');
                        if(cb) cb.checked = true;
                    });
                }
            }

            // Ejecutar cubicaje automáticamente
            setTimeout(() => {
                this.runSmartCubicaje();
            }, 100);
            
            // Limpiar formulario tras agregar la pieza
            document.getElementById('input-length').value = '';
            document.getElementById('input-width').value = '';
            document.getElementById('input-height').value = '';
            document.getElementById('input-weight').value = '';
            document.getElementById('input-quantity').value = '';
            document.getElementById('input-description').value = '';
            document.getElementById('input-sku').value = '';
            document.getElementById('cb-fragile').checked = false;
            document.getElementById('cb-stackable').checked = true;
            const cbDangerous2 = document.getElementById('cb-dangerous');
            if (cbDangerous2) cbDangerous2.checked = false;
            const cbRefrigerated2 = document.getElementById('cb-refrigerated');
            if (cbRefrigerated2) cbRefrigerated2.checked = false;

            return;
        }

        const newItem = { l, w, h, weight, qty, desc, fragile, stackable, sku: sku };

        if (this.editingIndex !== null) {
            this.pendingCargo[this.editingIndex] = newItem;
            this.editingIndex = null;
            const btn = document.getElementById('btn-add-cargo');
            if(btn) {
                btn.innerHTML = '+ AGREGAR PIEZA';
                btn.classList.remove('btn-editing');
            }
        } else {
            this.pendingCargo.push(newItem);
        }

        this.renderPendingList();

        // Limpiar formulario tras agregar la pieza
        document.getElementById('input-length').value = '';
        document.getElementById('input-width').value = '';
        document.getElementById('input-height').value = '';
        document.getElementById('input-weight').value = '';
        document.getElementById('input-quantity').value = '';
        document.getElementById('input-description').value = '';
        document.getElementById('input-sku').value = '';
        document.getElementById('cb-fragile').checked = false;
        document.getElementById('cb-stackable').checked = true;
        const cbDangerous = document.getElementById('cb-dangerous');
        if (cbDangerous) cbDangerous.checked = false;
        const cbRefrigerated = document.getElementById('cb-refrigerated');
        if (cbRefrigerated) cbRefrigerated.checked = false;
    }

    renderPendingList() {
        const listContainer = document.getElementById('cargo-items-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        if (this.pendingCargo.length === 0) return;
        
        this.pendingCargo.forEach((item, index) => {
            const row = document.createElement('div');
            const isSelected = this.selectedCargoIndex === index;
            row.className = `cargo-item-row-premium ${isSelected ? 'selected' : ''}`;
            row.innerHTML = `
                <div class="item-row-header">
                    <span class="item-desc">${item.desc || 'Pieza'}</span>
                </div>
                <div class="item-row-body">
                    <div class="item-card"><label>L</label><span>${this.currentSystem === 'imperial' ? (item.l * 39.3701).toFixed(1) : item.l.toFixed(2)}</span></div>
                    <div class="item-card"><label>A</label><span>${this.currentSystem === 'imperial' ? (item.w * 39.3701).toFixed(1) : item.w.toFixed(2)}</span></div>
                    <div class="item-card"><label>AL</label><span>${this.currentSystem === 'imperial' ? (item.h * 39.3701).toFixed(1) : item.h.toFixed(2)}</span></div>
                    <div class="item-card"><label>${this.currentSystem === 'imperial' ? 'LB' : 'KG'}</label><span>${this.currentSystem === 'imperial' ? (item.weight / 0.453592).toFixed(1) : item.weight}</span></div>
                    <div class="item-card qty-card"><label>QT</label><span>x${item.qty}</span></div>
                </div>
            `;
            row.onclick = () => this.selectCargoItem(index);
            listContainer.appendChild(row);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    selectCargoItem(index) {
        this.selectedCargoIndex = (this.selectedCargoIndex === index) ? null : index;
        
        const actions = document.getElementById('cargo-selection-actions');
        if (actions) {
            actions.style.display = this.selectedCargoIndex !== null ? 'flex' : 'none';
        }
        
        this.renderPendingList();
    }

    editCargoItem(index) {
        this.editingIndex = index;
        const item = this.pendingCargo[index];
        let l = item.l * 100, w = item.w * 100, h = item.h * 100, weight = item.weight;
        if (this.currentSystem === 'imperial') {
            l = l / 2.54;
            w = w / 2.54;
            h = h / 2.54;
            weight = weight / 0.453592;
        }
        document.getElementById('input-length').value = Number(l.toFixed(1));
        document.getElementById('input-width').value = Number(w.toFixed(1));
        document.getElementById('input-height').value = Number(h.toFixed(1));
        document.getElementById('input-weight').value = Number(weight.toFixed(1));
        document.getElementById('input-quantity').value = item.qty;
        document.getElementById('input-description').value = item.desc;
        document.getElementById('input-sku').value = item.sku || "";
        document.getElementById('cb-fragile').checked = item.fragile;
        document.getElementById('cb-stackable').checked = item.stackable;

        const btn = document.getElementById('btn-add-cargo');
        btn.innerHTML = '💾 GUARDAR CAMBIOS';
        btn.classList.add('btn-editing');
    }

    deleteCargoItem(index) {
        if (confirm("¿Estás seguro de que deseas eliminar esta pieza de la lista?")) {
            this.pendingCargo.splice(index, 1);
            this.renderPendingList();
        }
    }

    deleteSelectedBox() {
        if (!this.selectedBox) {
            alert("Selecciona primero una pieza en el visor 3D.");
            return;
        }
        if (confirm("¿Deseas eliminar la pieza seleccionada del acomodo?")) {
            const index = this.cargoList.indexOf(this.selectedBox);
            if (index > -1) {
                this.cargoList.splice(index, 1);
            }
            this.deselectBox();
            this.renderInstancedMeshes();
            this.updateStats();
        }
    }

    async runSmartCubicaje() {
        if (this.pendingCargo.length === 0) { alert("Añade al menos una pieza a la lista."); return; }
        
        const btnCalc = document.getElementById('btn-calculate');
        if (btnCalc) btnCalc.innerHTML = '<i data-lucide="loader" class="spin"></i> CALCULANDO...';

        // REGLA INDUSTRIAL: Ordenar por peso (más pesado primero al suelo)
        this.pendingCargo.sort((a, b) => b.weight - a.weight);

        this.isLocked = true;
        document.getElementById('unit-chips').classList.add('locked');
        
        const wrapper = document.getElementById('custom-unit-select');
        const selectedUnitKeys = Array.from(wrapper.querySelectorAll('.custom-option:not([data-value="all"]).selected'))
                                    .map(opt => opt.dataset.value);

        let targetUnit = null;

        if (selectedUnitKeys.length === 0) {
            alert("Debes seleccionar al menos un tipo de unidad para realizar el cálculo.");
            document.getElementById('unit-chips').classList.remove('locked');
            this.isLocked = false;
            if (btnCalc) btnCalc.innerHTML = '<i data-lucide="zap"></i> CUBICAR';
            return;
        }

        const allowedUnits = UNITS.filter(u => selectedUnitKeys.includes(u.key));
        const sortedUnits = allowedUnits.sort((a, b) => a.volume - b.volume);

        // Limpiar el historial anterior si estamos recalculando desde cero
        this.shipments = [];
        let currentPendingCargo = JSON.parse(JSON.stringify(this.pendingCargo)); // Copia profunda
        
        let totalItems = 0;
        currentPendingCargo.forEach(c => totalItems += c.qty);
        let processedItemsTotal = 0;
        
        // Bucle de unidades infinitas
        let iterations = 0;
        let anyUnitPacked = false;
        
        while (currentPendingCargo.length > 0 && iterations < 50) {
            iterations++;
            
            // ── SELECCIÓN DE UNIDAD MEJORADA ──────────────────────────────────────
            // Estrategia correcta:
            // 1. Calcular las dimensiones máximas de las piezas restantes
            // 2. Filtrar unidades que FÍSICAMENTE puedan recibir la pieza más grande
            // 3. Elegir la más pequeña de esas unidades válidas (optimización de costos)
            // 4. Si ninguna puede, reportar error de dimensiones
            let targetUnit = null;

            // Paso 1: Encontrar la pieza con mayor demanda dimensional
            let maxW = 0, maxL = 0, maxH = 0, maxWeight = 0;
            for (const c of currentPendingCargo) {
                if (c.w > maxW) maxW = c.w;
                if (c.l > maxL) maxL = c.l;
                if (c.h > maxH) maxH = c.h;
                if (c.weight > maxWeight) maxWeight = c.weight;
            }

            // Paso 2: Filtrar unidades que pueden recibir físicamente esa pieza
            // Una unidad es válida si su ancho, largo y alto son >= a la pieza más grande
            // También intentamos rotación 90° (l y w intercambiados)
            const validUnits = sortedUnits.filter(u => {
                const fitsNormal  = maxW <= u.width  && maxL <= u.length && maxH <= u.height;
                const fitsRotated = maxL <= u.width  && maxW <= u.length && maxH <= u.height;
                return fitsNormal || fitsRotated;
            });

            if (validUnits.length === 0) {
                // Ninguna unidad puede recibir la pieza más grande — error de dimensiones
                alert(`ERROR: Una o más piezas exceden las dimensiones de todas las unidades seleccionadas. Verifica las medidas de tu carga.`);
                break;
            }

            // Paso 3: Elegir la unidad más pequeña válida (ya están ordenadas por volumen asc)
            targetUnit = validUnits[0];
            // ─────────────────────────────────────────────────────────────────────

            // Configurar entorno para la unidad seleccionada
            this.switchUnit(targetUnit);
            while(this.boxesGroup.children.length > 0) this.boxesGroup.remove(this.boxesGroup.children[0]);
            this.cargoList = [];
            
            let unitFull = false;
            let totalWeight = 0;
            let processedItemsInUnit = 0;
            let newPendingCargo = [];
            
            for (let item of currentPendingCargo) {
                if (unitFull) {
                    newPendingCargo.push(item);
                    continue;
                }

                let packedQty = 0;
                for (let i = 0; i < item.qty; i++) {
                    if (unitFull) {
                        packedQty = i;
                        break;
                    }
                    
                    if (totalWeight + item.weight > targetUnit.maxPayload) {
                        unitFull = true;
                        packedQty = i;
                        break;
                    }
                    
                    const success = this.calculatePositionAndAdd(item.w, item.l, item.h, item.weight, item.stackable, item.sku || item.desc || "");
                    
                    if (!success) {
                        unitFull = true;
                        packedQty = i;
                        break;
                    } else {
                        totalWeight += item.weight;
                        processedItemsInUnit++;
                        processedItemsTotal++;
                    }
                    
                    if (processedItemsTotal % 50 === 0 && btnCalc) {
                        btnCalc.innerHTML = `<i data-lucide="loader" class="spin"></i> CUBICANDO... ${Math.floor((processedItemsTotal/totalItems)*100)}%`;
                        await new Promise(r => setTimeout(r, 0));
                    }
                }
                
                if (unitFull && packedQty < item.qty) {
                    newPendingCargo.push({...item, qty: item.qty - packedQty});
                }
            }

            // Si no cupo NINGUNA pieza en la unidad más grande, hay un error de dimensiones
            if (processedItemsInUnit === 0) {
                alert(`⚠️ ERROR: La pieza es demasiado grande para la unidad ${targetUnit.name}. El proceso se detendrá.`);
                break;
            }

            anyUnitPacked = true;

            // Guardar esta unidad en el historial si logramos meter algo
            this.shipments.push({
                id: Date.now() + iterations,
                name: "Embarque " + iterations,
                unit: targetUnit.name,
                totalItems: this.cargoList.length,
                date: new Date().toLocaleDateString(),
                // Guardamos una copia exacta de la carga para visualizarla luego en 3D
                cargoData: this.cargoList.map(c => ({
                    ...c,
                    position: c.position.clone(),
                    rotation: c.rotation.clone()
                }))
            });

            currentPendingCargo = newPendingCargo;
        }

        // Una vez terminado todo el bucle
        if (btnCalc) btnCalc.innerHTML = '<i data-lucide="zap"></i> CUBICAR';
        
        if (anyUnitPacked) {
            this.updateShipmentUI();
            
            // Mostrar la primera unidad generada
            this.viewShipmentDetails(0);
            
            if (currentPendingCargo.length === 0) {
                console.log(`✅ CUBICAJE COMPLETADO: Se procesaron ${processedItemsTotal} piezas en ${this.shipments.length} camiones.`);
                const rightPanel = document.getElementById('right-panel');
                if (rightPanel) rightPanel.classList.add('open');
            } else {
                let pendingCount = 0;
                currentPendingCargo.forEach(c => pendingCount += c.qty);
                console.log(`⚠️ LÍMITE ALCANZADO: Se procesaron ${processedItemsTotal} piezas en ${this.shipments.length} camiones, pero quedaron ${pendingCount} piezas pendientes que no pudieron ser acomodadas.`);
            }
        }

        // NO limpiamos pendingCargo para que el usuario pueda editar y recalcular
        this.renderPendingList();
        
        // Vista previa generada. Ahora activamos el botón para "Generar PDF" oficialmente.
        const btnPdf = document.getElementById('btn-generate-pdf');
        if (btnPdf) {
            btnPdf.classList.remove('disabled');
            btnPdf.style.display = 'flex';
        }
        document.getElementById('btn-manual-mode').classList.remove('disabled');
        
        const btnShipment = document.getElementById('btn-generate-shipment');
        if (btnShipment) btnShipment.style.display = 'flex';
    }

    checkIfCargoFitsAll(unit, items) {
        let totalWeight = 0;
        items.forEach(it => totalWeight += (it.weight * it.qty));
        if (totalWeight > unit.maxPayload) return false;

        let simulatedCargo = [];
        const startX = unit.offset.x;
        const startY = unit.offset.y;
        const startZ = unit.offset.z - (unit.width / 2);

        for (let item of items) {
            for (let i = 0; i < item.qty; i++) {
                let posX = startX + item.l/2, posZ = startZ + item.w/2;
                if (simulatedCargo.length > 0) {
                    const last = simulatedCargo[simulatedCargo.length - 1];
                    posX = last.posX + last.l/2 + item.l/2;
                    posZ = last.posZ;
                    if (posX + item.l/2 > unit.offset.x + unit.length + 0.01) {
                        posX = startX + item.l/2;
                        posZ = last.posZ + last.w/2 + item.w/2;
                        if (posZ + item.w/2 > unit.offset.z + (unit.width / 2) + 0.01) {
                            posZ = startZ + item.w/2;
                        }
                    }
                }
                
                // Gravedad en Simulación
                let maxYUnder = startY;
                simulatedCargo.forEach(other => {
                    const overlapX = Math.abs(posX - other.posX) < (item.l/2 + other.l/2) - 0.01;
                    const overlapZ = Math.abs(posZ - other.posZ) < (item.w/2 + other.w/2) - 0.01;
                    if (overlapX && overlapZ) {
                        const topY = other.posY + other.h/2;
                        if (topY > maxYUnder) maxYUnder = topY;
                    }
                });
                let posY = maxYUnder + item.h/2;

                if (posX + item.l/2 > unit.offset.x + unit.length + 0.01 || posZ + item.w/2 > unit.offset.z + unit.width/2 + 0.01 || posY + item.h/2 > unit.offset.y + unit.height + 0.01) {
                    return false;
                }
                simulatedCargo.push({ posX, posY, posZ, l: item.l, w: item.w, h: item.h });
            }
        }
        return true;
    }

    tryPlaceOpenDeck(w, l, h, weight, stackable, sku, deckLength, deckWidth, deckHeight, startX, startY, startZ) {
        const platformCenterZ = startZ + deckWidth / 2;
        
        let xStart = startX + l/2;
        let xEnd = startX + deckLength - l/2 + 0.01;
        
        // Permitir volado a lo largo si la pieza es más grande que la cubierta
        if (l > deckLength) {
            xStart = startX + deckLength / 2;
            xEnd = startX + deckLength / 2;
        }

        for (let xPos = xStart; xPos <= xEnd; xPos += 0.2) {
            let zPos = platformCenterZ;
            let maxYUnder = startY;
            let canStackHere = true;
            let supportPiece = null;

            for (let i=0; i<this.cargoList.length; i++) {
                const other = this.cargoList[i];
                const overlapX = Math.abs(xPos - other.position.x) < (l/2 + other.l/2) - 0.01;
                if (overlapX) {
                    const overlapZ = Math.abs(zPos - other.position.z) < (w/2 + other.w/2) - 0.01;
                    if (overlapZ) {
                        if (!other.stackable) {
                            canStackHere = false;
                            break;
                        }
                        const topY = other.position.y + other.h/2;
                        if (topY > maxYUnder) {
                            maxYUnder = topY;
                            supportPiece = other;
                        }
                    }
                }
            }

            if (!canStackHere) continue;
            
            // Si la pieza queda sobre otra (maxYUnder > startY), verificar soporte central
            if (maxYUnder > startY && supportPiece) {
                const centerSupportedX = Math.abs(xPos - supportPiece.position.x) < (supportPiece.l/2);
                const centerSupportedZ = Math.abs(zPos - supportPiece.position.z) < (supportPiece.w/2);
                if (!centerSupportedX || !centerSupportedZ) continue;
            }

            let bestY = maxYUnder + h/2;
            if (bestY + h/2 <= startY + deckHeight + 0.01) {
                this.addBox(w, l, h, xPos, bestY, zPos, weight, stackable, sku);
                return true;
            }
        }
        return false;
    }


    calculatePositionAndAdd(w, l, h, weight, stackable, sku = "") {
        const unit = this.currentUnit;
        const offset = this.currentCargoOffset;
        let startX = offset.x, startY = offset.y, startZ = offset.z - (unit.width / 2);

        // --- MODO OPEN DECK (ej: LOWBOY): centrar la carga en la plataforma ---
        if (unit.openDeck) {
            // Intentar cubierta principal
            if (this.tryPlaceOpenDeck(w, l, h, weight, stackable, sku, unit.length, unit.width, unit.height, offset.x, offset.y, offset.z - unit.width/2)) {
                return true;
            }
            
            // Si tiene joroba (secondaryDeck), intentar ahí
            if (unit.secondaryDeck) {
                const sd = unit.secondaryDeck;
                const sdStartX = offset.x + sd.offsetX;
                const sdStartY = offset.y + sd.bedHeightOffset;
                const sdStartZ = offset.z - (sd.width / 2);
                const sdHeight = unit.height - sd.bedHeightOffset;
                
                if (this.tryPlaceOpenDeck(w, l, h, weight, stackable, sku, sd.length, sd.width, sdHeight, sdStartX, sdStartY, sdStartZ)) {
                    return true;
                }
            }
            return false;
        }
        // --- FIN MODO OPEN DECK ---

        let bestX = startX + l/2;
        let bestZ = startZ + w/2;
        let bestY = startY + h/2;

        let foundSpot = false;
        // Buscamos un hueco en X, Z
        for (let xPos = startX + l/2; xPos <= offset.x + unit.length - l/2 + 0.01; xPos += 0.2) {
            for (let zPos = startZ + w/2; zPos <= offset.z + unit.width/2 - w/2 + 0.01; zPos += 0.2) {
                
                // MOTOR DE GRAVEDAD Y RESISTENCIA
                let maxYUnder = startY;
                let canStackHere = true;
                let supportPiece = null;

                for (let i=0; i<this.cargoList.length; i++) {
                    const other = this.cargoList[i];
                    const overlapX = Math.abs(xPos - other.position.x) < (l/2 + other.l/2) - 0.01;
                    if (overlapX) {
                        const overlapZ = Math.abs(zPos - other.position.z) < (w/2 + other.w/2) - 0.01;
                        if (overlapZ) {
                            if (!other.stackable) {
                                canStackHere = false; // Bloqueado si el de abajo no es apilable
                                break;
                            }
                            const topY = other.position.y + other.h/2;
                            if (topY > maxYUnder) {
                                maxYUnder = topY;
                                supportPiece = other;
                            }
                        }
                    }
                }

                if (!canStackHere) continue;

                // Si la pieza queda sobre otra (maxYUnder > startY), verificar soporte central
                if (maxYUnder > startY && supportPiece) {
                    const centerSupportedX = Math.abs(xPos - supportPiece.position.x) < (supportPiece.l/2);
                    const centerSupportedZ = Math.abs(zPos - supportPiece.position.z) < (supportPiece.w/2);
                    if (!centerSupportedX || !centerSupportedZ) continue;
                }

                let posY = maxYUnder + h/2;

                if (canStackHere) {
                    bestX = xPos;
                    bestZ = zPos;
                    bestY = maxYUnder + h/2;
                    // Verificar si cabe en altura
                    if (bestY + h/2 <= offset.y + unit.height + 0.01) {
                        foundSpot = true;
                        break;
                    }
                }
            }
            if (foundSpot) break;
        }
        
        if (!foundSpot) return false;
        
        this.addBox(w, l, h, bestX, bestY, bestZ, weight, stackable, sku);
        return true;
    }

    getSkuColor(sku) {
        if (!sku) return '#d9b38c'; // Color cartón por defecto
        if (!this.skuColors[sku]) {
            const nextColor = this.colorPalette[Object.keys(this.skuColors).length % this.colorPalette.length];
            this.skuColors[sku] = nextColor;
        }
        return this.skuColors[sku];
    }

    createBoxTexture(sku, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Color base (por SKU)
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 256);

        // Bordes suaves
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);

        // Texto SKU (Oscuro para mayor contraste)
        ctx.fillStyle = '#060b13';
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px Outfit, sans-serif';
        // Sombra clara o sin sombra para dar efecto de "tinta impresa"
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 2;
        ctx.fillText(sku, 128, 140);
        
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText("ITEM NO.", 128, 105);
        
        // Simular iconos logísticos
        ctx.shadowBlur = 0;
        ctx.font = 'bold 14px Courier';
        ctx.fillText("FRAGILE", 128, 220);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    getSharedGeometry(l, w, h) {
        if (!this.sharedGeometries) this.sharedGeometries = {};
        const key = `${l}_${w}_${h}`;
        if (!this.sharedGeometries[key]) this.sharedGeometries[key] = new THREE.BoxGeometry(l, h, w);
        return this.sharedGeometries[key];
    }

    getSharedMaterial(sku, color) {
        if (!this.sharedMaterials) this.sharedMaterials = {};
        const matKey = `${sku}_${color}`;
        if (!this.sharedMaterials[matKey]) {
            const texture = sku ? this.createBoxTexture(sku, color) : null;
            this.sharedMaterials[matKey] = new THREE.MeshStandardMaterial({
                color: sku ? 0xffffff : color,
                map: texture,
                transparent: false,
                roughness: 0.85,
                metalness: 0.05
            });
        }
        return this.sharedMaterials[matKey];
    }

    renderInstancedMeshes() {
        while(this.boxesGroup.children.length > 0) this.boxesGroup.remove(this.boxesGroup.children[0]);
        const groups = {};
        this.cargoList.forEach((item, index) => {
            const key = `${item.l}_${item.w}_${item.h}_${item.sku}_${item.originalColor}`;
            if (!groups[key]) groups[key] = { items: [], geo: this.getSharedGeometry(item.l, item.w, item.h), mat: this.getSharedMaterial(item.sku, item.originalColor) };
            groups[key].items.push({ item, index });
        });

        const dummy = new THREE.Object3D();
        for (const key in groups) {
            const group = groups[key];
            const imesh = new THREE.InstancedMesh(group.geo, group.mat, group.items.length);
            imesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            group.items.forEach((entry, i) => {
                dummy.position.copy(entry.item.position);
                if(entry.item.rotation) dummy.rotation.copy(entry.item.rotation);
                dummy.scale.set(1, 1, 1);
                if (entry.item.proxyMesh) dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                imesh.setMatrixAt(i, dummy.matrix);
                entry.item.instancedMesh = imesh;
                entry.item.instanceId = i;
            });
            imesh.instanceMatrix.needsUpdate = true;
            
            // Fix raycaster missing instances because default bounding sphere is too small
            if (!imesh.geometry.boundingSphere) imesh.geometry.computeBoundingSphere();
            imesh.geometry.boundingSphere.radius = 1000; 
            
            this.boxesGroup.add(imesh);
        }
    }

    addBox(w, l, h, x, y, z, weight, stackable = true, sku = "") {
        const color = this.getSkuColor(sku);
        this.cargoList.push({ 
            position: new THREE.Vector3(x, y, z),
            rotation: new THREE.Euler(),
            l, w, h, weight, stackable, originalColor: color, sku: sku,
            proxyMesh: null
        });
    }

saveCurrentShipment() {
        if (this.cargoList.length === 0) {
            alert("No hay piezas cubicadas para guardar.");
            return;
        }
        const shipmentName = prompt("Nombre o referencia para este embarque:", "Embarque " + (this.shipments.length + 1));
        if (!shipmentName) return;
        
        const shipment = {
            id: Date.now(),
            name: shipmentName,
            unit: this.currentUnit.name,
            totalItems: this.cargoList.length,
            date: new Date().toLocaleDateString()
        };
        this.shipments.push(shipment);
        this.updateShipmentUI();
        
        alert("Embarque guardado con éxito. Preparando siguiente unidad...");
        this.clearCargo(false);
        document.getElementById('btn-generate-shipment').style.display = 'none';
        
        // Disable PDF until next cubicaje
        const btnPdf = document.getElementById('btn-generate-pdf');
        if (btnPdf) {
            btnPdf.classList.add('disabled');
        }
    }
    
    updateShipmentUI() {
        const container = document.getElementById('shipments-history-container');
        if (container) container.style.display = this.shipments.length > 0 ? 'block' : 'none';
        
        const count = document.getElementById('shipment-count');
        if (count) count.innerText = this.shipments.length;

        const list = document.getElementById('shipments-list');
        if (!list) return;
        list.innerHTML = '';
        if (this.shipments.length === 0) {
            list.innerHTML = '<div class="empty-state">No hay embarques guardados</div>';
        } else {
            this.shipments.forEach((s, index) => {
                list.innerHTML += `
                    <div class="shipment-item" style="background:#1a2235; padding:10px; border-radius:8px; margin-bottom:8px; border-left: 3px solid #10b981; cursor: pointer;" onclick="window.app.viewShipmentDetails(${index})">
                        <div style="font-weight:bold; color:#fff; font-size:12px;">${s.name}</div>
                        <div style="color:#a0aec0; font-size:11px; margin-top:4px;">Unidad: ${s.unit} - ${s.totalItems} piezas</div>
                        <div style="color:#718096; font-size:10px; margin-top:2px;">${s.date}</div>
                    </div>
                `;
            });
        }
    }

    deleteShipment(index) {
        if(confirm("¿Seguro que deseas eliminar este embarque del historial?")) {
            this.shipments.splice(index, 1);
            this.updateShipmentUI();
        }
    }

    viewShipmentDetails(index) {
        const shipment = this.shipments[index];
        if (!shipment) return;
        
        // Restaurar la unidad
        const unitObj = UNITS.find(u => u.name === shipment.unit);
        if (unitObj) {
            this.switchUnit(unitObj);
        }
        
        // Restaurar la carga en 3D si existe
        if (shipment.cargoData) {
            while(this.boxesGroup.children.length > 0) this.boxesGroup.remove(this.boxesGroup.children[0]);
            // Recrear objetos en caso de que pierdan las referencias de THREE.Vector3
            this.cargoList = shipment.cargoData.map(c => ({
                ...c,
                position: new THREE.Vector3(c.position.x, c.position.y, c.position.z),
                rotation: new THREE.Euler(c.rotation._x, c.rotation._y, c.rotation._z, c.rotation._order)
            }));
            this.renderInstancedMeshes();
            this.updateStats();
        }

        // Actualizar visualmente la lista lateral para resaltar el seleccionado
        const listItems = document.querySelectorAll('.shipment-item');
        listItems.forEach((item, i) => {
            if (i === index) {
                item.style.borderLeftColor = '#00e5ff';
                item.style.background = 'rgba(82, 181, 212, 0.1)';
            } else {
                item.style.borderLeftColor = '#10b981';
                item.style.background = '#1a2235';
            }
        });
    }

    // ORIGINAL METHODS BELOW

    clearCargo(keepLocked = false) {
        while(this.boxesGroup.children.length > 0) this.boxesGroup.remove(this.boxesGroup.children[0]);
        this.cargoList = [];
        if (!keepLocked) {
            this.pendingCargo = [];
        this.shipments = []; // Limpiar lista de espera
            this.renderPendingList();
            this.isLocked = false;
            document.getElementById('unit-chips').classList.remove('locked');
            
            const btnHistory = document.getElementById('btn-show-history');
            if (btnHistory) btnHistory.classList.add('disabled');
            
            const btnShipment = document.getElementById('btn-generate-shipment');
            if (btnShipment) btnShipment.style.display = 'none';

            // Limpiar campos de entrada
            document.getElementById('input-length').value = '';
            document.getElementById('input-width').value = '';
            document.getElementById('input-height').value = '';
            document.getElementById('input-weight').value = '';
            document.getElementById('input-quantity').value = '';
            document.getElementById('input-description').value = '';
            document.getElementById('input-sku').value = '';
            document.getElementById('cb-fragile').checked = false;
            document.getElementById('cb-stackable').checked = true;
            document.getElementById('cb-dangerous').checked = false;
            document.getElementById('cb-refrigerated').checked = false;

            this.editingIndex = null;
            const btn = document.getElementById('btn-add-cargo');
            btn.innerHTML = '+ AGREGAR PIEZA';
            btn.classList.remove('btn-editing');
            
            // Ocultar y deshabilitar modo manual al limpiar
            this.toggleManualMode(false);
            const btnManual = document.getElementById('btn-manual-mode');
            if (btnManual) {
                btnManual.classList.add('disabled');
            }
        }
    }

    async generatePDF(historicalShipment = null) {
        const isHistory = !!historicalShipment;
        
        // ── CAPTURA 3D SÍNCRONA ───────────────────────────────────────────────────
        // CRÍTICO: toDataURL() DEBE ejecutarse antes de cualquier `await`.
        // Algunos navegadores (Safari, Firefox) purgan el WebGL buffer durante
        // los microtasks/ticks de JS que genera un `await`, produciendo imagen en blanco.
        // Solución: renderizamos explícitamente y capturamos inmediatamente,
        // sin dar oportunidad al browser de limpiar el buffer.
        let captureDataUrl = null;
        if (!isHistory) {
            this.renderer.render(this.scene, this.camera);
            const rawCapture = this.renderer.domElement.toDataURL("image/png");
            // Verificar que la captura no sea un canvas vacío (< 5KB = probablemente blanco)
            captureDataUrl = rawCapture.length > 5000 ? rawCapture : null;
        }
        // ─────────────────────────────────────────────────────────────────────────

        // Group loaded cargo items to rebuild the list
        const groupedCargo = [];
        if (!isHistory) {
            this.cargoList.forEach(box => {
                const existing = groupedCargo.find(g => 
                    g.desc === (box.desc || box.sku || "Pieza Genérica") && 
                    g.w === box.w && g.l === box.l && g.h === box.h && g.weight === box.weight
                );
                if (existing) {
                    existing.qty++;
                } else {
                    groupedCargo.push({
                        qty: 1,
                        desc: box.desc || box.sku || "Pieza Genérica",
                        w: box.w,
                        l: box.l,
                        h: box.h,
                        weight: box.weight
                    });
                }
            });
        }

        const data = isHistory ? historicalShipment : {
            unit: this.currentUnit,
            cargo: groupedCargo,
            stats: {
                totalWeight: this.cargoList.reduce((sum, c) => sum + c.weight, 0),
                totalVol: this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0),
                efficiency: Math.round((this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0) / this.currentUnit.volume) * 100)
            },
            date: new Date().toLocaleString(),
            capture: captureDataUrl  // Ya capturado síncronamente arriba
        };

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const unit = data.unit;
        
        // Colores de Marca
        const primaryColor = [15, 23, 42]; 
        const accentColor = [82, 181, 212]; // Cyan Rodipack (#52B5D4)
        
        // 1. CABECERA
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');
        
        // Logo (Intentar cargar logo)
        try {
            const logoUrl = 'assets/logo_rodiload.png';
            const logoImg = await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = logoUrl;
            });
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            canvas.getContext('2d').drawImage(logoImg, 0, 0);
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 10, 25, 25);
        } catch(e) { console.warn("No se pudo añadir el logo al PDF"); }
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("RODILOAD", 45, 22);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("SMART LOGISTICS & OPTIMIZATION", 45, 28);
        
        doc.setFontSize(9);
        doc.text(`REPORTE TÉCNICO DE CUBICAJE - PREMIUM`, 45, 34);
        doc.text(`FECHA: ${data.date}`, 140, 34);

        // 2. DATOS DE LA UNIDAD
        let y = 55;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`UNIDAD SELECCIONADA: ${unit.name.toUpperCase()}`, 15, y);

        // 3. CAPTURA 3D
        y += 15;
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, y, 180, 80);
        if (data.capture) {
            try {
                doc.addImage(data.capture, 'PNG', 16, y+1, 178, 78);
            } catch(e) {
                // La imagen existe pero no se pudo insertar (formato inesperado)
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(10);
                doc.text("Vista 3D no disponible en este navegador.", 55, y + 40);
                doc.setTextColor(...primaryColor);
            }
        } else {
            // No se capturó imagen — indicarlo claramente sin dejar el recuadro vacío
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(10);
            doc.text("Vista 3D no disponible.", 75, y + 38);
            doc.setFontSize(8);
            doc.text("(Genera el PDF inmediatamente despues de cubicar para obtener la captura.)", 25, y + 46);
            doc.setTextColor(...primaryColor);
        }
        
        // 4. LISTADO DE PIEZAS (TABLA)
        y += 90;
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("CANT", 20, y + 5);
        doc.text("DESCRIPCIÓN", 40, y + 5);
        doc.text("DIMENSIONES (cm)", 100, y + 5);
        doc.text("PESO U.", 150, y + 5);
        doc.text("TOTAL", 175, y + 5);
        
        y += 12;
        doc.setFont("helvetica", "normal");
        data.cargo.forEach((item, index) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`${item.qty}`, 22, y);
            doc.text(`${item.desc.substring(0, 25)}`, 40, y);
            doc.text(`${(item.l*100).toFixed(0)}x${(item.w*100).toFixed(0)}x${(item.h*100).toFixed(0)}`, 100, y);
            doc.text(`${item.weight} kg`, 150, y);
            doc.text(`${item.weight * item.qty} kg`, 175, y);
            doc.setDrawColor(241, 245, 249);
            doc.line(15, y + 2, 195, y + 2);
            y += 8;
        });

        // 5. RESUMEN FINAL Y NORMAS
        y += 10;
        if (y > 240) { doc.addPage(); y = 20; }
        
        doc.setFillColor(...primaryColor);
        doc.rect(15, y, 180, 40, 'F');
        
        const totalWeight = this.cargoList.reduce((sum, c) => sum + c.weight, 0);
        const totalVol = this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0);
        const efficiency = Math.round((totalVol / unit.volume) * 100);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text("RESUMEN DE CARGA", 20, y + 10);
        
        doc.setFontSize(10);
        doc.text(`PESO TOTAL: ${data.stats.totalWeight} kg / ${unit.maxPayload} kg`, 20, y + 20);
        doc.text(`VOLUMEN OCUPADO: ${data.stats.totalVol.toFixed(2)} m³ / ${unit.volume} m³`, 20, y + 28);
        doc.text(`EFICIENCIA DE ESPACIO: ${data.stats.efficiency}%`, 20, y + 36);
        
        doc.text("CUMPLIMIENTO NORMATIVO (NOMS):", 110, y + 10);
        doc.setFontSize(9);
        doc.text("- NOM-012-SCT-2-2017", 115, y + 18);
        doc.text("- NOM-068-SCT-2-2014", 115, y + 26);
        doc.text("- NOM-010-SCT-2-2009", 115, y + 34);

        const maxCargoW = this.cargoList.length > 0 ? Math.max(...this.cargoList.map(c => c.w)) : 0;
        const maxCargoH = this.cargoList.length > 0 ? Math.max(...this.cargoList.map(c => c.h)) : 0;
        const totalGroundHeight = unit.bedHeight + maxCargoH;
        
        if ((maxCargoW > 2.60 || totalGroundHeight > 4.25) && unit.key === 'lowboy_3ejes') {
            y += 45;
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setTextColor(220, 38, 38);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("¡ADVERTENCIA: CARGA SOBREDIMENSIONADA!", 15, y);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            y += 8;
            doc.text("De acuerdo a la NOM-012-SCT-2-2017, esta carga excede dimensiones estándar. Requisitos obligatorios:", 15, y);
            y += 6;
            doc.text("1. PERMISO ESPECIAL: Tramitar permiso SICT para objetos indivisibles de gran peso/volumen.", 20, y);
            y += 6;
            doc.text("2. VEHÍCULOS PILOTO: Requiere escoltas abanderadas con torretas ámbar.", 20, y);
            y += 6;
            doc.text("3. ESTUDIO DE RUTA: Levantamiento previo de ruta para evitar puentes bajos o cables.", 20, y);
            y += 6;
            doc.text("4. HORARIOS RESTRINGIDOS: Prohibido circular de noche, fines de semana o festivos.", 20, y);
            y += 6;
            doc.text("5. SEÑALIZACIÓN: Lonas 'EXCESO DE DIMENSIONES' y banderas rojas en extremos de la carga.", 20, y);
        }

        doc.save(`Reporte_Cubicaje_Rodiload_${unit.name.replace(/ /g, '_')}.pdf`);
    }

    updateStats() {
        const unit = this.currentUnit;
        const totalWeight = this.cargoList.reduce((sum, c) => sum + c.weight, 0);
        const totalVol = this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0);
        
        const effEl = document.getElementById('stat-efficiency');
        if (effEl) {
            const eff = Math.round((totalVol / unit.volume) * 100);
            effEl.innerText = `${eff}%`;
            const circle = document.getElementById('stat-efficiency-circle');
            if (circle) circle.style.strokeDasharray = `${eff}, 100`;
        }
        
        document.getElementById('stat-vol-used').innerText = `${totalVol.toFixed(2)} m³`;
        document.getElementById('stat-vol-total').innerText = `Capacidad: ${unit.volume} m³`;
        
        const weightText = document.getElementById('stat-weight-text');
        const weightPct = document.getElementById('stat-weight-pct');
        
        weightText.innerText = `${totalWeight.toLocaleString()} / ${unit.maxPayload.toLocaleString()} kg`;
        
        const weightRatio = (totalWeight / unit.maxPayload) * 100;
        weightPct.innerText = `${Math.round(weightRatio)}% de carga útil`;
        
        // WARNING DE SOBREPESO
        if (totalWeight > unit.maxPayload) {
            weightText.style.color = '#ff453a';
            weightPct.innerHTML = `<span style="color: #ff453a; font-weight: 800;">⚠️ SOBREPESO DETECTADO</span>`;
            // Solo mostrar alert en modo individual (no en cubicación masiva, que ya validó el peso)
            if (!this._notifiedOverweight && !window.fromMassiveResult) {
                alert(`⚠️ ¡ATENCIÓN! Has excedido la capacidad de carga (Payload) del contenedor ${unit.name}. El peso actual es de ${totalWeight}kg vs el máximo de ${unit.maxPayload}kg.`);
                this._notifiedOverweight = true;
            }
        } else {
            weightText.style.color = '';
            weightPct.style.color = '';
            this._notifiedOverweight = false;
        }
    }


    renderUnitChips() {
        const container = document.getElementById('unit-chips');
        if (!container) return;
        container.innerHTML = '';
        UNITS.forEach(unit => {
            const chip = document.createElement('div');
            chip.className = `unit-chip ${unit.key === this.currentUnit.key ? 'active' : ''}`;
            chip.innerHTML = `<span class="name">${unit.name}</span>`;
            chip.onclick = () => { if(!this.isLocked) this.switchUnit(unit); };
            container.appendChild(chip);
        });
    }

    initUnitSelect() {
        const wrapper = document.getElementById('custom-unit-select');
        if (!wrapper) return;
        
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const label = document.getElementById('custom-select-label');
        const optionsContainer = wrapper.querySelector('.custom-select-options');
        
        optionsContainer.innerHTML = '';
        
        // Opción Master
        const masterOption = document.createElement('div');
        masterOption.className = 'custom-option selected';
        masterOption.dataset.value = 'all';
        masterOption.innerHTML = `<input type="checkbox" checked> <span>⚡ TODAS LAS UNIDADES (Automático)</span>`;
        optionsContainer.appendChild(masterOption);

        UNITS.forEach(unit => {
            const option = document.createElement('div');
            option.className = 'custom-option selected';
            option.dataset.value = unit.key;
            option.innerHTML = `<input type="checkbox" checked> <span>${unit.name}</span>`;
            optionsContainer.appendChild(option);
        });

        trigger.addEventListener('click', () => {
            wrapper.classList.toggle('open');
        });

        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (!option) return;
            
            const checkbox = option.querySelector('input[type="checkbox"]');
            const val = option.dataset.value;

            if (val === 'all') {
                const isChecked = !checkbox.checked;
                optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
                    opt.classList.toggle('selected', isChecked);
                    opt.querySelector('input[type="checkbox"]').checked = isChecked;
                });
            } else {
                checkbox.checked = !checkbox.checked;
                option.classList.toggle('selected', checkbox.checked);
                
                const allUnitCheckboxes = Array.from(optionsContainer.querySelectorAll('.custom-option:not([data-value="all"]) input[type="checkbox"]'));
                const allChecked = allUnitCheckboxes.every(cb => cb.checked);
                
                masterOption.classList.toggle('selected', allChecked);
                masterOption.querySelector('input[type="checkbox"]').checked = allChecked;
            }
            
            // Actualizar etiqueta
            const checkedCount = optionsContainer.querySelectorAll('.custom-option:not([data-value="all"]) input[type="checkbox"]:checked').length;
            if (checkedCount === 0) {
                label.textContent = "Ninguna Unidad Seleccionada";
            } else if (checkedCount === UNITS.length) {
                label.textContent = "⚡ TODAS LAS UNIDADES (Automático)";
            } else if (checkedCount === 1) {
                const singleOption = optionsContainer.querySelector('.custom-option:not([data-value="all"]).selected');
                label.textContent = singleOption.querySelector('span').textContent;
                
                // Si solo hay una unidad seleccionada, cambiar la vista 3D a esa unidad inmediatamente
                const unitKey = singleOption.dataset.value;
                const unitObj = UNITS.find(u => u.key === unitKey);
                if (unitObj && this.currentUnit.key !== unitObj.key && !this.isLocked) {
                    this.switchUnit(unitObj);
                }
            } else {
                label.textContent = `${checkedCount} UNIDADES SELECCIONADAS`;
            }
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
    }

    setupEventListeners() {
        document.getElementById('btn-add-cargo').onclick = () => this.addCargoToList();
        document.getElementById('btn-calculate').onclick = () => this.runSmartCubicaje();
        document.getElementById('btn-clear-cargo').onclick = () => { this.clearCargo(); this.updateStats(); };
        document.getElementById('btn-generate-pdf').onclick = () => this.generatePDF();
        document.getElementById('btn-prev-unit').onclick = () => { if(!this.isLocked) { this.currentUnitIndex = (this.currentUnitIndex - 1 + UNITS.length) % UNITS.length; this.switchUnit(UNITS[this.currentUnitIndex]); } };
        document.getElementById('btn-next-unit').onclick = () => { if(!this.isLocked) { this.currentUnitIndex = (this.currentUnitIndex + 1) % UNITS.length; this.switchUnit(UNITS[this.currentUnitIndex]); } };

        // Selection Listeners
        document.getElementById('btn-edit-selected').onclick = () => {
            if (this.selectedCargoIndex !== null) this.editCargoItem(this.selectedCargoIndex);
        };
        document.getElementById('btn-delete-selected').onclick = () => {
            if (this.selectedCargoIndex !== null) this.deleteCargoItem(this.selectedCargoIndex);
        };

        // Unit System Listeners
        const btnMetric = document.getElementById('btn-unit-metric');
        const btnImperial = document.getElementById('btn-unit-imperial');
        if (btnMetric && btnImperial) {
            btnMetric.onclick = () => this.setUnitSystem('metric');
            btnImperial.onclick = () => this.setUnitSystem('imperial');
        }

        // Excel Listeners
        // El botón btn-download-template ahora es manejado exclusivamente por massive.js
        // document.getElementById('btn-download-template')?.addEventListener('click', () => this.downloadExcelTemplate());
        document.getElementById('btn-import-excel')?.addEventListener('click', () => {
            document.getElementById('input-excel-file').click();
        });
        document.getElementById('input-excel-file')?.addEventListener('change', (e) => this.handleExcelUpload(e));
    }

    setUnitSystem(sys) {
        if (this.currentSystem === sys) return;
        this.currentSystem = sys;
        
        const btnMetric = document.getElementById('btn-unit-metric');
        const btnImperial = document.getElementById('btn-unit-imperial');
        
        if (sys === 'metric') {
            btnMetric.classList.add('active');
            btnMetric.style.background = 'var(--primary)';
            btnMetric.style.color = 'white';
            btnImperial.classList.remove('active');
            btnImperial.style.background = 'transparent';
            btnImperial.style.color = '#94a3b8';
            
            document.getElementById('lbl-length').innerText = 'LARGO (cm)';
            document.getElementById('lbl-width').innerText = 'ANCHO (cm)';
            document.getElementById('lbl-height').innerText = 'ALTO (cm)';
            document.getElementById('lbl-weight').innerText = 'PESO / PIEZA (kg)';
        } else {
            btnImperial.classList.add('active');
            btnImperial.style.background = 'var(--primary)';
            btnImperial.style.color = 'white';
            btnMetric.classList.remove('active');
            btnMetric.style.background = 'transparent';
            btnMetric.style.color = '#94a3b8';
            
            document.getElementById('lbl-length').innerText = 'LARGO (in)';
            document.getElementById('lbl-width').innerText = 'ANCHO (in)';
            document.getElementById('lbl-height').innerText = 'ALTO (in)';
            document.getElementById('lbl-weight').innerText = 'PESO / PIEZA (lbs)';
        }
        
        // Refrescar lista visual si hay piezas pendientes
        this.renderPendingList();
    }

    downloadExcelTemplate() {
        if (typeof XLSX === 'undefined') {
            alert("SISTEMA: La librería de Excel (SheetJS) no ha cargado completamente.");
            return;
        }
        const wb = XLSX.utils.book_new();
        
        let ws_data = [];
        if (this.currentSystem === 'metric') {
            ws_data = [
                ["SKU", "DESCRIPCION", "LARGO_CM", "ANCHO_CM", "ALTO_CM", "PESO_KG", "CANTIDAD", "APILABLE", "FRAGIL"],
                ["CAJ-001", "Caja Estándar", 60, 40, 40, 15, 10, "SI", "NO"],
                ["PAL-002", "Pallet", 120, 100, 150, 450, 2, "NO", "SI"]
            ];
        } else {
            ws_data = [
                ["SKU", "DESCRIPCION", "LARGO_IN", "ANCHO_IN", "ALTO_IN", "PESO_LBS", "CANTIDAD", "APILABLE", "FRAGIL"],
                ["BOX-001", "Standard Box", 24, 16, 16, 33, 10, "YES", "NO"],
                ["PAL-002", "Pallet", 48, 40, 60, 1000, 2, "NO", "YES"]
            ];
        }
        
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Carga");
        XLSX.writeFile(wb, `Plantilla_RODILOAD_${this.currentSystem.toUpperCase()}.xlsx`);
    }

    handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                let countAdded = 0;
                json.forEach(row => {
                    let l = parseFloat(row.LARGO_CM || row.LARGO_IN) || 0;
                    let w = parseFloat(row.ANCHO_CM || row.ANCHO_IN) || 0;
                    let h = parseFloat(row.ALTO_CM || row.ALTO_IN) || 0;
                    let weight = parseFloat(row.PESO_KG || row.PESO_LBS) || 0;
                    
                    const isImperialRow = row.LARGO_IN !== undefined || row.PESO_LBS !== undefined;
                    
                    if (isImperialRow) {
                        l = l * 2.54;
                        w = w * 2.54;
                        h = h * 2.54;
                        weight = weight * 0.453592;
                    }
                    
                    // Convert to meters for internal physics
                    l = l / 100;
                    w = w / 100;
                    h = h / 100;

                    const qty = parseInt(row.CANTIDAD) || 1;
                    const desc = row.DESCRIPCION || "Caja";
                    const sku = row.SKU || desc;
                    const apilableStr = String(row.APILABLE || "").toUpperCase();
                    const fragilStr = String(row.FRAGIL || "").toUpperCase();
                    
                    const stackable = apilableStr === 'SI' || apilableStr === 'SÍ' || apilableStr === 'YES';
                    const fragile = fragilStr === 'SI' || fragilStr === 'SÍ' || fragilStr === 'YES';

                    if (l > 0 && w > 0 && h > 0) {
                        this.pendingCargo.push({ l, w, h, weight, qty, desc, fragile, stackable, sku });
                        countAdded++;
                    }
                });
                
                this.renderPendingList();
                alert(`✅ Se han importado ${countAdded} artículos correctamente desde Excel.`);
                document.getElementById('input-excel-file').value = ''; // Reset input
            } catch (err) {
                console.error(err);
                alert("Hubo un error al procesar el archivo Excel. Verifica que tenga el formato de la plantilla.");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    switchUnit(unit) {
        this.currentUnit = unit;
        document.getElementById('current-unit-title').innerText = `ACOMODO EN ${unit.name.toUpperCase()}`;
        this.renderUnitChips();
        this.createFullUnit();
        this.updateStats();
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setupLoginListeners() {
        // Persistencia de sesión automática con Firebase
        auth.onAuthStateChanged(async user => {
            const loadingScreen = document.getElementById('loading-screen');
            const loginScreen = document.getElementById('login-screen');
            const loginBtn = document.querySelector('.btn-login');
            
            if (user) {
                // Set global tenant for real-time listeners on page refresh
                // Obtener automáticamente la clave de empresa asignada desde el Backend (Firestore)
                let storedTenant = null;
                const loginBtn = document.querySelector('.btn-login');

                if (user.email === 'zalazardemiranda@gmail.com') {
                    storedTenant = 'ADMON';
                } else {
                    try {
                        const userDoc = await db.collection('company_users').doc(user.email).get();
                        if (!userDoc.exists) {
                            alert("ACCESO DENEGADO: Tu cuenta (" + user.email + ") no tiene una clave de empresa asignada por el administrador.");
                            await auth.signOut();
                            if (loginBtn) {
                                loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                                loginBtn.disabled = false;
                            }
                            return;
                        }

                        const userData = userDoc.data();
                        if (!userData.tenant || userData.tenant.trim() === "") {
                            alert("ACCESO DENEGADO: Tu cuenta no tiene una clave de empresa válida asignada en el sistema.");
                            await auth.signOut();
                            if (loginBtn) {
                                loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                                loginBtn.disabled = false;
                            }
                            return;
                        }

                        storedTenant = userData.tenant.trim().toUpperCase();
                    } catch (err) {
                        console.error("Error al obtener clave de empresa desde Firestore:", err);
                        alert("Error validando permisos de acceso. Por favor verifica tu conexión e intenta de nuevo.");
                        await auth.signOut();
                        if (loginBtn) {
                            loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                            loginBtn.disabled = false;
                        }
                        return;
                    }
                }

                localStorage.setItem('rodiload_tenant', storedTenant);
                this.currentTenant = storedTenant;
                window.appTenant = storedTenant;

                // Generar un ID de sesión para este dispositivo si no existe, guardado en localStorage
                if (!window.currentSessionId) {
                    let savedSession = localStorage.getItem('rodiload_session_id');
                    if (!savedSession) {
                        savedSession = Math.random().toString(36).substring(2, 15);
                        localStorage.setItem('rodiload_session_id', savedSession);
                    }
                    window.currentSessionId = savedSession;
                }

                try {
                    const sessionRef = db.collection('users_sessions').doc(user.email);
                    const doc = await sessionRef.get();

                    if (doc.exists && doc.data().sessionId && doc.data().sessionId !== window.currentSessionId) {
                        // Alguien más está usando la cuenta
                        const forceLogin = confirm("Esta cuenta se encuentra en uso en otra computadora.\n\n¿Deseas cerrar la otra sesión e ingresar aquí?");
                        if (!forceLogin) {
                            if (window.sessionListener) window.sessionListener();
                            await auth.signOut();
                            if (loginBtn) {
                                loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                                loginBtn.disabled = false;
                            }
                            return; // El usuario canceló, abortamos el login
                        }
                    }

                    // Registrar ESTA sesión
                    await sessionRef.set({
                        sessionId: window.currentSessionId,
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    // Configurar el listener para detectar si alguien más inicia sesión
                    if (window.sessionListener) window.sessionListener(); // Limpiar listener anterior si existe
                    window.sessionListener = sessionRef.onSnapshot(snapshot => {
                        if (snapshot.exists) {
                            const data = snapshot.data();
                            if (data.sessionId && data.sessionId !== window.currentSessionId) {
                                // ALGUIEN MÁS INICIÓ SESIÓN
                                alert("Tu sesión ha sido cerrada porque alguien más ingresó con tu cuenta en otro dispositivo.");
                                if (window.sessionListener) {
                                    window.sessionListener();
                                    window.sessionListener = null;
                                }
                                auth.signOut();
                            }
                        }
                    });

                    window.appTenant = storedTenant;
                    window.appUserName = user.email;

                    // Flujo normal de UI (Ocultar login y mostrar app)
                    if (loginScreen) {
                        loginScreen.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                        loginScreen.style.opacity = '0';
                        loginScreen.style.transform = 'scale(1.05) translateY(-20px)';
                        loginScreen.style.pointerEvents = 'none';
                        setTimeout(() => {
                            loginScreen.style.display = 'none';
                        }, 400);
                    }
                    if (loadingScreen) loadingScreen.style.display = 'none';
                    
                    // Verificar Suscripción Activa (RevenueCat Mock / Paywall)
                    const hasActiveSub = await this.checkSubscriptionStatus(user.uid);
                    
                    const modeSelection = document.getElementById('mode-selection-screen');
                    const paywall = document.getElementById('paywall-screen');
                    
                    if (!hasActiveSub && storedTenant !== 'ADMON' && storedTenant !== 'INTERNO') {
                        // Mostrar Muro de Pago
                        if (paywall) {
                            paywall.style.display = 'flex';
                            paywall.style.animation = 'fadeIn 0.5s ease-out';
                        }
                    } else {
                        // Usuario Premium o Admin: Mostrar Menú
                        if (modeSelection) {
                            modeSelection.style.display = 'flex';
                            modeSelection.style.animation = 'fadeIn 0.5s ease-out';
                        }
                    }
                        
                        // Show admin button only for admin
                        const adminModeBtnContainer = document.getElementById('admin-mode-container');
                        if (adminModeBtnContainer) {
                            if (user.email === 'zalazardemiranda@gmail.com' && storedTenant === 'ADMON') {
                                adminModeBtnContainer.style.display = 'block';
                            } else {
                                adminModeBtnContainer.style.display = 'none';
                            }
                        }
                    
                    if (typeof this.onWindowResize === 'function') {
                        this.onWindowResize();
                    }

                    if (loginBtn) {
                        loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                        loginBtn.disabled = false;
                    }

                } catch (e) {
                    console.error("Error al validar sesión múltiple:", e);
                    alert("Hubo un problema verificando las sesiones. Intenta nuevamente.");
                    auth.signOut();
                }

            } else {
                // No hay usuario, limpiamos listener y mostramos el login
                if (window.sessionListener) {
                    window.sessionListener();
                    window.sessionListener = null;
                }
                if (loadingScreen) loadingScreen.style.display = 'none';
                if (loginScreen) {
                    loginScreen.style.display = 'flex';
                    loginScreen.style.opacity = '1';
                    loginScreen.style.transform = 'scale(1) translateY(0)';
                    loginScreen.style.pointerEvents = 'all';
                }
                const modeSelection = document.getElementById('mode-selection-screen');
                if (modeSelection) modeSelection.style.display = 'none';
                
                const appContainer = document.querySelector('.app-container');
                if (appContainer) appContainer.style.display = 'none';
            }
        });

        const loginForm = document.getElementById('login-form');

        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleLogin();
            };
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }

        const massiveLogoutBtn = document.getElementById('btn-massive-logout');
        if (massiveLogoutBtn) {
            massiveLogoutBtn.onclick = () => this.handleLogout();
        }

        // Lucide icons for the new elements
        if (window.lucide) window.lucide.createIcons();

        // Configuración de Recuperación de Contraseña (Zoho Mail: contacto@rodiload.com)
        const btnForgot = document.getElementById('btn-forgot-password');
        const forgotModal = document.getElementById('forgot-modal');
        const forgotForm = document.getElementById('forgot-form');
        const forgotEmailInput = document.getElementById('forgot-email');
        const forgotStatusMsg = document.getElementById('forgot-status-msg');
        const btnCloseForgot = document.getElementById('btn-close-forgot');
        const btnSubmitForgot = document.getElementById('btn-submit-forgot');

        if (btnForgot && forgotModal) {
            btnForgot.onclick = (e) => {
                e.preventDefault();
                const userField = document.getElementById('login-username');
                if (userField && userField.value.trim().includes('@')) {
                    forgotEmailInput.value = userField.value.trim().toLowerCase();
                }
                if (forgotStatusMsg) forgotStatusMsg.style.display = 'none';
                forgotModal.style.display = 'flex';
                if (window.lucide) window.lucide.createIcons();
            };
        }

        if (btnCloseForgot && forgotModal) {
            btnCloseForgot.onclick = () => {
                forgotModal.style.display = 'none';
            };
        }

        if (forgotForm) {
            forgotForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = forgotEmailInput.value.trim().toLowerCase();
                if (!email) return;

                if (btnSubmitForgot) {
                    btnSubmitForgot.disabled = true;
                    btnSubmitForgot.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO...';
                }
                if (forgotStatusMsg) forgotStatusMsg.style.display = 'none';

                try {
                    await auth.sendPasswordResetEmail(email);
                    if (forgotStatusMsg) {
                        forgotStatusMsg.style.display = 'block';
                        forgotStatusMsg.style.background = 'rgba(16, 185, 129, 0.15)';
                        forgotStatusMsg.style.border = '1px solid #10b981';
                        forgotStatusMsg.style.color = '#34d399';
                        forgotStatusMsg.innerHTML = '<strong>¡Enlace de recuperación enviado!</strong><br>Revisa la bandeja de entrada o spam de <b>' + email + '</b> para restablecer tu contraseña.';
                    }
                    forgotEmailInput.value = '';
                    if (btnSubmitForgot) {
                        btnSubmitForgot.innerHTML = 'REENVIAR ENLACE <i data-lucide="send"></i>';
                        btnSubmitForgot.disabled = false;
                    }
                } catch (error) {
                    console.error("Error al solicitar restablecimiento de contraseña:", error);
                    let errMsg = 'Ocurrió un error al enviar el enlace. Intenta de nuevo más tarde.';
                    if (error.code === 'auth/user-not-found') {
                        errMsg = 'No existe una cuenta registrada con este correo electrónico.';
                    } else if (error.code === 'auth/invalid-email') {
                        errMsg = 'El formato del correo electrónico ingresado no es válido.';
                    } else if (error.code === 'auth/too-many-requests') {
                        errMsg = 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
                    }

                    if (forgotStatusMsg) {
                        forgotStatusMsg.style.display = 'block';
                        forgotStatusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
                        forgotStatusMsg.style.border = '1px solid #ef4444';
                        forgotStatusMsg.style.color = '#f87171';
                        forgotStatusMsg.innerHTML = errMsg;
                    }
                    if (btnSubmitForgot) {
                        btnSubmitForgot.innerHTML = 'ENVIAR ENLACE <i data-lucide="send"></i>';
                        btnSubmitForgot.disabled = false;
                    }
                }
                if (window.lucide) window.lucide.createIcons();
            };
        }
    }

    handleLogout() {
        if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            // El logout real de Firebase dispara onAuthStateChanged que maneja la UI
            localStorage.removeItem('rodiload_tenant');
            auth.signOut();
            
            // Limpiar campos de login para mayor seguridad
            const userField = document.getElementById('login-username');
            const passField = document.getElementById('login-password');
            if (userField) userField.value = '';
            if (passField) passField.value = '';
        }
    }

    async handleLogin() {
        const userField = document.getElementById('login-username');
        const passField = document.getElementById('login-password');
        const loginBtn = document.querySelector('.btn-login');

        const rawUser = userField ? userField.value.trim() : "";
        const pass = passField ? passField.value : "";

        if (rawUser === "" || pass === "") {
            alert("ERROR: Ingresa tu correo y contraseña.");
            return;
        }

        // Eliminar espacios y forzar minúsculas para el email
        let email = rawUser.replace(/\s+/g, '').toLowerCase();
        if (!email.includes('@')) {
            email += "@rodiload.app";
        }

        this.currentUserName = rawUser;

        try {
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTENTICANDO...';
                loginBtn.disabled = true;
            }

            // Reutilizar el ID de sesión existente para este dispositivo (no generar uno nuevo en cada login)
            // Esto evita que el sistema piense que hay otra sesión activa cuando el mismo usuario vuelve a entrar
            let existingSession = localStorage.getItem('rodiload_session_id') || sessionStorage.getItem('rodiload_session_id');
            if (!existingSession) {
                existingSession = Math.random().toString(36).substring(2, 15);
            }
            window.currentSessionId = existingSession;
            localStorage.setItem('rodiload_session_id', existingSession);

            window.appUserName = this.currentUserName;

            // Autenticación Real con Firebase (esto disparará onAuthStateChanged donde se obtiene la empresa desde Firestore)
            await auth.signInWithEmailAndPassword(email, pass);

        } catch (error) {
            console.error("Error en login:", error);
            let msg = error.message;
            if (error.code === 'auth/wrong-password') {
                msg = "Contraseña incorrecta. Por favor verifica e intenta nuevamente.";
            } else if (error.code === 'auth/user-not-found') {
                msg = "No existe ningún usuario registrado con este correo electrónico.";
            } else if (error.code === 'auth/invalid-credential') {
                msg = "Credenciales incorrectas. Verifica tu correo y contraseña.";
            }
            alert("Error al iniciar sesión: " + msg);
            if (loginBtn) {
                loginBtn.innerHTML = 'INGRESAR AL SISTEMA <i data-lucide="arrow-right"></i>';
                loginBtn.disabled = false;
            }
        }
    }

    async checkSubscriptionStatus(uid) {
        // En una app real de Capacitor, aquí se usaría:
        // import { Purchases } from '@revenuecat/purchases-capacitor';
        // const customerInfo = await Purchases.getCustomerInfo();
        // return customerInfo.entitlements.active['pro'] !== undefined;
        
        // Mock de verificación contra Firebase para Web/Pruebas
        try {
            const doc = await db.collection('user_subscriptions').doc(uid).get();
            if (doc.exists && doc.data().status === 'active') {
                return true;
            }
            return false;
        } catch (e) {
            console.warn("Error verificando suscripción", e);
            return false;
        }
    }

    async saveShipmentToHistory() {
        if (this.cargoList.length === 0) {
            alert("SISTEMA: No hay carga para guardar.");
            return;
        }

        try {
            const btn = document.getElementById('btn-generate-shipment');
            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';

            const groupedCargo = {};
            this.cargoList.forEach(c => {
                const key = (c.sku || c.desc || 'Caja') + '_' + c.l + '_' + c.w + '_' + c.h + '_' + c.weight;
                if (!groupedCargo[key]) {
                    groupedCargo[key] = { desc: c.desc || c.sku || 'Caja', qty: 0, l: c.l, w: c.w, h: c.h, weight: c.weight, sku: c.sku };
                }
                groupedCargo[key].qty++;
            });
            const packedCargoArray = Object.values(groupedCargo);

            const shipmentData = {
                userId: auth.currentUser ? auth.currentUser.uid : 'anon',
                userEmail: auth.currentUser ? auth.currentUser.email : 'anon',
                date: new Date().toISOString(),
                unit: this.currentUnit,
                cargo: packedCargoArray,
                stats: {
                    totalWeight: this.cargoList.reduce((sum, c) => sum + c.weight, 0),
                    totalVol: this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0),
                    efficiency: Math.round((this.cargoList.reduce((sum, c) => sum + (c.w * c.l * c.h), 0) / this.currentUnit.volume) * 100)
                }
            };

            await db.collection('shipments').add(shipmentData);
            
            alert("✓ CUBICAJE RESGUARDADO: Los datos se han guardado exitosamente en la nube de Rodiload.");
            if (btn) btn.innerHTML = '<i data-lucide="check"></i> GUARDADO';
            
            // Llama a la funcion local de UI (Panel historial local)
            this.saveCurrentShipment();
            
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("ERROR: No se pudo guardar en la nube. Verifica tu conexión.");
        }
    }
}
window.onload = () => { window.app = new CubicadorApp(); };
