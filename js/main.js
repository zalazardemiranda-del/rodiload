// =============================================
// RODILOAD - main.js
// =============================================

const WA_NUMBER = '523143523230';
const WA_MSG_AYUDA = encodeURIComponent('Hola RODILOAD 🚚, me interesa conocer más sobre el software de cubicación. ¿Me pueden ayudar?');
const WA_MSG_VENTAS = encodeURIComponent('Hola RODILOAD 🚚, quisiera ponerme en contacto con el equipo de ventas.');

// =============================================
// CONTENIDO LEGAL
// =============================================
const LEGAL_CONTENT = {
    terms: `
        <h2>Términos y Condiciones de Uso</h2>
        <p class="legal-date">Última actualización: Mayo 2026 · RODILOAD · rodiload.com</p>

        <h3>1. Aceptación de los Términos</h3>
        <p>Al acceder y utilizar la plataforma RODILOAD (en adelante "el Servicio"), usted acepta quedar vinculado por estos Términos y Condiciones.</p>

        <h3>2. Descripción del Servicio</h3>
        <p>RODILOAD es un software de cubicación 3D en la nube que permite planificar, visualizar y optimizar la distribución de mercancía en unidades de transporte. El servicio se ofrece en modalidades de pago (Plan Diario, Plan Mensual y Plan Empresarial Anual).</p>

        <h3>3. Registro y Cuenta de Usuario</h3>
        <p>Para utilizar el Servicio, el usuario deberá crear una cuenta proporcionando información veraz, completa y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.</p>

        <h3>4. Planes de Suscripción y Pagos</h3>
        <p>Los planes de suscripción disponibles y sus precios están publicados en la sección "Planes" de rodiload.com. Los pagos son procesados de forma segura. El Plan Diario otorga acceso por 24 horas. El Plan Mensual se renueva automáticamente cada mes. El Plan Empresarial Anual se renueva cada año. Todos los precios están expresados en Pesos Mexicanos (MXN) + IVA.</p>

        <h3>5. Política de Cancelación</h3>
        <p>El usuario podrá cancelar su suscripción en cualquier momento desde su panel de control. La cancelación será efectiva al término del período de facturación vigente. No se realizarán reembolsos por períodos parciales.</p>

        <h3>6. Propiedad Intelectual</h3>
        <p>Todo el contenido de RODILOAD, incluyendo pero no limitado a: software, algoritmos, interfaces gráficas, logotipos y textos, es propiedad exclusiva de Rodipack y está protegido por las leyes de propiedad intelectual aplicables en México.</p>

        <h3>7. Limitación de Responsabilidad</h3>
        <p>RODILOAD provee herramientas de cálculo y optimización como apoyo a la toma de decisiones logísticas. El resultado final de la cubicación depende de factores externos al sistema. Rodipack no se hace responsable de pérdidas económicas derivadas del uso o mal uso de la información generada por la plataforma.</p>

        <h3>8. Modificaciones a los Términos</h3>
        <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. En caso de cualquier modificación, le notificaremos al cliente por correo electrónico. Las modificaciones entrarán en vigor una vez notificadas y publicadas en el sitio web. El uso continuado del Servicio constituye la aceptación de los nuevos términos.</p>

        <h3>9. Jurisdicción y Ley Aplicable</h3>
        <p>Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los Tribunales competentes de la ciudad de Colima, Colima, México.</p>

        <h3>10. Contacto</h3>
        <p>Para cualquier consulta relacionada con estos Términos, puede contactarnos a través de WhatsApp al +52 314 352 3230 o visitando rodiload.com.</p>
    `,
    privacy: `
        <h2>Aviso de Privacidad</h2>
        <p class="legal-date">Última actualización: Mayo 2026 · RODILOAD · rodiload.com</p>

        <p>En cumplimiento con lo establecido en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento, Rodipack (en adelante "el Responsable") pone a su disposición el presente Aviso de Privacidad.</p>

        <h3>1. Identidad y Domicilio del Responsable</h3>
        <p><strong>Rodipack</strong> · Colima, México · Sitio web: rodiload.com · Contacto: +52 314 352 3230</p>

        <h3>2. Datos Personales que Recabamos</h3>
        <p>Para los fines indicados en este aviso, recabamos los siguientes datos personales: nombre completo o razón social, correo electrónico, número de teléfono, contraseña (almacenada de forma encriptada), y datos de uso de la plataforma (registros de actividad, cubicaciones realizadas).</p>

        <h3>3. Finalidades del Tratamiento</h3>
        <p><strong>Finalidades primarias (necesarias):</strong></p>
        <ul>
            <li>Creación y gestión de su cuenta de usuario.</li>
            <li>Prestación del servicio de cubicación contratado.</li>
            <li>Procesamiento de pagos y facturación.</li>
            <li>Soporte técnico y atención al cliente.</li>
        </ul>
        <p><strong>Finalidades secundarias (opcionales):</strong></p>
        <ul>
            <li>Envío de boletines informativos y novedades del producto.</li>
            <li>Estudios estadísticos internos para mejora del servicio.</li>
        </ul>

        <h3>4. Transferencia de Datos</h3>
        <p>Sus datos personales podrán ser compartidos únicamente con proveedores de servicios tecnológicos esenciales para la operación de RODILOAD (ej. Firebase de Google para autenticación y base de datos), quienes se encuentran obligados contractualmente a tratarlos con el mismo nivel de protección que el Responsable.</p>

        <h3>5. Derechos ARCO</h3>
        <p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus datos personales. Para ejercer estos derechos, envíe su solicitud a través de WhatsApp al +52 314 352 3230 indicando el derecho que desea ejercer y adjuntando una identificación oficial.</p>

        <h3>6. Uso de Cookies</h3>
        <p>RODILOAD utiliza cookies propias y de terceros con fines de autenticación de sesión y análisis de uso. Al continuar navegando en el sitio, usted acepta el uso de dichas cookies.</p>

        <h3>7. Cambios al Aviso de Privacidad</h3>
        <p>Nos reservamos el derecho de modificar el presente Aviso en cualquier momento. En caso de modificar el aviso o los términos y condiciones, le notificaremos al cliente por correo electrónico.</p>
    `
};

