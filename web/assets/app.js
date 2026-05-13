/* ── Shared labels ──────────────────────────────────────────── */
const MUSCLE_LABELS = {
  chest: 'Hrudník', back: 'Záda', shoulders: 'Ramena',
  biceps: 'Biceps', triceps: 'Triceps', legs: 'Nohy',
  glutes: 'Hýždě', abs: 'Břicho', cardio: 'Kardio', full_body: 'Celé tělo',
};
const MEAL_LABELS = {
  breakfast: 'Snídaně', lunch: 'Oběd', dinner: 'Večeře', snack: 'Svačina',
};
const GOAL_LABELS = {
  lose_weight: 'Zhubnout', gain_muscle: 'Nabrat svaly', maintain: 'Udržet váhu',
  improve_endurance: 'Zlepšit kondici', other: 'Jiné',
};
const ACTIVITY_LABELS = {
  sedentary: 'Sedavý', light: 'Lehká aktivita', moderate: 'Střední aktivita',
  active: 'Aktivní', very_active: 'Velmi aktivní',
};
const DIFFICULTY_LABELS = {
  beginner: 'Začátečník', intermediate: 'Pokročilý', advanced: 'Expert',
};

/* ── Sidebar active state ───────────────────────────────────── */
const PAGE_MAP = {
  'dashboard.html':        'dashboard',
  'workouts.html':         'workouts',
  'workout_detail.html':   'workouts',
  'exercise_catalog.html': 'exercises',
  'preset_list.html':      'presets',
  'nutrition.html':        'nutrition',
  'food_log_add.html':     'nutrition',
  'calculator.html':       'calculator',
  'goals.html':            'goals',
  'body_metrics.html':     'body_metrics',
  'body_metrics_form.html':'body_metrics',
  'goal_form.html':        'goals',
  'profile.html':          'profile',
};

function initSidebar() {
  const filename = window.location.pathname.split('/').pop() || 'dashboard.html';
  const activePage = PAGE_MAP[filename];
  document.querySelectorAll('.nav-link-side[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === activePage) {
      link.classList.add('active');
    }
  });
}

/* ── Utilities ──────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function showAlert(msg, type = 'success') {
  const container = document.getElementById('alertContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── Sidebar HTML (injected by each page) ───────────────────── */
function getSidebarHTML() {
  return `
  <nav class="sidebar">
    <div class="sidebar-logo">PG<span>-FitApp</span></div>
    <div class="sidebar-section">Hlavní</div>
    <a href="dashboard.html" class="nav-link-side" data-page="dashboard"><i class="bi bi-house"></i> Přehled</a>
    <div class="sidebar-section">Trénink</div>
    <a href="workouts.html" class="nav-link-side" data-page="workouts"><i class="bi bi-lightning"></i> Tréninky</a>
    <a href="workouts.html?new=1" class="nav-link-side" data-page="workout_new"><i class="bi bi-plus-circle"></i> Nový trénink</a>
    <a href="preset_list.html" class="nav-link-side" data-page="presets"><i class="bi bi-bookmark"></i> Pre-set tréninky</a>
    <a href="exercise_catalog.html" class="nav-link-side" data-page="exercises"><i class="bi bi-book"></i> Katalog cviků</a>
    <div class="sidebar-section">Výživa</div>
    <a href="nutrition.html" class="nav-link-side" data-page="nutrition"><i class="bi bi-egg-fried"></i> Nutriční makra</a>
    <a href="calculator.html" class="nav-link-side" data-page="calculator"><i class="bi bi-calculator"></i> Kalkulačka</a>
    <div class="sidebar-section">Cíle</div>
    <a href="goals.html" class="nav-link-side" data-page="goals"><i class="bi bi-trophy"></i> Cíle & Pokrok</a>
    <a href="body_metrics.html" class="nav-link-side" data-page="body_metrics"><i class="bi bi-graph-up"></i> Tělesné míry</a>
    <div class="sidebar-bottom">
      <a href="profile.html" class="nav-link-side" data-page="profile"><i class="bi bi-person"></i> Profil</a>
    </div>
  </nav>
  <nav class="mobile-nav">
    <a href="dashboard.html"><i class="bi bi-house"></i>Přehled</a>
    <a href="workouts.html"><i class="bi bi-lightning"></i>Trénink</a>
    <a href="nutrition.html"><i class="bi bi-egg-fried"></i>Výživa</a>
    <a href="goals.html"><i class="bi bi-trophy"></i>Cíle</a>
    <a href="profile.html"><i class="bi bi-person"></i>Profil</a>
  </nav>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) {
    sidebarMount.innerHTML = getSidebarHTML();
  }
  initSidebar();
});
