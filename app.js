import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = { cohorts: [], cohortsById: {}, practices: [], editingPracticeId: null, editingCohortId: null };

const ESTADO_META = {
  "Entrevista Realizada": { emoji: "📋", cls: "neutral" },
  "En curso": { emoji: "🚀", cls: "pend" },
  "Finalizado": { emoji: "🏁", cls: "on" },
  "No Finalizada": { emoji: "⚠️", cls: "off" },
  "Bloqueada": { emoji: "❌", cls: "off" },
  "Plan al Copret": { emoji: "⏩", cls: "pend" }
};

function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function banner(msg) {
  document.getElementById("banner").innerHTML = msg ? `<div class="banner">${esc(msg)}</div>` : "";
}
function cohortName(c) { return `${c.specialty || "Sin especialidad"} ${c.year || ""}`; }
function $(id) { return document.getElementById(id); }

// ---------- Auth ----------
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    $("loginScreen").style.display = "none";
    $("app").style.display = "block";
    $("whoEmail").textContent = session.user.email;
    loadAll();
  } else {
    $("loginScreen").style.display = "block";
    $("app").style.display = "none";
  }
});

$("loginBtn").addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  $("loginError").style.display = "none";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) $("loginError").style.display = "block";
});
$("logoutBtn").addEventListener("click", () => supabase.auth.signOut());

// ---------- Tabs ----------
$("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (!btn) return;
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + btn.dataset.view).classList.add("active");
  if (btn.dataset.view === "resumen") renderSummary();
});

// ---------- Load & realtime ----------
async function loadAll() {
  await Promise.all([loadCohorts(), loadPractices()]);
  supabase.channel("cohortes-changes").on("postgres_changes", { event: "*", schema: "public", table: "cohortes" }, loadCohorts).subscribe();
  supabase.channel("practicas-changes").on("postgres_changes", { event: "*", schema: "public", table: "practicas" }, loadPractices).subscribe();
}

async function loadCohorts() {
  const { data, error } = await supabase.from("cohortes").select("*").order("year", { ascending: false });
  if (error) { banner("Error al leer cohortes: " + error.message); return; }
  state.cohorts = data || [];
  state.cohortsById = {};
  state.cohorts.forEach(c => (state.cohortsById[c.id] = c));
  renderCohorts();
  populateCohortSelects();
  renderPractices();
}

async function loadPractices() {
  const { data, error } = await supabase.from("practicas").select("*").order("alumno");
  if (error) { banner("Error al leer prácticas: " + error.message); return; }
  state.practices = data || [];
  renderPractices();
  renderCohorts();
}

// ---------- Cohortes ----------
function populateCohortSelects() {
  const opts = state.cohorts.map(c => `<option value="${c.id}">${esc(cohortName(c))}</option>`).join("");
  const filterSel = $("practiceCohortFilter");
  const cur = filterSel.value;
  filterSel.innerHTML = '<option value="">Todas</option>' + opts;
  if (state.cohortsById[cur]) filterSel.value = cur;
  $("pCohort").innerHTML = opts || '<option value="">Creá una cohorte primero</option>';
}

function renderCohorts() {
  const tbody = $("cohortsTbody");
  $("cohortsEmpty").style.display = state.cohorts.length ? "none" : "block";
  tbody.innerHTML = state.cohorts.map(c => {
    const count = state.practices.filter(p => p.cohort_id === c.id).length;
    return `<tr><td>${esc(cohortName(c))}</td><td>${esc(c.specialty || "—")}</td><td>${esc(c.year || "—")}</td>
      <td>${c.horas_objetivo ?? "—"}</td><td>${count}</td>
      <td style="white-space:nowrap;"><button class="btn secondary small" data-editcohort="${c.id}">Editar</button>
      <button class="btn danger" data-delcohort="${c.id}">Eliminar</button></td></tr>`;
  }).join("");
}
$("cohortsTbody").addEventListener("click", (e) => {
  const editId = e.target.dataset.editcohort;
  const delId = e.target.dataset.delcohort;
  if (editId) openCohortModal(editId);
  if (delId && confirm("¿Eliminar esta cohorte?")) {
    supabase.from("cohortes").delete().eq("id", delId).then(({ error }) => {
      if (error) toast("Error: " + error.message); else toast("Cohorte eliminada");
    });
  }
});
function openCohortModal(id) {
  state.editingCohortId = id || null;
  const c = id ? state.cohortsById[id] : {};
  $("cohortModalTitle").textContent = id ? "Editar cohorte" : "Nueva cohorte";
  $("cSpecialty").value = c.specialty || "";
  $("cYear").value = c.year || new Date().getFullYear();
  $("cHorasObjetivo").value = c.horas_objetivo ?? 200;
  $("cohortModalBg").classList.add("show");
}
$("newCohortBtn").addEventListener("click", () => openCohortModal(null));
$("cohortCancelBtn").addEventListener("click", () => $("cohortModalBg").classList.remove("show"));
$("cohortSaveBtn").addEventListener("click", async () => {
  const specialty = $("cSpecialty").value.trim();
  const year = Number($("cYear").value) || null;
  if (!specialty || !year) { toast("Completá especialidad y año"); return; }
  const data = { specialty, year, horas_objetivo: Number($("cHorasObjetivo").value) || 0 };
  const q = state.editingCohortId
    ? supabase.from("cohortes").update(data).eq("id", state.editingCohortId)
    : supabase.from("cohortes").insert(data);
  const { error } = await q;
  if (error) { toast("Error: " + error.message); return; }
  toast("Cohorte guardada");
  $("cohortModalBg").classList.remove("show");
});

