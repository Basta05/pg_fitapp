/* ═══════════════════════════════════════════════════════════════
   goals.js — handles goals.html, body_metrics.html,
               body_metrics_form.html, goal_form.html
   ═══════════════════════════════════════════════════════════════ */

/* ── goals.html ─────────────────────────────────────────────── */
async function initGoalsPage() {
  const flash = sessionStorage.getItem('macros_flash');
  if (flash) {
    sessionStorage.removeItem('macros_flash');
    const data = JSON.parse(flash);
    if (data.error) {
      showAlert('Makra nebyla aktualizována — ' + data.error + '. Doplň údaje v Profilu.', 'warning');
    } else {
      showAlert('Nutriční makra byla automaticky aktualizována. Zkontroluj je v sekci Výživa.', 'success');
    }
  }

  const [goals, metrics] = await Promise.all([
    eel.get_goals()(),
    eel.get_body_metrics()(),
  ]);
  renderGoals(goals);
  renderRecentMetrics(metrics.slice(0, 10));
}

function renderGoals(goals) {
  const active   = goals.filter(g => g.is_active);
  const inactive = goals.filter(g => !g.is_active);
  const container = document.getElementById('goalsContainer');

  if (!goals.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-trophy"></i>
        <p>Zatím žádné cíle.</p>
        <a href="goal_form.html" class="btn btn-primary"><i class="bi bi-plus"></i> Přidat cíl</a>
      </div>`;
    return;
  }

  const goalTypeIcon = { lose_weight: 'bi-arrow-down-circle', gain_muscle: 'bi-arrow-up-circle',
    maintain: 'bi-dash-circle', improve_endurance: 'bi-activity', other: 'bi-star' };

  const renderGoalCard = (g, isActive) => `
    <div class="stat-card mb-3 ${isActive ? '' : 'opacity-50'}">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="bi ${goalTypeIcon[g.goal_type] || 'bi-star'} text-primary"></i>
            <h6 class="mb-0">${GOAL_LABELS[g.goal_type] || g.goal_type}</h6>
            ${isActive ? '<span class="badge bg-success">Aktivní</span>' : '<span class="badge bg-secondary">Splněno</span>'}
          </div>
          ${g.description ? `<p class="text-muted small mb-1">${g.description}</p>` : ''}
          <div class="text-muted small">
            ${g.target_weight_kg ? `<span class="me-3"><i class="bi bi-bullseye"></i> Cílová váha: ${g.target_weight_kg} kg</span>` : ''}
            ${g.target_date ? `<span><i class="bi bi-calendar3"></i> Do: ${formatDate(g.target_date)}</span>` : ''}
          </div>
        </div>
        ${isActive ? `<button class="btn btn-outline-success btn-sm" onclick="completeGoal(${g.id})">
          <i class="bi bi-check2"></i> Splněno
        </button>` : ''}
      </div>
    </div>`;

  container.innerHTML = active.map(g => renderGoalCard(g, true)).join('') +
    (inactive.length ? `<hr><p class="text-muted small">Splněné cíle</p>` + inactive.map(g => renderGoalCard(g, false)).join('') : '');
}

function renderRecentMetrics(metrics) {
  const container = document.getElementById('metricsTable');
  if (!metrics.length) {
    container.innerHTML = '<p class="text-muted">Žádné záznamy.</p>';
    return;
  }
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-sm">
        <thead><tr><th>Datum</th><th>Váha</th><th>% tuku</th><th>Pas</th><th>Hrudník</th><th>Bicep</th></tr></thead>
        <tbody>
          ${metrics.map(m => `<tr>
            <td>${formatDate(m.date)}</td>
            <td>${m.weight_kg != null ? m.weight_kg + ' kg' : '—'}</td>
            <td>${m.body_fat_pct != null ? m.body_fat_pct + ' %' : '—'}</td>
            <td>${m.waist_cm != null ? m.waist_cm + ' cm' : '—'}</td>
            <td>${m.chest_cm != null ? m.chest_cm + ' cm' : '—'}</td>
            <td>${m.bicep_cm != null ? m.bicep_cm + ' cm' : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function completeGoal(id) {
  if (!confirm('Označit cíl jako splněný?')) return;
  await eel.complete_goal(id)();
  showAlert('Cíl splněn! 🎉');
  const [goals, metrics] = await Promise.all([eel.get_goals()(), eel.get_body_metrics()()]);
  renderGoals(goals);
  renderRecentMetrics(metrics.slice(0, 10));
}

/* ── body_metrics.html ──────────────────────────────────────── */
async function initBodyMetricsPage() {
  const metrics = await eel.get_body_metrics()();
  const container = document.getElementById('metricsContainer');

  if (!metrics.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-graph-up"></i>
        <p>Zatím žádné záznamy.</p>
        <a href="body_metrics_form.html" class="btn btn-primary"><i class="bi bi-plus"></i> Přidat záznam</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table">
        <thead><tr>
          <th>Datum</th><th>Váha</th><th>% tuku</th><th>Hrudník</th>
          <th>Pas</th><th>Boky</th><th>Bicep</th><th>Stehno</th><th>Poznámka</th>
        </tr></thead>
        <tbody>
          ${metrics.map(m => `<tr>
            <td>${formatDate(m.date)}</td>
            <td>${m.weight_kg ?? '—'}</td>
            <td>${m.body_fat_pct ?? '—'}</td>
            <td>${m.chest_cm ?? '—'}</td>
            <td>${m.waist_cm ?? '—'}</td>
            <td>${m.hips_cm ?? '—'}</td>
            <td>${m.bicep_cm ?? '—'}</td>
            <td>${m.thigh_cm ?? '—'}</td>
            <td class="text-muted small">${m.notes || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ── body_metrics_form.html ─────────────────────────────────── */
function initBodyMetricsForm() {
  document.getElementById('bmDate').value = today();
}

async function submitBodyMetrics(event) {
  event.preventDefault();
  const f = event.target;
  const result = await eel.add_body_metrics(
    f.bmDate.value,
    f.bmWeight.value   || null,
    f.bmFat.value      || null,
    f.bmChest.value    || null,
    f.bmWaist.value    || null,
    f.bmHips.value     || null,
    f.bmBicep.value    || null,
    f.bmThigh.value    || null,
    f.bmNotes.value    || '',
  )();
  if (result?.macros?.error) {
    sessionStorage.setItem('macros_flash', JSON.stringify({ error: result.macros.error }));
  } else if (result?.macros) {
    sessionStorage.setItem('macros_flash', JSON.stringify({ ok: true }));
  }
  window.location.href = 'goals.html';
}

/* ── goal_form.html ─────────────────────────────────────────── */
async function submitGoal(event) {
  event.preventDefault();
  const f = event.target;
  const goal = await eel.add_goal(
    f.goalType.value,
    f.goalDesc.value     || '',
    f.goalWeight.value   || null,
    f.goalDate.value     || null,
  )();
  if (goal?._macros_result?.error) {
    sessionStorage.setItem('macros_flash', JSON.stringify({ error: goal._macros_result.error }));
  } else if (goal?._macros_result) {
    sessionStorage.setItem('macros_flash', JSON.stringify({ ok: true }));
  }
  window.location.href = 'goals.html';
}
