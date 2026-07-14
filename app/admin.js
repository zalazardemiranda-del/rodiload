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
                    <td style="padding: 12px 10px; font-weight: bold; color: #52b5d4;">${data.tenant}</td>
                    <td style="padding: 12px 10px; text-align: right;">
                        <button class="btn-delete-user" data-id="${doc.id}" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); padding: 5px 10px; border-radius: 6px; cursor: pointer;">Eliminar</button>
                    </td>
                `;
                this.usersList.appendChild(tr);
            });

            // Add delete listeners
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => this.deleteUser(e.target.getAttribute('data-id')));
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