// =============================================
// FUNCIÓN PARA ABRIR MODAL LEGAL
// =============================================
function openLegal(type) {
    const modal = document.getElementById('legal-modal');
    const content = document.getElementById('legal-content');
    if (!modal || !content) return;
    content.innerHTML = LEGAL_CONTENT[type] || '';
    modal.classList.add('active');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
}

// =============================================
// MANEJO DEL FORMULARIO DE SOLICITUD
// =============================================
async function handleTrialSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name    = document.getElementById('form-name').value.trim();
    const email   = document.getElementById('form-email').value.trim();
    const btn     = document.getElementById('form-submit-btn');

    // Validación básica
    if (!name || !email) {
        alert('Por favor completa los campos obligatorios.');
        return;
    }

    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;">⏳ Enviando solicitud...</span>';
    btn.disabled = true;

    try {
        const formData = new FormData(form);
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });

        if (response.ok) {
            // Mostrar mensaje de éxito dentro del modal
            const formContainer = document.getElementById('trial-form');
            formContainer.innerHTML = `
                <div style="text-align:center; padding: 20px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                    <h3 style="color: #60a5fa; margin-bottom: 12px;">¡Solicitud enviada!</h3>
                    <p style="color: #94a3b8; line-height: 1.6;">
                        Recibimos tu solicitud correctamente.<br>
                        Nuestro equipo se pondrá en contacto contigo en menos de <strong style="color:white;">24 horas</strong> al correo <strong style="color:white;">${email}</strong>.
                    </p>
                    <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Este formulario se cerrará automáticamente...</p>
                </div>
            `;
            setTimeout(() => {
                document.getElementById('trial-modal').classList.remove('active');
                // Restaurar el formulario para uso futuro
                setTimeout(() => location.reload(), 300);
            }, 3500);
        } else {
            throw new Error('Error al enviar');
        }
    } catch (err) {
        console.error('Error Netlify Forms:', err);
        btn.innerHTML = 'Enviar Solicitud';
        btn.disabled = false;
        alert('❌ Hubo un problema al enviar el formulario. Por favor intenta de nuevo o contáctanos por WhatsApp.');
    }
}

// =============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer para revelar elementos al hacer scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    revealElements.forEach(el => revealObserver.observe(el));

    // Navbar blur al hacer scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(2, 6, 23, 0.97)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.2)';
        } else {
            navbar.style.background = 'rgba(2, 6, 23, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Smooth scroll para links internos de sección
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // Modal de solicitud de acceso
    const modal = document.getElementById('trial-modal');
    const closeModalBtn = document.querySelector('#trial-modal .close-modal');

    // Botón Iniciar Sesión → redirige a la pantalla de login del cubicador
    document.getElementById('btn-login-nav')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = './app/index.html';
    });

    // Botón Hero "Comenzar Prueba"
    document.getElementById('btn-trial-hero')?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
    });

    // Cerrar modal al click en X
    closeModalBtn?.addEventListener('click', () => modal.classList.remove('active'));

    // Cerrar modal al click fuera
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Tutoriales → WhatsApp avisando que próximamente
    document.getElementById('btn-tutorials-footer')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola RODILOAD 🚚, ¿cuándo estarán disponibles los tutoriales en video? Me gustaría aprender a usar la plataforma.')}`, '_blank');
    });
});
