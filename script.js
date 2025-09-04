const API_URL = "https://farmacia-269414280318.europe-west1.run.app"; // tu endpoint en .NET

// ------------------ LOGIN -------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dni = document.getElementById("dni").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.nombre);
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("errorMsg").innerText = "Credenciales inválidas";
    }
  });
}

// ------------------ DASHBOARD -------------------
async function cargarMedicamentos() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    if (!res.ok) throw new Error('Error al cargar medicamentos');
    
    const meds = await res.json();
    const tbody = document.querySelector("#tablaMedicamentos tbody");
    tbody.innerHTML = "";
    
    meds.forEach(m => {
      const fechaCreacion = new Date(m.fecha_creacion || '').toLocaleDateString();
      tbody.innerHTML += `
        <tr>
          <td>${m.nombre_comercial || 'N/A'}</td>
          <td>${m.presentacion || 'N/A'}</td>
          <td>${m.categoria || 'N/A'}</td>
          <td>${m.proveedor_id || 'N/A'}</td>
          <td>
            <button onclick="editarMedicamento('${m.id}')">✏️</button>
            <button onclick="eliminarMedicamento('${m.id}')">🗑️</button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar medicamentos');
  }
}

async function cargarStock() {
  try {
    const res = await fetch(`${API_URL}/stock`);
    if (!res.ok) throw new Error('Error al cargar stock');
    
    const stock = await res.json();
    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML = "";
    
stock.forEach(mov => {
  fila.innerHTML = `
    <td>${mov.medicamentos?.nombre_comercial || 'N/A'}</td>
    <td>${mov.lote || '-'}</td>
    <td>${mov.creado_en ? new Date(mov.creado_en).toLocaleDateString() : '-'}</td>
    <td>${mov.fecha_vencimiento || '-'}</td>
    <td>${mov.cantidad ?? 0}</td>
  `;
});

  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar stock');
  }
}

// ------------------ CRUD MEDICAMENTOS -------------------
function mostrarFormularioMedicamento(id = null) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const crudForm = document.getElementById("crudForm");

  modalTitle.textContent = id ? "Editar Medicamento" : "Nuevo Medicamento";
  
  crudForm.innerHTML = `
    <input type="text" id="nombre_comercial" placeholder="Nombre Comercial" required>
    <input type="text" id="nombre_generico" placeholder="Nombre Genérico">
    <input type="text" id="presentacion" placeholder="Presentación" required>
    <input type="text" id="categoria" placeholder="Categoría">
    <input type="text" id="laboratorio" placeholder="Laboratorio">
    <textarea id="descripcion" placeholder="Descripción"></textarea>
    <button type="submit">${id ? 'Actualizar' : 'Crear'}</button>
  `;

  crudForm.onsubmit = (e) => {
    e.preventDefault();
    if (id) {
      actualizarMedicamento(id);
    } else {
      crearMedicamento();
    }
  };

  // Si es edición, cargar datos existentes
  if (id) {
    cargarDatosMedicamento(id);
  }

  modal.classList.remove("hidden");
}

async function cargarDatosMedicamento(id) {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();
    const med = medicamentos.find(m => m.id === id);
    
    if (med) {
      document.getElementById("nombre_comercial").value = med.nombre_comercial || '';
      document.getElementById("nombre_generico").value = med.nombre_generico || '';
      document.getElementById("presentacion").value = med.presentacion || '';
      document.getElementById("categoria").value = med.categoria || '';
      document.getElementById("laboratorio").value = med.laboratorio || '';
      document.getElementById("descripcion").value = med.descripcion || '';
    }
  } catch (error) {
    console.error('Error al cargar medicamento:', error);
    mostrarError('Error al cargar datos del medicamento');
  }
}

async function crearMedicamento() {
  try {
    const medicamento = {
      nombre_comercial: document.getElementById("nombre_comercial").value,
      nombre_generico: document.getElementById("nombre_generico").value,
      presentacion: document.getElementById("presentacion").value,
      categoria: document.getElementById("categoria").value,
      laboratorio: document.getElementById("laboratorio").value,
      descripcion: document.getElementById("descripcion").value,
      fecha_creacion: new Date().toISOString()
    };

    const res = await fetch(`${API_URL}/medicamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicamento)
    });

    if (res.ok) {
      cerrarModal();
      cargarMedicamentos();
      mostrarExito('Medicamento creado exitosamente');
    } else {
      throw new Error('Error al crear medicamento');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al crear medicamento');
  }
}

