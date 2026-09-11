class AdminPanel {
    constructor() {
        this.init();
    }

    init() {
        this.adminModeBtn = document.getElementById('btn-mode-admin');
        this.adminContainer = document.getElementById('admin-panel-container');
        this.modeSelection = document.getElementById('mode-selection-screen');
        this.backBtn = document.getElementById('btn-admin-back');
        this.assignForm = document.getElementById('admin-assign-form');
        this.usersList = document.getElementById('admin-users-list');

        if (this.adminModeBtn) {
            this.adminModeBtn.addEventListener('click', () => this.showPanel());
        }

        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.hidePanel());
        }

        if (this.assignForm) {
            this.assignForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.assignUser();
            });
        }
    }

    showPanel() {
        if (this.modeSelection) this.modeSelection.style.display = 'none';
        if (this.adminContainer) {
            this.adminContainer.style.display = 'block';
            this.loadUsers();
        }
    }

    hidePanel() {
        if (this.adminContainer) this.adminContainer.style.display = 'none';
        if (this.modeSelection) this.modeSelection.style.display = 'flex';
    }

    async loadUsers() {
        if (!this.usersList) return;
        this.usersList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Cargando usuarios...</td></tr>';

        try {
            const snapshot = await db.collection('company_users').get();
            this.usersList.innerHTML = '';
            
            if (snapshot.empty) {
                this.usersList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No hay usuarios asignados aún.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                
                tr.innerHTML = `
                    <td style="padding: 12px 10px;">${data.email}</td>
                    <td style="padding: 12px 10px; font-weight: bold; color: #52b5d4;">
                        <span id="tenant-text-${doc.id}">${data.tenant}</span>
                        <input type="text" id="tenant-input-${doc.id}" value="${data.tenant}" style="display:none; width: 120px; background: #ffffff; border: 1px solid var(--border); color: var(--text-main); padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">
                    </td>
                    <td style="padding: 12px 10px; text-align: right; min-width: 200px;">
                        <button class="btn-edit-user" data-id="${doc.id}" id="btn-edit-${doc.id}" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.5); padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-right: 5px;">Editar</button>
                        <button class="btn-save-user" data-id="${doc.id}" id="btn-save-${doc.id}" style="display:none; background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.5); padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-right: 5px;">Guardar</button>
                        <button class="btn-cancel-edit" data-id="${doc.id}" id="btn-cancel-${doc.id}" style="display:none; background: rgba(160, 174, 192, 0.2); color: #a0aec0; border: 1px solid rgba(160, 174, 192, 0.5); padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-right: 5px;">Cancelar</button>
                        <button class="btn-delete-user" data-id="${doc.id}" id="btn-delete-${doc.id}" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); padding: 5px 10px; border-radius: 6px; cursor: pointer;">Eliminar</button>
                    </td>
                `;
                this.usersList.appendChild(tr);
            });

            // Add event listeners
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => this.deleteUser(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => this.startEditUser(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-cancel-edit').forEach(btn => {
                btn.addEventListener('click', (e) => this.cancelEditUser(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-save-user').forEach(btn => {
                btn.addEventListener('click', (e) => this.saveEditUser(e.target.getAttribute('data-id')));
            });

        } catch (error) {
            console.error("Error loading users:", error);
            this.usersList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color: #ef4444;">Error al cargar datos.</td></tr>';
        }
    }

    async assignUser() {
        const emailInput = document.getElementById('admin-input-email');
        const tenantInput = document.getElementById('admin-input-tenant');
        const submitBtn = document.getElementById('btn-admin-assign');

        const email = emailInput.value.trim().toLowerCase();
        const tenant = tenantInput.value.trim().toUpperCase();

        if (!email || !tenant) return;

        try {
            submitBtn.innerHTML = 'ASIGNANDO...';
            submitBtn.disabled = true;

            // Use email as document ID so we only have one record per email
            await db.collection('company_users').doc(email).set({
                email: email,
                tenant: tenant,
                assignedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            emailInput.value = '';
            tenantInput.value = '';
            
            // Reload list
            await this.loadUsers();
            
        } catch (error) {
            console.error("Error assigning user:", error);
            alert("Hubo un error al asignar el usuario.");
        } finally {
            submitBtn.innerHTML = 'ASIGNAR <i data-lucide="plus"></i>';
            submitBtn.disabled = false;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    startEditUser(docId) {
        document.getElementById(`tenant-text-${docId}`).style.display = 'none';
        document.getElementById(`tenant-input-${docId}`).style.display = 'inline-block';
        
        document.getElementById(`btn-edit-${docId}`).style.display = 'none';
        document.getElementById(`btn-delete-${docId}`).style.display = 'none';
        
        document.getElementById(`btn-save-${docId}`).style.display = 'inline-block';
        document.getElementById(`btn-cancel-${docId}`).style.display = 'inline-block';
    }

    cancelEditUser(docId) {
        document.getElementById(`tenant-text-${docId}`).style.display = 'inline-block';
        document.getElementById(`tenant-input-${docId}`).style.display = 'none';
        
        document.getElementById(`btn-edit-${docId}`).style.display = 'inline-block';
        document.getElementById(`btn-delete-${docId}`).style.display = 'inline-block';
        
        document.getElementById(`btn-save-${docId}`).style.display = 'none';
        document.getElementById(`btn-cancel-${docId}`).style.display = 'none';
        
        // Reset input value to original
        const originalValue = document.getElementById(`tenant-text-${docId}`).textContent;
        document.getElementById(`tenant-input-${docId}`).value = originalValue;
    }

    async saveEditUser(docId) {
        const input = document.getElementById(`tenant-input-${docId}`);
        const newTenant = input.value.trim().toUpperCase();
        
        if (!newTenant) {
            alert("La clave de empresa no puede estar vacía.");
            return;
        }
        
        const saveBtn = document.getElementById(`btn-save-${docId}`);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '...';
        saveBtn.disabled = true;

        try {
            await db.collection('company_users').doc(docId).update({
                tenant: newTenant
            });
            this.loadUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error al actualizar la clave del usuario.");
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    async deleteUser(docId) {
        if (!confirm("¿Estás seguro de que deseas eliminar el acceso a este usuario?")) return;
        
        try {
            await db.collection('company_users').doc(docId).delete();
            this.loadUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error al eliminar el usuario.");
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
