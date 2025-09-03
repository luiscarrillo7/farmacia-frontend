const API_URL = "https://farmacia-frontend-phi.vercel.app"; // tu endpoint en .NET

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
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("errorMsg").innerText = "Credenciales inválidas";
    }
  });
}

// ------------------ DASHBOARD -------------------
async function cargarMedicamentos() {
  const res = await fetch(`${API_URL}/medicamentos`);
  const meds = await res.json();

  const tbody = document.querySelector("#tablaMedicamentos tbody");
  tbody.innerHTML = "";
  meds.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${m.nombre_comercial}</td>
        <td>${m.presentacion}</td>
        <td>${m.categoria}</td>
        <td>${m.proveedor_id || "N/A"}</td>
        <td>
          <button onclick="editarMedicamento('${m.id}')">✏️</button>
          <button onclick="eliminarMedicamento('${m.id}')">🗑️</button>
        </td>
      </tr>`;
  });
}

async function cargarStock() {
  const res = await fetch(`${API_URL}/stock`);
  const stock = await res.json();

  const tbody = document.querySelector("#tablaStock tbody");
  tbody.innerHTML = "";
  stock.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.nombre_comercial}</td>
        <td>${s.lote}</td>
        <td>${s.fecha_ingreso || "-"}</td>
        <td>${s.fecha_vencimiento || "-"}</td>
        <td>${s.stock_total}</td>
      </tr>`;
  });
}

if (document.querySelector("#tablaMedicamentos")) {
  cargarMedicamentos();
  cargarStock();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