async function actualizarMedicamento(id) {
  try {
    const medicamento = {
      nombre_comercial: document.getElementById("nombre_comercial").value,
      nombre_generico: document.getElementById("nombre_generico").value,
      presentacion: document.getElementById("presentacion").value,
      categoria: document.getElementById("categoria").value,
      laboratorio: document.getElementById("laboratorio").value,
      descripcion: document.getElementById("descripcion").value
    };

    const res = await fetch(`${API_URL}/medicamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicamento)
    });

    if (res.ok) {
      cerrarModal();
      cargarMedicamentos();
      mostrarExito('Medicamento actualizado exitosamente');
    } else {
      throw new Error('Error al actualizar medicamento');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al actualizar medicamento');
  }
}

function editarMedicamento(id) {
  mostrarFormularioMedicamento(id);
}

async function eliminarMedicamento(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este medicamento?')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/medicamentos/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      cargarMedicamentos();
      mostrarExito('Medicamento eliminado exitosamente');
    } else {
      throw new Error('Error al eliminar medicamento');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al eliminar medicamento');
  }
}

// ------------------ MOVIMIENTOS DE STOCK -------------------
function mostrarFormularioMovimiento() {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const crudForm = document.getElementById("crudForm");

  modalTitle.textContent = "Registrar Movimiento de Stock";
  
  crudForm.innerHTML = `
    <select id="medicamento_id" required>
      <option value="">Seleccionar Medicamento</option>
    </select>
    <select id="tipo" required>
      <option value="INGRESO">Ingreso</option>
      <option value="SALIDA">Salida</option>
    </select>
    <input type="number" id="cantidad" placeholder="Cantidad" required min="1">
    <input type="text" id="lote" placeholder="Lote" required>
    <input type="date" id="fecha_vencimiento" required>
    <textarea id="motivo" placeholder="Motivo/Observaciones"></textarea>
    <button type="submit">Registrar Movimiento</button>
  `;

  // Cargar medicamentos en el select
  cargarMedicamentosSelect();

  crudForm.onsubmit = (e) => {
    e.preventDefault();
    registrarMovimiento();
  };

  modal.classList.remove("hidden");
}

async function cargarMedicamentosSelect() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();
    const select = document.getElementById("medicamento_id");
    
    medicamentos.forEach(med => {
      const option = document.createElement("option");
      option.value = med.id;
      option.textContent = `${med.nombre_comercial} - ${med.presentacion}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar medicamentos:', error);
  }
}

async function registrarMovimiento() {
  try {
    const movimiento = {
      medicamento_id: document.getElementById("medicamento_id").value,
      tipo: document.getElementById("tipo").value,
      cantidad: parseInt(document.getElementById("cantidad").value),
      lote: document.getElementById("lote").value,
      fecha_vencimiento: document.getElementById("fecha_vencimiento").value,
      motivo: document.getElementById("motivo").value,
      fecha_movimiento: new Date().toISOString(),
      usuario_id: "user-temp" // Aquí podrías usar el ID del usuario logueado
    };

    const res = await fetch(`${API_URL}/movimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimiento)
    });

    if (res.ok) {
      cerrarModal();
      cargarStock();
      mostrarExito('Movimiento registrado exitosamente');
    } else {
      throw new Error('Error al registrar movimiento');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al registrar movimiento');
  }
}

// ------------------ UTILIDADES -------------------
function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
}

function mostrarError(mensaje) {
  // Puedes implementar un sistema de notificaciones más sofisticado
  alert(`❌ ${mensaje}`);
}

function mostrarExito(mensaje) {
  // Puedes implementar un sistema de notificaciones más sofisticado
  alert(`✅ ${mensaje}`);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.href = "index.html";
}

// ------------------ VERIFICACIÓN DE AUTENTICACIÓN -------------------
function verificarAutenticacion() {
  const token = localStorage.getItem("token");
  if (!token && !window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
  }
}

// ------------------ INICIALIZACIÓN -------------------
if (document.querySelector("#tablaMedicamentos")) {
  verificarAutenticacion();
  cargarMedicamentos();
  cargarStock();
  
  // Mostrar nombre del usuario
  const userName = localStorage.getItem("userName");
  if (userName) {
    document.querySelector("h1").textContent += ` - Bienvenido ${userName}`;
  }
}

// Cerrar modal al hacer clic fuera de él
document.addEventListener('click', (e) => {
  const modal = document.getElementById("modal");
  if (e.target === modal) {
    cerrarModal();
  }
});