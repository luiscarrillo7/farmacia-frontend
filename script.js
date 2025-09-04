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
    if (!res.ok) throw new Error("Error al cargar medicamentos");

    const meds = await res.json();
    const tbody = document.querySelector("#tablaMedicamentos tbody");
    tbody.innerHTML = "";

    meds.forEach((m) => {
      tbody.innerHTML += `
        <tr>
          <td>${m.nombre_comercial || "N/A"}</td>
          <td>${m.presentacion || "N/A"}</td>
          <td>${m.categoria || "N/A"}</td>
          <td>${m.proveedor_id || "N/A"}</td>
          <td>
            <button onclick="editarMedicamento('${m.id}')">✏️</button>
            <button onclick="eliminarMedicamento('${m.id}')">🗑️</button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al cargar medicamentos");
  }
}

async function cargarStock() {
  try {
    const res = await fetch(`${API_URL}/stock`);
    if (!res.ok) throw new Error("Error al cargar stock");

    const stock = await res.json();
    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML = "";

    stock.forEach((s) => {
      const fechaVencimiento = new Date(s.fecha_vencimiento).toLocaleDateString();
      const stockClass = s.stock_total <= 10 ? "stock-bajo" : "";

      tbody.innerHTML += `
        <tr class="${stockClass}">
          <td>${s.nombre_comercial || "N/A"}</td>
          <td>${s.lote || "N/A"}</td>
          <td>-</td>
          <td>${fechaVencimiento}</td>
          <td>${s.stock_total}</td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al cargar stock");
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
    <button type="submit">${id ? "Actualizar" : "Crear"}</button>
  `;

  crudForm.onsubmit = (e) => {
    e.preventDefault();
    if (id) {
      actualizarMedicamento(id);
    } else {
      crearMedicamento();
    }
  };

  if (id) cargarDatosMedicamento(id);

  modal.classList.remove("hidden");
}

async function cargarDatosMedicamento(id) {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();
    const med = medicamentos.find((m) => m.id === id);

    if (med) {
      document.getElementById("nombre_comercial").value = med.nombre_comercial || "";
      document.getElementById("nombre_generico").value = med.nombre_generico || "";
      document.getElementById("presentacion").value = med.presentacion || "";
      document.getElementById("categoria").value = med.categoria || "";
      document.getElementById("laboratorio").value = med.laboratorio || "";
      document.getElementById("descripcion").value = med.descripcion || "";
    }
  } catch (error) {
    console.error("Error al cargar medicamento:", error);
    mostrarError("Error al cargar datos del medicamento");
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(medicamento)
    });

    if (res.ok) {
      cerrarModal();
      cargarMedicamentos();
      mostrarExito("Medicamento creado exitosamente");
    } else throw new Error("Error al crear medicamento");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al crear medicamento");
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(medicamento)
    });

    if (res.ok) {
      cerrarModal();
      cargarMedicamentos();
      mostrarExito("Medicamento actualizado exitosamente");
    } else throw new Error("Error al actualizar medicamento");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al actualizar medicamento");
  }
}

function editarMedicamento(id) {
  mostrarFormularioMedicamento(id);
}

async function eliminarMedicamento(id) {
  if (!confirm("¿Estás seguro de que quieres eliminar este medicamento?")) return;

  try {
    const res = await fetch(`${API_URL}/medicamentos/${id}`, { method: "DELETE" });

    if (res.ok) {
      cargarMedicamentos();
      mostrarExito("Medicamento eliminado exitosamente");
    } else throw new Error("Error al eliminar medicamento");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al eliminar medicamento");
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

    medicamentos.forEach((med) => {
      const option = document.createElement("option");
      option.value = med.id;
      option.textContent = `${med.nombre_comercial} - ${med.presentacion}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar medicamentos:", error);
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
      usuario_id: "user-temp"
    };

    const res = await fetch(`${API_URL}/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movimiento)
    });

    if (res.ok) {
      cerrarModal();
      cargarStock();
      mostrarExito("Movimiento registrado exitosamente");
    } else throw new Error("Error al registrar movimiento");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al registrar movimiento");
  }
}

// ------------------ VENTAS -------------------
async function cargarVentas() {
  try {
    const res = await fetch(`${API_URL}/ventas`);
    if (!res.ok) throw new Error("Error al cargar ventas");

    const ventas = await res.json();
    const tbody = document.querySelector("#tablaVentas tbody");
    tbody.innerHTML = "";

    ventas.forEach((v) => {
      const fecha = new Date(v.fecha).toLocaleString();
      tbody.innerHTML += `
        <tr>
          <td>${v.id}</td>
          <td>${v.cliente_nombre || "N/A"}</td>
          <td>${v.usuario_id || "N/A"}</td>
          <td>S/ ${v.total.toFixed(2)}</td>
          <td>${fecha}</td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al cargar ventas");
  }
}

