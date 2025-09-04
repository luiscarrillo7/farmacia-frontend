const API_URL = "https://farmacia-269414280318.europe-west1.run.app";

// ==================== AUTENTICACIÓN ==================== //
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// ==================== CARGA INICIAL ==================== //
document.addEventListener("DOMContentLoaded", () => {
  cargarMedicamentos();
  cargarStock();
  cargarVentas();
});

// ==================== MEDICAMENTOS ==================== //
async function cargarMedicamentos() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();

    const tbody = document.querySelector("#tablaMedicamentos tbody");
    tbody.innerHTML = "";

    medicamentos.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.nombre_comercial}</td>
        <td>${m.presentacion}</td>
        <td>${m.categoria || "-"}</td>
        <td>${m.proveedor || "-"}</td>
        <td>
          <button onclick="editarMedicamento('${m.id}')">✏️</button>
          <button onclick="eliminarMedicamento('${m.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error cargando medicamentos:", err);
  }
}

async function mostrarFormularioMedicamento(medicamento = null) {
  abrirModal(medicamento ? "Editar Medicamento" : "Nuevo Medicamento", `
    <label>Nombre Comercial:<input type="text" id="nombre_comercial" value="${medicamento?.nombre_comercial || ""}"></label>
    <label>Presentación:<input type="text" id="presentacion" value="${medicamento?.presentacion || ""}"></label>
    <label>Categoría:<input type="text" id="categoria" value="${medicamento?.categoria || ""}"></label>
    <label>Proveedor:<input type="text" id="proveedor" value="${medicamento?.proveedor || ""}"></label>
    <button onclick="${medicamento ? `guardarMedicamento('${medicamento.id}')` : "crearMedicamento()"}">Guardar</button>
  `);
}

async function crearMedicamento() {
  const data = {
    nombre_comercial: document.getElementById("nombre_comercial").value,
    presentacion: document.getElementById("presentacion").value,
    categoria: document.getElementById("categoria").value,
    proveedor: document.getElementById("proveedor").value
  };

  try {
    await fetch(`${API_URL}/medicamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    cerrarModal();
    cargarMedicamentos();
  } catch (err) {
    console.error("Error creando medicamento:", err);
  }
}

async function editarMedicamento(id) {
  try {
    const res = await fetch(`${API_URL}/medicamentos/${id}`);
    const medicamento = await res.json();
    mostrarFormularioMedicamento(medicamento);
  } catch (err) {
    console.error("Error obteniendo medicamento:", err);
  }
}

async function guardarMedicamento(id) {
  const data = {
    nombre_comercial: document.getElementById("nombre_comercial").value,
    presentacion: document.getElementById("presentacion").value,
    categoria: document.getElementById("categoria").value,
    proveedor: document.getElementById("proveedor").value
  };

  try {
    await fetch(`${API_URL}/medicamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    cerrarModal();
    cargarMedicamentos();
  } catch (err) {
    console.error("Error editando medicamento:", err);
  }
}

async function eliminarMedicamento(id) {
  if (!confirm("¿Eliminar este medicamento?")) return;
  try {
    await fetch(`${API_URL}/medicamentos/${id}`, { method: "DELETE" });
    cargarMedicamentos();
  } catch (err) {
    console.error("Error eliminando medicamento:", err);
  }
}

// ==================== STOCK ==================== //
async function cargarStock() {
  try {
    const res = await fetch(`${API_URL}/stock`);
    const stock = await res.json();

    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML = "";

    stock.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.medicamentos?.nombre_comercial || "Desconocido"}</td>
        <td>${s.lote}</td>
        <td>${new Date(s.creado_en).toLocaleDateString("es-PE")}</td>
        <td>${new Date(s.fecha_vencimiento).toLocaleDateString("es-PE")}</td>
        <td>${s.cantidad}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error cargando stock:", err);
  }
}

async function mostrarFormularioMovimiento() {
  try {
    const res = await fetch(`${API_URL}/medicamentos`);
    const medicamentos = await res.json();

    const opciones = medicamentos.map(m => `<option value="${m.id}">${m.nombre_comercial}</option>`).join("");

    abrirModal("Nuevo Movimiento", `
      <label>Medicamento:<select id="medicamento_id">${opciones}</select></label>
      <label>Lote:<input type="text" id="lote"></label>
      <label>Fecha Vencimiento:<input type="date" id="fecha_vencimiento"></label>
      <label>Cantidad:<input type="number" id="cantidad"></label>
      <label>Precio Unitario:<input type="number" step="0.01" id="precio_unitario"></label>
      <button onclick="crearMovimiento()">Guardar</button>
    `);
  } catch (err) {
    console.error("Error mostrando formulario movimiento:", err);
  }
}

