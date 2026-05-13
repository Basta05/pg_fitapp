/* ═══════════════════════════════════════════════════════════════
   workouts.js — handles workouts.html, workout_detail.html,
                  exercise_catalog.html, preset_list.html
   ═══════════════════════════════════════════════════════════════ */

/* ── workouts.html ─────────────────────────────────────────── */
async function initWorkoutsPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('new') === '1') {
    const modal = new bootstrap.Modal(document.getElementById('newWorkoutModal'));
    modal.show();
  }
  await loadWorkoutList();
}

async function loadWorkoutList() {
  const workouts = await eel.get_workouts()();
  const container = document.getElementById('workoutList');
  if (!container) return;

  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-lightning"></i>
        <p>Zatím žádné tréninky. Přidej první!</p>
        <button class="btn btn-primary" onclick="document.getElementById('newWorkoutModal') && new bootstrap.Modal(document.getElementById('newWorkoutModal')).show()">
          <i class="bi bi-plus"></i> Nový trénink
        </button>
      </div>`;
    return;
  }

  container.innerHTML = workouts.map(w => `
    <div class="stat-card mb-3 d-flex justify-content-between align-items-start">
      <div>
        <h5 class="mb-1">
          <a href="workout_detail.html?id=${w.id}" class="text-decoration-none text-dark">${w.name}</a>
        </h5>
        <div class="text-muted small">
          <i class="bi bi-calendar3"></i> ${formatDate(w.date)}
          ${w.workout_type === 'preset' ? '<span class="badge-muscle ms-2">Preset</span>' : ''}
          <span class="ms-2"><i class="bi bi-activity"></i> ${(w.exercises || []).length} cviků</span>
        </div>
        ${w.notes ? `<p class="text-muted small mt-1 mb-0">${w.notes}</p>` : ''}
      </div>
      <div class="d-flex gap-2">
        <a href="workout_detail.html?id=${w.id}" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-eye"></i>
        </a>
        <button class="btn btn-outline-danger btn-sm" onclick="confirmDeleteWorkout(${w.id}, '${w.name.replace(/'/g, "\\'")}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

async function submitNewWorkout(event) {
  event.preventDefault();
  const name = document.getElementById('wName').value.trim();
  const date = document.getElementById('wDate').value;
  const notes = document.getElementById('wNotes').value.trim();
  if (!name || !date) return;
  const workout = await eel.create_workout(name, date, notes)();
  window.location.href = `workout_detail.html?id=${workout.id}`;
}

async function confirmDeleteWorkout(id, name) {
  if (!confirm(`Smazat trénink "${name}"?`)) return;
  await eel.delete_workout(id)();
  await loadWorkoutList();
  showAlert('Trénink smazán.');
}

/* ── workout_detail.html ────────────────────────────────────── */
let _workout = null;

async function initDetailPage() {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  if (!id) { window.location.href = 'workouts.html'; return; }

  const [workout, exercises] = await Promise.all([
    eel.get_workout(id)(),
    eel.get_exercises()(),
  ]);
  if (!workout) { window.location.href = 'workouts.html'; return; }

  _workout = workout;
  renderDetailHeader();
  renderExercises();
  populateExerciseDropdown(exercises);
}

function renderDetailHeader() {
  document.getElementById('dWorkoutName').textContent = _workout.name;
  document.getElementById('dWorkoutDate').textContent = formatDate(_workout.date);
  document.getElementById('dWorkoutNotes').textContent = _workout.notes || '—';
  document.getElementById('dExerciseCount').textContent = (_workout.exercises || []).length;
  document.getElementById('deleteWorkoutBtn').onclick = () => confirmDeleteFromDetail(_workout.id, _workout.name);
}

async function confirmDeleteFromDetail(id, name) {
  if (!confirm(`Smazat trénink "${name}"?`)) return;
  await eel.delete_workout(id)();
  window.location.href = 'workouts.html';
}

function renderExercises() {
  const container = document.getElementById('exercisesContainer');
  const exs = (_workout.exercises || []).sort((a, b) => a.order - b.order);

  if (!exs.length) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-activity"></i><p>Žádné cviky. Přidej první cvik níže.</p></div>`;
    return;
  }

  container.innerHTML = exs.map(we => {
    const ex = we.exercise || {};
    return `
      <div class="stat-card mb-3" id="we-${we.id}">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 class="mb-1">${ex.name || 'Neznámý cvik'}</h5>
            <span class="badge-muscle">${MUSCLE_LABELS[ex.muscle_group] || ex.muscle_group || ''}</span>
          </div>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteExercise(${we.id})">
            <i class="bi bi-trash"></i> Odebrat
          </button>
        </div>
        <div id="sets-${we.id}">${renderSetsTable(we)}</div>
        <form class="d-flex gap-2 align-items-end mt-3 flex-wrap" onsubmit="submitAddSet(event, ${we.id})">
          <div>
            <label class="form-label small mb-1">Opakování</label>
            <input type="number" class="form-control form-control-sm" id="reps-${we.id}" min="1" placeholder="12" style="width:90px">
          </div>
          <div>
            <label class="form-label small mb-1">Váha (kg)</label>
            <input type="number" class="form-control form-control-sm" id="weight-${we.id}" step="0.5" min="0" placeholder="60" style="width:100px">
          </div>
          <button type="submit" class="btn btn-primary btn-sm"><i class="bi bi-plus"></i> Přidat sérii</button>
        </form>
      </div>`;
  }).join('');
}