// ---------- Practicas ----------
function hoursBarHtml(realizadas, objetivo) {
  const r = Number(realizadas) || 0, o = Number(objetivo) || 0;
  const pct = o > 0 ? Math.min(100, Math.round((r / o) * 100)) : 0;
  const full = o > 0 && r >= o;
  return `<div class="hoursbar${full ? " full" : ""}"><div class="track"><div class="fill" style="width:${pct}%"></div></div>
    <div class="lbl">${r}${o ? " / " + o : ""} hs</div></div>`;
}

function renderPractices() {
  const q = $("practiceSearch").value.trim().toLowerCase();
  const cohortF = $("practiceCohortFilter").value;
  const statusF = $("practiceStatusFilter").value;
  const list = state.practices.filter(p => {
    if (q && !(p.alumno || "").toLowerCase().includes(q)) return false;
    if (cohortF && p.cohort_id !== cohortF) return false;
    if (statusF && p.estado !== statusF) return false;
    return true;
  });
  const tbody = $("practicesTbody");
  $("practicesEmpty").style.display = list.length ? "none" : "block";
  tbody.innerHTML = list.map(p => {
    const c = state.cohortsById[p.cohort_id];
    const meta = ESTADO_META[p.estado] || { emoji: "", cls: "neutral" };
    return `<tr>
      <td>${esc(p.alumno || "—")}</td>
      <td class="muted">${esc(c ? cohortName(c) : "—")}</td>
      <td>${esc(p.oferente || "—")}</td>
      <td>${esc(p.rotacion || "—")}</td>
      <td><span class="tag ${meta.cls}">${meta.emoji} ${esc(p.estado || "—")}</span></td>
      <td>${hoursBarHtml(p.horas_realizadas, p.horas_objetivo)}</td>
      <td class="muted">${esc(p.fecha_fin || "—")}</td>
      <td style="white-space:nowrap;">
        <button class="btn secondary small" data-edit="${p.id}">Editar</button>
        <button class="btn danger" data-del="${p.id}">Eliminar</button>
      </td></tr>`;
  }).join("");
}
["practiceSearch", "practiceCohortFilter", "practiceStatusFilter"].forEach(id => {
  $(id).addEventListener("input", renderPractices);
  $(id).addEventListener("change", renderPractices);
});

$("practicesTbody").addEventListener("click", (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.del;
  if (editId) openPracticeModal(editId);
  if (delId && confirm("¿Eliminar esta práctica?")) {
    supabase.from("practicas").delete().eq("id", delId).then(({ error }) => {
      if (error) toast("Error: " + error.message); else toast("Práctica eliminada");
    });
  }
});

function openPracticeModal(id) {
  state.editingPracticeId = id || null;
  const p = id ? state.practices.find(x => x.id === id) || {} : {};
  $("practiceModalTitle").textContent = id ? "Editar práctica" : "Nueva práctica";
  $("pAlumno").value = p.alumno || "";
  $("pDni").value = p.dni || "";
  $("pCelular").value = p.celular || "";
  $("pEmail").value = p.email || "";
  $("pCohort").value = p.cohort_id || (state.cohorts[0] ? state.cohorts[0].id : "");
  $("pOferente").value = p.oferente || "";
  $("pRotacion").value = p.rotacion || "Primera";
  $("pEstado").value = p.estado || "Entrevista Realizada";
  $("pFechaInicio").value = p.fecha_inicio || "";
  $("pFechaFin").value = p.fecha_fin || "";
  $("pEntrada").value = p.entrada || "";
  $("pSalida").value = p.salida || "";
  $("pTurno").value = p.turno || "Mañana";
  $("pDias").value = p.dias || "";
  $("pHorasRealizadas").value = p.horas_realizadas ?? 0;
  const defaultObjetivo = (state.cohortsById[p.cohort_id] || {}).horas_objetivo;
  $("pHorasObjetivo").value = p.horas_objetivo ?? (defaultObjetivo ?? 200);
  $("pCalificacion").value = p.calificacion || "";
  $("pAutorizacion").value = p.autorizacion === false ? "false" : "true";
  $("pEncuesta").value = p.encuesta_final ? "true" : "false";
  $("pDisposiciones").value = p.disposiciones || "";
  $("pNotas").value = p.notas || "";
  $("practiceModalBg").classList.add("show");
}
$("newPracticeBtn").addEventListener("click", () => {
  if (!state.cohorts.length) { toast("Creá primero una cohorte"); return; }
  openPracticeModal(null);
});
$("practiceCancelBtn").addEventListener("click", () => $("practiceModalBg").classList.remove("show"));
$("pCohort").addEventListener("change", function () {
  if (state.editingPracticeId) return;
  const c = state.cohortsById[this.value];
  if (c && c.horas_objetivo != null) $("pHorasObjetivo").value = c.horas_objetivo;
});