function mostrarFormularioVenta() {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const crudForm = document.getElementById("crudForm");

  modalTitle.textContent = "Registrar Nueva Venta";

  crudForm.innerHTML = `
    <input type="text" id="cliente_nombre" placeholder="Nombre Cliente" required>
    <div id="detalleVenta"></div>
    <button type="button" onclick="agregarDetalleVenta()">➕ Agregar Medicamento</button>
    <button type="submit">Registrar Venta</button>
  `;

  crudForm.onsubmit = (e) => {
    e.preventDefault();
    registrarVenta();
  };

  modal.classList.remove("hidden");
}

function agregarDetalleVenta() {
  const detalleDiv = document.getElementById("detalleVenta");
  const detalleHTML = `
    <div class="detalle-item">
      <select class="medicamentoSelect" required></select>
      <input type="number" class="cantidadDetalle" placeholder="Cantidad" min="1" required>
      <input type="number" class="precioDetalle" placeholder="Precio" min="0" step="0.01" required>
      <button type="button" onclick="this.parentElement.remove()">❌</button>
    </div>
  `;
  detalleDiv.insertAdjacentHTML("beforeend", detalleHTML);

  cargarMedicamentosSelectVenta();
}

async function cargarMedicamentosSelectVenta() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();
    const selects = document.querySelectorAll(".medicamentoSelect");

    selects.forEach((select) => {
      if (select.options.length <= 1) {
        select.innerHTML = `<option value="">Seleccionar Medicamento</option>`;
        medicamentos.forEach((med) => {
          const option = document.createElement("option");
          option.value = med.id;
          option.textContent = `${med.nombre_comercial} - ${med.presentacion}`;
          select.appendChild(option);
        });
      }
    });
  } catch (error) {
    console.error("Error al cargar medicamentos:", error);
  }
}

async function registrarVenta() {
  try {
    const cliente_nombre = document.getElementById("cliente_nombre").value;

    const detalles = [];
    document.querySelectorAll(".detalle-item").forEach((item) => {
      detalles.push({
        medicamento_id: item.querySelector(".medicamentoSelect").value,
        cantidad: parseInt(item.querySelector(".cantidadDetalle").value),
        precio: parseFloat(item.querySelector(".precioDetalle").value)
      });
    });

    const total = detalles.reduce((sum, d) => sum + d.cantidad * d.precio, 0);

    const venta = {
      cliente_nombre,
      usuario_id: localStorage.getItem("userName") || "usuario-temp",
      total,
      detalles
    };

    const res = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venta)
    });

    if (res.ok) {
      cerrarModal();
      cargarVentas();
      mostrarExito("Venta registrada exitosamente");
    } else throw new Error("Error al registrar venta");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("Error al registrar venta");
  }
}

// ------------------ UTILIDADES -------------------
function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
}

function mostrarError(mensaje) {
  alert(`❌ ${mensaje}`);
}

function mostrarExito(mensaje) {
  alert(`✅ ${mensaje}`);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.href = "index.html";
}

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
  cargarVentas();

  const userName = localStorage.getItem("userName");
  if (userName) {
    document.querySelector("h1").textContent += ` - Bienvenido ${userName}`;
  }
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modal");
  if (e.target === modal) cerrarModal();
});
