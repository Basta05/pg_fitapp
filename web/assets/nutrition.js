/* ═══════════════════════════════════════════════════════════════
   nutrition.js — handles nutrition.html, food_log_add.html
   ═══════════════════════════════════════════════════════════════ */

/* ── nutrition.html ─────────────────────────────────────────── */
async function initNutritionPage() {
  const dateInput = document.getElementById('dateInput');
  dateInput.value = today();
  dateInput.addEventListener('change', () => loadNutritionData(dateInput.value));
  await loadNutritionData(dateInput.value);
}

async function loadNutritionData(dateStr) {
  const [logs, goal] = await Promise.all([
    eel.get_food_log(dateStr)(),
    eel.get_nutrition_goal()(),
  ]);

  // Totals
  const totals = logs.reduce((acc, l) => {
    acc.calories += l.calories;
    acc.protein  += l.protein;
    acc.carbs    += l.carbs;
    acc.fat      += l.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  renderMacroCards(totals, goal);
  renderFoodLog(logs, dateStr);
  renderGoalForm(goal);
}

function renderMacroCards(totals, goal) {
  const cards = [
    { key: 'calories', label: 'Kalorie',  unit: 'kcal', icon: 'bi-fire' },
    { key: 'protein',  label: 'Bílkoviny',unit: 'g',    icon: 'bi-egg-fried' },
    { key: 'carbs',    label: 'Sacharidy', unit: 'g',    icon: 'bi-lightning' },
    { key: 'fat',      label: 'Tuky',      unit: 'g',    icon: 'bi-droplet' },
  ];
  const container = document.getElementById('macroCards');
  container.innerHTML = cards.map(c => {
    const val  = Math.round(totals[c.key]);
    const tgt  = goal[`daily_${c.key}`] || 1;
    const pct  = Math.min(100, Math.round((val / tgt) * 100));
    const over = val > tgt;
    return `
      <div class="col-md-3 col-6">
        <div class="stat-card">
          <div class="d-flex align-items-center gap-2 mb-2">
            <i class="bi ${c.icon} text-muted"></i>
            <span class="stat-label">${c.label}</span>
          </div>
          <div class="stat-value">${val}<small class="fs-6 fw-normal text-muted"> ${c.unit}</small></div>
          <div class="text-muted small mb-2">Cíl: ${tgt} ${c.unit}</div>
          <div class="progress" style="height:6px">
            <div class="progress-bar ${over ? 'bg-danger' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="text-end text-muted small mt-1">${pct}%</div>
        </div>
      </div>`;
  }).join('');
}

function renderFoodLog(logs, dateStr) {
  const container = document.getElementById('foodLogContainer');
  if (!logs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-egg-fried"></i>
        <p>Pro tento den nejsou záznamy.</p>
        <a href="food_log_add.html?date=${dateStr}" class="btn btn-primary"><i class="bi bi-plus"></i> Přidat jídlo</a>
      </div>`;
    return;
  }

  const byMeal = {};
  logs.forEach(l => {
    if (!byMeal[l.meal_type]) byMeal[l.meal_type] = [];
    byMeal[l.meal_type].push(l);
  });

  const order = ['breakfast', 'lunch', 'dinner', 'snack'];
  container.innerHTML = order.filter(m => byMeal[m]).map(meal => `
    <div class="stat-card mb-3">
      <h6 class="mb-3"><i class="bi bi-clock"></i> ${MEAL_LABELS[meal]}</h6>
      <table class="table table-sm mb-0">
        <thead><tr><th>Potravina</th><th>Množství</th><th>Kcal</th><th>B</th><th>S</th><th>T</th><th></th></tr></thead>
        <tbody>
          ${byMeal[meal].map(l => `
            <tr>
              <td>${l.food_name}</td>
              <td class="text-muted">${l.amount_grams} g</td>
              <td>${l.calories}</td>
              <td class="text-muted">${l.protein} g</td>
              <td class="text-muted">${l.carbs} g</td>
              <td class="text-muted">${l.fat} g</td>
              <td><button class="btn btn-outline-danger btn-sm" onclick="deleteFoodLog(${l.id})">
                <i class="bi bi-x-lg"></i></button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');
}

function renderGoalForm(goal) {
  const form = document.getElementById('goalForm');
  if (!form) return;
  form.querySelector('#gCalories').value = goal.daily_calories;
  form.querySelector('#gProtein').value  = goal.daily_protein;
  form.querySelector('#gCarbs').value    = goal.daily_carbs;
  form.querySelector('#gFat').value      = goal.daily_fat;
}

async function deleteFoodLog(id) {
  if (!confirm('Smazat záznam?')) return;
  await eel.delete_food_log(id)();
  const dateStr = document.getElementById('dateInput').value;
  await loadNutritionData(dateStr);
}

async function submitGoalForm(event) {
  event.preventDefault();
  const cal  = document.getElementById('gCalories').value;
  const prot = document.getElementById('gProtein').value;
  const carb = document.getElementById('gCarbs').value;
  const fat  = document.getElementById('gFat').value;
  await eel.set_nutrition_goal(cal, prot, carb, fat)();
  bootstrap.Modal.getInstance(document.getElementById('goalModal'))?.hide();
  showAlert('Cíle uloženy.');
  const dateStr = document.getElementById('dateInput').value;
  await loadNutritionData(dateStr);
}

/* ── food_log_add.html ──────────────────────────────────────── */
let _selectedFood = null;

async function initFoodLogAddPage() {
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get('date') || today();
  document.getElementById('addDate').value = dateParam;

  const allItems = await eel.get_food_items()();
  renderFoodItems(allItems);

  document.getElementById('foodSearch').addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    const items = await eel.get_food_items(q || null)();
    renderFoodItems(items);
  });
}

function renderFoodItems(items) {
  const container = document.getElementById('foodItemList');
  container.innerHTML = items.map(item => `
    <div class="stat-card mb-2 d-flex justify-content-between align-items-center" style="cursor:pointer"
         onclick="selectFood(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.calories_per_100g})">
      <div>
        <strong>${item.name}</strong>
        <span class="text-muted small ms-2">${item.calories_per_100g} kcal / 100g</span>
        <span class="text-muted small ms-2">B: ${item.protein_per_100g}g  S: ${item.carbs_per_100g}g  T: ${item.fat_per_100g}g</span>
      </div>
      <i class="bi bi-plus-circle text-primary fs-5"></i>
    </div>`).join('') || '<p class="text-muted">Nic nenalezeno.</p>';
}

function selectFood(id, name, kcal) {
  _selectedFood = id;
  document.getElementById('selectedFoodName').textContent = name;
  document.getElementById('selectedFoodKcal').textContent = `${kcal} kcal / 100 g`;
  document.getElementById('addForm').style.display = 'block';
  document.getElementById('addForm').scrollIntoView({ behavior: 'smooth' });
}

async function submitAddFood(event) {
  event.preventDefault();
  if (!_selectedFood) return;
  const date     = document.getElementById('addDate').value;
  const meal     = document.getElementById('addMeal').value;
  const amount   = document.getElementById('addAmount').value;
  await eel.add_food_log(_selectedFood, date, meal, amount)();
  window.location.href = `nutrition.html`;
}