$("practiceSaveBtn").addEventListener("click", async () => {
  const alumno = $("pAlumno").value.trim();
  const cohort_id = $("pCohort").value;
  if (!alumno) { toast("El nombre del alumno es obligatorio"); return; }
  if (!cohort_id) { toast("Elegí una cohorte"); return; }
  const data = {
    alumno, cohort_id,
    dni: $("pDni").value.trim(),
    celular: $("pCelular").value.trim(),
    email: $("pEmail").value.trim(),
    oferente: $("pOferente").value.trim(),
    rotacion: $("pRotacion").value,
    estado: $("pEstado").value,
    fecha_inicio: $("pFechaInicio").value || null,
    fecha_fin: $("pFechaFin").value || null,
    entrada: $("pEntrada").value || null,
    salida: $("pSalida").value || null,
    turno: $("pTurno").value,
    dias: $("pDias").value.trim(),
    horas_realizadas: Number($("pHorasRealizadas").value) || 0,
    horas_objetivo: Number($("pHorasObjetivo").value) || 0,
    calificacion: $("pCalificacion").value.trim(),
    autorizacion: $("pAutorizacion").value === "true",
    encuesta_final: $("pEncuesta").value === "true",
    disposiciones: $("pDisposiciones").value.trim(),
    notas: $("pNotas").value.trim(),
    updated_at: new Date().toISOString()
  };
  const q = state.editingPracticeId
    ? supabase.from("practicas").update(data).eq("id", state.editingPracticeId)
    : supabase.from("practicas").insert(data);
  const { error } = await q;
  if (error) { toast("Error: " + error.message); return; }
  toast("Práctica guardada");
  $("practiceModalBg").classList.remove("show");
});

$("exportCsvBtn").addEventListener("click", () => {
  const rows = [["Alumno", "DNI", "Cohorte", "Oferente", "Rotación", "Estado", "Horas realizadas", "Horas objetivo", "Fecha inicio", "Fecha fin", "Calificación"]];
  state.practices.forEach(p => {
    const c = state.cohortsById[p.cohort_id];
    rows.push([p.alumno || "", p.dni || "", c ? cohortName(c) : "", p.oferente || "", p.rotacion || "", p.estado || "",
      p.horas_realizadas || 0, p.horas_objetivo || 0, p.fecha_inicio || "", p.fecha_fin || "", p.calificacion || ""]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "practicas.csv";
  a.click();
});

// ---------- Resumen ----------
function renderSummary() {
  const total = state.practices.length;
  const counts = {};
  let horas = 0;
  state.practices.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; horas += Number(p.horas_realizadas) || 0; });
  $("sumTotal").textContent = total;
  $("sumEnCurso").textContent = counts["En curso"] || 0;
  $("sumFinalizado").textContent = counts["Finalizado"] || 0;
  $("sumBloqueada").textContent = (counts["Bloqueada"] || 0) + (counts["No Finalizada"] || 0);
  $("sumHoras").textContent = horas.toLocaleString("es-AR");
  $("sumHorasProm").textContent = total ? Math.round(horas / total) : 0;

  const tbody = $("cohortSummaryTbody");
  $("cohortSummaryEmpty").style.display = state.cohorts.length ? "none" : "block";
  tbody.innerHTML = state.cohorts.map(c => {
    const list = state.practices.filter(p => p.cohort_id === c.id);
    const enCurso = list.filter(p => p.estado === "En curso").length;
    const fin = list.filter(p => p.estado === "Finalizado").length;
    const h = list.reduce((sum, p) => sum + (Number(p.horas_realizadas) || 0), 0);
    return `<tr><td>${esc(cohortName(c))}</td><td>${list.length}</td><td>${enCurso}</td><td>${fin}</td><td>${h.toLocaleString("es-AR")}</td></tr>`;
  }).join("");
}