function renderSetsTable(we) {
  if (!we.sets || !we.sets.length) {
    return '<p class="text-muted small mb-0">Žádné série.</p>';
  }
  return `
    <table class="table table-sm mb-0">
      <thead><tr><th>#</th><th>Opakování</th><th>Váha (kg)</th><th></th></tr></thead>
      <tbody>
        ${we.sets.map(s => `
          <tr id="set-row-${s.id}">
            <td class="text-muted">${s.set_number}</td>
            <td><input type="number" class="form-control form-control-sm" value="${s.reps ?? ''}"
                       min="1" style="width:75px"
                       onblur="saveSet(${_workout.id}, ${we.id}, ${s.id}, this.value, document.getElementById('w-${s.id}').value)"></td>
            <td><input type="number" id="w-${s.id}" class="form-control form-control-sm" value="${s.weight_kg ?? ''}"
                       step="0.5" min="0" style="width:85px"
                       onblur="saveSet(${_workout.id}, ${we.id}, ${s.id}, document.querySelector('#set-row-${s.id} input:first-of-type').value, this.value)"></td>
            <td><button class="btn btn-outline-danger btn-sm" onclick="deleteSet(${we.id}, ${s.id})">
              <i class="bi bi-x-lg"></i></button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function submitAddSet(event, weId) {
  event.preventDefault();
  const reps   = document.getElementById(`reps-${weId}`).value;
  const weight = document.getElementById(`weight-${weId}`).value;
  const newSet = await eel.add_set(_workout.id, weId, reps || null, weight || null)();
  if (!newSet) return;
  const we = _workout.exercises.find(e => e.id === weId);
  if (we) {
    we.sets.push(newSet);
    document.getElementById(`sets-${weId}`).innerHTML = renderSetsTable(we);
    document.getElementById(`reps-${weId}`).value = '';
    document.getElementById(`weight-${weId}`).value = '';
    document.getElementById('dExerciseCount').textContent = (_workout.exercises || []).length;
  }
}

async function saveSet(workoutId, weId, setId, reps, weight) {
  await eel.edit_set(workoutId, weId, setId, reps || null, weight || null)();
}

async function deleteSet(weId, setId) {
  if (!confirm('Smazat sérii?')) return;
  await eel.delete_set(_workout.id, weId, setId)();
  const we = _workout.exercises.find(e => e.id === weId);
  if (we) {
    we.sets = we.sets.filter(s => s.id !== setId);
    we.sets.forEach((s, i) => s.set_number = i + 1);
    document.getElementById(`sets-${weId}`).innerHTML = renderSetsTable(we);
  }
}

async function deleteExercise(weId) {
  if (!confirm('Odebrat cvik z tréninku?')) return;
  await eel.delete_exercise_from_workout(_workout.id, weId)();
  _workout.exercises = _workout.exercises.filter(e => e.id !== weId);
  document.getElementById(`we-${weId}`).remove();
  document.getElementById('dExerciseCount').textContent = (_workout.exercises || []).length;
  if (!_workout.exercises.length) renderExercises();
}

async function submitAddExercise(event) {
  event.preventDefault();
  const sel = document.getElementById('exerciseSelect');
  const exId = parseInt(sel.value);
  if (!exId) return;
  const we = await eel.add_exercise_to_workout(_workout.id, exId)();
  if (!we) return;
  _workout.exercises.push(we);
  sel.value = '';
  renderExercises();
  document.getElementById('dExerciseCount').textContent = (_workout.exercises || []).length;
  showAlert('Cvik přidán.');
}

function populateExerciseDropdown(exercises) {
  const sel = document.getElementById('exerciseSelect');
  if (!sel) return;
  const groups = {};
  exercises.forEach(e => {
    if (!groups[e.muscle_group]) groups[e.muscle_group] = [];
    groups[e.muscle_group].push(e);
  });
  sel.innerHTML = '<option value="">— Vyber cvik —</option>';
  Object.entries(groups).forEach(([group, exs]) => {
    const og = document.createElement('optgroup');
    og.label = MUSCLE_LABELS[group] || group;
    exs.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.name;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

/* ── exercise_catalog.html ──────────────────────────────────── */
let _allExercises = [];

async function initCatalogPage() {
  _allExercises = await eel.get_exercises()();
  renderCatalog('');
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.add('btn-outline-primary'));
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-outline-primary');
      renderCatalog(btn.dataset.group);
    });
  });
}