async function crearMovimiento() {
  const data = {
    medicamento_id: document.getElementById("medicamento_id").value,
    lote: document.getElementById("lote").value,
    fecha_vencimiento: document.getElementById("fecha_vencimiento").value,
    cantidad: parseInt(document.getElementById("cantidad").value),
    precio_unitario: parseFloat(document.getElementById("precio_unitario").value)
  };

  try {
    await fetch(`${API_URL}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    cerrarModal();
    cargarStock();
  } catch (err) {
    console.error("Error creando movimiento:", err);
  }
}

// ==================== VENTAS ==================== //
async function cargarVentas() {
  try {
    const res = await fetch(`${API_URL}/ventas`);
    const ventas = await res.json();

    const tbody = document.querySelector("#tablaVentas tbody");
    tbody.innerHTML = "";

    ventas.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.id}</td>
        <td>${v.total.toFixed(2)}</td>
        <td>${new Date(v.fecha).toLocaleDateString("es-PE")}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error cargando ventas:", err);
  }
}

async function mostrarFormularioVenta() {
  try {
    const res = await fetch(`${API_URL}/stock`);
    const stock = await res.json();

    const opciones = stock.map(s => `<option value="${s.id}" data-precio="${s.precio_unitario}">
      ${s.medicamentos?.nombre_comercial} (Stock: ${s.cantidad})
    </option>`).join("");

    abrirModal("Nueva Venta", `
      <label>Cliente:<input type="text" id="cliente"></label>
      <div id="detallesVenta"></div>
      <button onclick="agregarDetalle('${opciones.replace(/"/g, "&quot;")}')">➕ Agregar Medicamento</button>
      <p><strong>Total: S/ <span id="totalVenta">0.00</span></strong></p>
      <button onclick="crearVenta()">Guardar Venta</button>
    `);
  } catch (err) {
    console.error("Error mostrando formulario venta:", err);
  }
}

function agregarDetalle(opciones) {
  const div = document.createElement("div");
  div.innerHTML = `
    <label>Medicamento:<select class="stock_id">${opciones}</select></label>
    <label>Cantidad:<input type="number" class="cantidad" value="1"></label>
    <button onclick="this.parentElement.remove(); calcularTotal()">❌</button>
  `;
  document.getElementById("detallesVenta").appendChild(div);
}

function calcularTotal() {
  let total = 0;
  document.querySelectorAll("#detallesVenta div").forEach(detalle => {
    const stockSelect = detalle.querySelector(".stock_id");
    const precio = parseFloat(stockSelect.selectedOptions[0].dataset.precio);
    const cantidad = parseInt(detalle.querySelector(".cantidad").value) || 0;
    total += precio * cantidad;
  });
  document.getElementById("totalVenta").textContent = total.toFixed(2);
}

async function crearVenta() {
  const detalles = [];
  let total = 0;

  document.querySelectorAll("#detallesVenta div").forEach(detalle => {
    const stockSelect = detalle.querySelector(".stock_id");
    const stock_id = stockSelect.value;
    const precio_unitario = parseFloat(stockSelect.selectedOptions[0].dataset.precio);
    const cantidad = parseInt(detalle.querySelector(".cantidad").value) || 0;
    const subtotal = precio_unitario * cantidad;

    detalles.push({ stock_id, cantidad, precio_unitario });
    total += subtotal;
  });

  const data = {
    cliente_id: null, // puedes enlazar con clientes si lo deseas
    usuario_id: null, // puedes enlazar con usuarios si lo deseas
    total,
    detalles
  };

  try {
    await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    cerrarModal();
    cargarVentas();
    cargarStock(); // para actualizar stock después de la venta
  } catch (err) {
    console.error("Error creando venta:", err);
  }
}

// ==================== MODAL ==================== //
function abrirModal(titulo, contenido) {
  document.getElementById("modalTitle").textContent = titulo;
  document.getElementById("crudForm").innerHTML = contenido;
  document.getElementById("modal").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
}
