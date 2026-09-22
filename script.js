// script.js
async function cargarBaseDeDatos() {
  try {
    const response = await fetch('./data/db.json');
    const db = await response.json();
    
    console.log("Prácticas cargadas:", db.practicas);
    renderizarPracticas(db.practicas);
  } catch (error) {
    console.error("Error al cargar la base de datos:", error);
  }
}

function renderizarPracticas(practicas) {
  const contenedor = document.getElementById('contenedor-practicas');
  contenedor.innerHTML = practicas.map(p => `
    <div class="card">
      <h3>${p.titulo}</h3>
      <p><strong>Modalidad:</strong> ${p.modalidad}</p>
      <p><strong>Horas:</strong> ${p.horas_acreditadas}hs</p>
      <p>${p.descripcion}</p>
      <span class="badge ${p.estado === 'En curso' ? 'badge-activo' : 'badge-fin'}">${p.estado}</span>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);