function renderCatalog(group) {
  const filtered = group ? _allExercises.filter(e => e.muscle_group === group) : _allExercises;
  const container = document.getElementById('catalogGrid');
  container.innerHTML = filtered.map(e => `
    <div class="col-md-4 col-sm-6">
      <div class="stat-card h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="mb-0">${e.name}</h6>
          <span class="badge-muscle">${MUSCLE_LABELS[e.muscle_group] || e.muscle_group}</span>
        </div>
        <p class="text-muted small mb-0">${e.description}</p>
      </div>
    </div>`).join('');
}

/* ── preset_list.html ───────────────────────────────────────── */
async function initPresetsPage() {
  const presets = await eel.get_presets()();
  const container = document.getElementById('presetList');

  const diffColor = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

  container.innerHTML = presets.map(p => `
    <div class="col-md-4">
      <div class="stat-card h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="mb-0">${p.name}</h5>
          <span class="badge bg-${diffColor[p.difficulty] || 'secondary'}">${DIFFICULTY_LABELS[p.difficulty] || p.difficulty}</span>
        </div>
        <p class="text-muted small">${p.description}</p>
        <div class="mb-3">
          <span class="badge-muscle">${MUSCLE_LABELS[p.muscle_focus] || p.muscle_focus}</span>
        </div>
        <ul class="list-unstyled small text-muted mb-3">
          ${(p.exercises_detail || []).map(e => `<li><i class="bi bi-check2"></i> ${e.name || '—'}</li>`).join('')}
        </ul>
        <div class="mt-auto">
          <button class="btn btn-primary w-100" onclick="startPreset(${p.id})">
            <i class="bi bi-play-fill"></i> Zahájit trénink
          </button>
        </div>
      </div>
    </div>`).join('');
}

async function startPreset(presetId) {
  const workout = await eel.start_preset(presetId)();
  if (workout) window.location.href = `workout_detail.html?id=${workout.id}`;
}
