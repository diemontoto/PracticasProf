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
// script.js
document.addEventListener("DOMContentLoaded", () => {
  // Ruta relativa al archivo db.json dentro de tu repositorio
  const DB_URL = "./data/db.json";

  fetch(DB_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Base de datos cargada con éxito:", data);
      
      // Llamadas a las funciones de renderizado
      renderizarPracticas(data.practicas);
      renderizarDocumentos(data.normativa_documentos);
    })
    .catch(error => {
      console.error("Error al vincular la base de datos:", error);
    });
});

// Función para inyectar las prácticas en el HTML
function renderizarPracticas(practicas) {
  const contenedor = document.getElementById("lista-practicas");
  if (!contenedor) return;

  contenedor.innerHTML = practicas.map(p => `
    <article class="tarjeta-practica">
      <h3>${p.titulo}</h3>
      <p><strong>Código:</strong> ${p.codigo_mmo}</p>
      <p><strong>Modalidad:</strong> ${p.modalidad}</p>
      <p><strong>Carga Horaria:</strong> ${p.horas_acreditadas} hs</p>
      <p>${p.descripcion}</p>
      <span class="estado ${p.estado === 'En curso' ? 'en-curso' : 'finalizado'}">
        ${p.estado}
      </span>
    </article>
  `).join("");
}
