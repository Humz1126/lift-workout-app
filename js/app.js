/* ============================================================
   STATE & STORAGE
   ============================================================ */
const STORAGE_KEY = 'lift.v1';
const ACTIVE_WORKOUT_KEY = 'lift.activeWorkout.v1';

const DEFAULT_STATE = {
  routines: [], // [{ id, name, day, tag, notes, exercises: [{id, name, sets, repLow, repHigh, notes}] }]
  workouts: [], // [{ id, routineId, routineName, date, exercises: [{exerciseId, name, sets:[{weight, reps, completed}], rpe, knee, notes}] }]
  bodyweight: [], // [{date, weight}]
  meta: { created: null }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_STATE, parsed);
  } catch (e) {
    console.error('Bad state, reseeding', e);
    return seedState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveActiveWorkoutDraft() {
  if (!activeWorkout) {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    return;
  }

  const draft = {
    ...activeWorkout,
    savedAt: Date.now()
  };

  localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(draft));
}

function loadActiveWorkoutDraft() {
  try {
    const raw = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw);
    if (!draft || !draft.routineId || !Array.isArray(draft.exercises)) {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      return null;
    }

    return draft;
  } catch (e) {
    console.error('Bad active workout draft', e);
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    return null;
  }
}

function clearActiveWorkoutDraft() {
  localStorage.removeItem(ACTIVE_WORKOUT_KEY);
}


function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function seedState() {
  const s = JSON.parse(JSON.stringify(DEFAULT_STATE));
  s.meta.created = Date.now();

  // Pre-seed your plan
  const seeds = [
    { name: 'Push A', day: 'Mon', tag: 'Push', notes: 'Chest, shoulders, triceps. 60–90 sec rest.', exercises: [
      ['Machine chest press', 3, 10, 12, 'Main chest movement, learn the pattern'],
      ['Seated DB shoulder press', 3, 10, 12, 'Keep core tight'],
      ['Incline DB press', 3, 10, 12, 'Upper chest'],
      ['Cable lateral raise', 3, 12, 15, 'Don\'t ego lift'],
      ['Tricep rope pushdown', 3, 12, 15, ''],
      ['Overhead tricep extension', 2, 12, 15, 'Finisher'],
    ]},
    { name: 'Pull A', day: 'Tue', tag: 'Pull', notes: 'Back, biceps, rear delts.', exercises: [
      ['Lat pulldown (wide grip)', 3, 10, 12, 'Drive elbows down'],
      ['Chest-supported row', 3, 10, 12, 'Squeeze shoulder blades'],
      ['Single-arm DB row', 3, 10, 10, '10/side'],
      ['Face pulls (cable)', 3, 15, 15, 'Rear delts + posture'],
      ['DB bicep curl', 3, 10, 12, ''],
      ['Hammer curl', 2, 12, 12, 'Brachialis'],
    ]},
    { name: 'Legs A', day: 'Wed', tag: 'Legs (Quad)', notes: 'KNEE PRIORITY. Slow eccentrics. Stop on joint pain.', exercises: [
      ['Leg extension', 3, 15, 15, 'Slow eccentric. Quad activation.'],
      ['Leg press (feet high, narrow)', 4, 10, 12, 'Don\'t go past 90° in weeks 1-2'],
      ['Step-ups (low box)', 3, 10, 12, '10/side, controlled'],
      ['Reverse lunge (DBs)', 3, 8, 8, '8/side. Less knee stress than fwd lunge'],
      ['Standing calf raise', 3, 12, 15, 'Loaded — use machine'],
      ['Plank', 3, 30, 45, 'Log seconds in weight column'],
      ['Dead bug', 3, 10, 12, '10/side. Anti-extension core'],
    ]},
    { name: 'Push B', day: 'Thu', tag: 'Push', notes: 'Variation day — emphasize free weights.', exercises: [
      ['DB bench press (flat)', 3, 10, 12, 'Practice the pattern'],
      ['Machine shoulder press', 3, 10, 12, 'Different angle'],
      ['Cable chest fly', 3, 12, 15, ''],
      ['DB lateral raise', 3, 12, 15, ''],
      ['Close-grip push-up', 3, 8, 12, 'Knees if needed'],
      ['Cable tricep kickback', 2, 12, 12, ''],
    ]},
    { name: 'Pull B', day: 'Sat', tag: 'Pull', notes: 'Variation day.', exercises: [
      ['Neutral-grip pulldown', 3, 10, 12, 'Easier on shoulders'],
      ['Seated cable row', 3, 10, 12, 'Pause and squeeze'],
      ['Machine reverse fly', 3, 12, 15, 'Rear delts'],
      ['Shrugs (DB)', 3, 12, 12, 'Traps'],
      ['Cable bicep curl', 3, 12, 12, ''],
      ['Hanging knee raise', 3, 10, 12, 'Abs — don\'t ego'],
    ]},
    { name: 'Legs B', day: 'Sun', tag: 'Legs (Posterior)', notes: 'Hamstrings, glutes — lighter on knee than Wed.', exercises: [
      ['Romanian deadlift (DBs)', 3, 10, 12, 'Hinge, not squat'],
      ['Lying or seated leg curl', 4, 10, 12, 'Direct hamstring'],
      ['Hip thrust', 3, 10, 12, 'Squeeze hard at top'],
      ['Cable pull-through', 3, 12, 12, 'Hip hinge practice'],
      ['Standing calf raise', 3, 15, 15, ''],
      ['Cable crunch', 3, 12, 15, 'Loaded ab work'],
      ['Side plank', 2, 30, 30, '30 sec/side'],
    ]},
  ];

  for (const r of seeds) {
    const routine = {
      id: uid(),
      name: r.name,
      day: r.day,
      tag: r.tag,
      notes: r.notes,
      exercises: r.exercises.map(e => ({
        id: uid(),
        name: e[0],
        sets: e[1],
        repLow: e[2],
        repHigh: e[3],
        notes: e[4]
      }))
    };
    s.routines.push(routine);
  }

  return s;
}

let state = loadState();

/* ============================================================
   HELPERS
   ============================================================ */
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function todayDay() {
  const d = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return d[new Date().getDay()];
}
function todayDate() {
  return new Date().toISOString().slice(0,10);
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtShortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function toast(msg) {
  document.querySelectorAll('.toast').forEach(n => n.remove());
  const t = el('div', { class: 'toast' }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

/* Find last performance of an exercise. Prefer the planned exercise id, but fall back to name for older history. */
function findLastPerformance(routineId, exerciseId, exerciseName) {
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const w = state.workouts[i];
    if (w.routineId !== routineId) continue;
    const e = w.exercises.find(x => x.exerciseId === exerciseId || x.name === exerciseName || x.plannedName === exerciseName);
    if (e && e.sets && e.sets.some(s => s.completed)) return { workout: w, exercise: e };
  }
  return null;
}

function formatCompletedSets(sets) {
  return sets
    .filter(s => s.completed)
    .map(s => `${s.weight ? s.weight + 'kg' : 'BW'} × ${s.reps || '—'}`)
    .join(', ');
}

function createDefaultCardio() {
  return {
    warmup: { label: 'Warm-up bike', minutes: 5, level: '', distance: '', notes: '' },
    finish: { label: 'Finish bike', minutes: 10, level: 2, distance: '', notes: '' }
  };
}

function ensureActiveWorkoutShape() {
  if (!activeWorkout) return;
  if (!activeWorkout.cardio) activeWorkout.cardio = createDefaultCardio();
  if (!activeWorkout.cardio.warmup) activeWorkout.cardio.warmup = createDefaultCardio().warmup;
  if (!activeWorkout.cardio.finish) activeWorkout.cardio.finish = createDefaultCardio().finish;
  activeWorkout.exercises.forEach(ex => {
    if (!ex.plannedName) ex.plannedName = ex.def ? ex.def.name : ex.name;
  });
}

function migrateRoutineSchedule() {
  const dayByRoutine = {
    'Push A': 'Mon',
    'Pull A': 'Tue',
    'Legs A': 'Wed',
    'Push B': 'Thu',
    'Pull B': 'Sat',
    'Legs B': 'Sun'
  };

  let changed = false;
  state.routines.forEach(r => {
    if (dayByRoutine[r.name] && r.day !== dayByRoutine[r.name]) {
      r.day = dayByRoutine[r.name];
      changed = true;
    }
  });

  if (changed) saveState();
}

function findLastCardioPerformance(kind) {
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const entry = state.workouts[i].cardio && state.workouts[i].cardio[kind];
    if (entry && parseFloat(entry.distance)) return { workout: state.workouts[i], entry };
  }
  return null;
}

function nextCardioTarget(kind) {
  const last = findLastCardioPerformance(kind);
  if (!last) return kind === 'warmup' ? 'Log your first 5-minute distance' : 'Log your first 10-minute distance';
  const next = (parseFloat(last.entry.distance) + 0.05).toFixed(2);
  return `Beat ${next} km`;
}

function cardioProgressText(kind, entry) {
  const last = findLastCardioPerformance(kind);
  const label = kind === 'warmup' ? 'warm-up' : 'finish bike';
  if (!last) return `First ${label}: record distance, then beat it by 0.05 km next time.`;

  const previous = parseFloat(last.entry.distance);
  const current = parseFloat(entry.distance);
  const base = `${fmtShortDate(last.workout.date)}: ${previous.toFixed(2)} km`;
  if (!current) return `Last ${label}: ${base}. Target: ${(previous + 0.05).toFixed(2)} km.`;

  if (current >= previous + 0.05) {
    if (kind === 'finish') return `Good progress. Next: ${(current + 0.05).toFixed(2)} km. If you beat this 3 sessions in a row, increase to level ${(parseInt(entry.level) || 2) + 1} or add 1 minute.`;
    return `Good progress. Next: ${(current + 0.05).toFixed(2)} km.`;
  }

  return `Repeat until you beat ${previous.toFixed(2)} km by at least 0.05 km.`;
}

function suggestProgression(lastEx, exerciseDef) {
  if (!lastEx) return null;
  const completed = lastEx.sets.filter(s => s.completed);
  if (completed.length === 0) return null;
  const weight = completed[0].weight;
  const totalReps = completed.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
  const targetTotal = exerciseDef.sets * exerciseDef.repHigh;
  const minTotal = exerciseDef.sets * exerciseDef.repLow;
  const rpe = parseInt(lastEx.rpe) || 0;

  if (!weight && weight !== 0) {
    // bodyweight exercise
    if (rpe <= 6) return 'Add reps or load';
    if (rpe >= 9) return 'Repeat — or regress';
    return 'Add 1 rep next time';
  }

  if (rpe >= 9 || totalReps < minTotal) return `Stay at ${weight} kg`;
  if (rpe > 0 && rpe <= 6) return `Add weight: ${(weight + 5)} kg`;
  if (totalReps >= targetTotal) return `Add 2.5 kg → ${(weight + 2.5)} kg`;
  return `Add 1 rep, stay ${weight} kg`;
}

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */
function showPage(name) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $('page-' + name).classList.add('active');
  $$('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });
  if (name === 'home') renderHome();
  if (name === 'history') renderHistory();
  if (name === 'stats') renderStats();
  window.scrollTo(0,0);
}
$$('.nav-btn').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

/* ============================================================
   HOME PAGE
   ============================================================ */
function renderHome() {
  const day = todayDay();
  const todays = state.routines.filter(r => r.day === day);
  const hero = $('hero-today');
  hero.innerHTML = '';

  const dateLine = el('div', { class: 'hero-date' }, new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
  hero.appendChild(dateLine);

  if (todays.length === 0) {
    hero.appendChild(el('h1', {}, ['Rest day', el('em', {}, ' or pick one')]));
    hero.appendChild(el('div', { class: 'hero-meta' }, 'No routine scheduled for today. Tap one below if you want to train.'));
  } else if (todays.length === 1) {
    const r = todays[0];
    hero.appendChild(el('h1', {}, r.name));
    hero.appendChild(el('div', { class: 'hero-meta' }, `${r.exercises.length} exercises · ${r.tag || 'training'}`));
    hero.appendChild(el('button', {
      class: 'btn btn-primary',
      onclick: () => startWorkout(r.id),
    }, 'Start Workout'));
  } else {
    hero.appendChild(el('h1', {}, [el('em', {}, 'Pick today\'s'), ' session']));
    hero.appendChild(el('div', { class: 'hero-meta' }, 'Multiple routines on this day — choose:'));
    const wrap = el('div', { style: 'display:grid;gap:8px;margin-top:8px' });
    todays.forEach(r => {
      wrap.appendChild(el('button', { class: 'btn btn-secondary btn-block', onclick: () => startWorkout(r.id) }, r.name));
    });
    hero.appendChild(wrap);
  }

  // Routines list
  const list = $('routine-list');
  list.innerHTML = '';
  if (state.routines.length === 0) {
    list.appendChild(el('div', { class: 'empty' }, [
      el('h3', {}, 'No routines yet'),
      el('p', {}, 'Add a routine to get started.'),
      el('button', { class: 'btn btn-primary', onclick: () => editRoutine(null) }, '+ Create Routine'),
    ]));
    return;
  }
  // sort by day order
  const dayOrder = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7, '': 8 };
  const sorted = [...state.routines].sort((a,b) => (dayOrder[a.day]||9) - (dayOrder[b.day]||9));
  for (const r of sorted) {
    const row = el('div', { class: 'routine-row', onclick: () => startWorkout(r.id) }, [
      el('div', {}, [
        el('div', { class: 'routine-row-name' }, r.name),
        el('div', { class: 'routine-row-meta' }, `${r.exercises.length} exercises · ${r.tag || '—'}`),
      ]),
      el('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        el('div', { class: 'routine-row-day' }, r.day || '—'),
        el('button', {
          class: 'icon-btn',
          onclick: (e) => { e.stopPropagation(); editRoutine(r.id); },
          'aria-label': 'Edit'
        }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' })])
      ])
    ]);
    list.appendChild(row);
  }
}
$('add-routine-link').addEventListener('click', () => editRoutine(null));

/* ============================================================
   ROUTINE EDITOR
   ============================================================ */
let editingRoutineId = null;
let editingRoutine = null;
let editingExerciseIdx = null;

function editRoutine(id) {
  if (id) {
    editingRoutineId = id;
    editingRoutine = JSON.parse(JSON.stringify(state.routines.find(r => r.id === id)));
    $('edit-title').textContent = 'Edit Routine';
    $('delete-routine-btn').style.display = 'flex';
  } else {
    editingRoutineId = null;
    editingRoutine = { id: uid(), name: '', day: '', tag: '', notes: '', exercises: [] };
    $('edit-title').textContent = 'New Routine';
    $('delete-routine-btn').style.display = 'none';
  }
  $('edit-name').value = editingRoutine.name;
  $('edit-day').value = editingRoutine.day || '';
  $('edit-tag').value = editingRoutine.tag || '';
  $('edit-notes').value = editingRoutine.notes || '';
  renderEditExerciseList();
  showPage('routine-edit');
}

function renderEditExerciseList() {
  const list = $('edit-exercise-list');
  list.innerHTML = '';
  if (editingRoutine.exercises.length === 0) {
    list.appendChild(el('div', { class: 'empty', style: 'padding:18px' }, [
      el('p', {}, 'No exercises yet. Tap below to add one.'),
    ]));
    return;
  }
  editingRoutine.exercises.forEach((ex, idx) => {
    const row = el('div', { class: 'ex-builder-row', onclick: () => openExerciseModal(idx) }, [
      el('div', {}, [
        el('div', { class: 'name' }, ex.name || '(unnamed)'),
        el('div', { class: 'meta' }, `${ex.sets} × ${ex.repLow}${ex.repHigh !== ex.repLow ? '–'+ex.repHigh : ''} reps`),
      ]),
      el('div', { style: 'display:flex;gap:6px;flex-direction:column' }, [
        idx > 0 ? el('button', {
          class: 'icon-btn',
          style: 'width:30px;height:30px',
          onclick: (e) => { e.stopPropagation(); moveExercise(idx, -1); }
        }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="18 15 12 9 6 15"/></svg>' })]) : null,
        idx < editingRoutine.exercises.length - 1 ? el('button', {
          class: 'icon-btn',
          style: 'width:30px;height:30px',
          onclick: (e) => { e.stopPropagation(); moveExercise(idx, 1); }
        }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="6 9 12 15 18 9"/></svg>' })]) : null,
      ])
    ]);
    list.appendChild(row);
  });
}

function moveExercise(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= editingRoutine.exercises.length) return;
  const ex = editingRoutine.exercises.splice(idx, 1)[0];
  editingRoutine.exercises.splice(newIdx, 0, ex);
  renderEditExerciseList();
}

$('back-from-edit').addEventListener('click', () => showPage('home'));
$('add-exercise-btn').addEventListener('click', () => openExerciseModal(null));

function openExerciseModal(idx) {
  editingExerciseIdx = idx;
  const ex = idx !== null ? editingRoutine.exercises[idx] : { name: '', sets: 3, repLow: 10, repHigh: 12, notes: '' };
  $('ex-name').value = ex.name;
  $('ex-sets').value = ex.sets;
  $('ex-rep-low').value = ex.repLow;
  $('ex-rep-high').value = ex.repHigh;
  $('ex-notes').value = ex.notes || '';
  $('ex-delete').style.display = idx !== null ? 'flex' : 'none';
  $('modal-exercise').classList.add('active');
}

$('ex-cancel').addEventListener('click', () => $('modal-exercise').classList.remove('active'));
$('ex-save').addEventListener('click', () => {
  const exData = {
    id: editingExerciseIdx !== null ? editingRoutine.exercises[editingExerciseIdx].id : uid(),
    name: $('ex-name').value.trim(),
    sets: Math.max(1, parseInt($('ex-sets').value) || 3),
    repLow: Math.max(1, parseInt($('ex-rep-low').value) || 10),
    repHigh: Math.max(1, parseInt($('ex-rep-high').value) || 12),
    notes: $('ex-notes').value.trim()
  };
  if (!exData.name) { toast('Exercise name required'); return; }
  if (exData.repHigh < exData.repLow) exData.repHigh = exData.repLow;
  if (editingExerciseIdx !== null) {
    editingRoutine.exercises[editingExerciseIdx] = exData;
  } else {
    editingRoutine.exercises.push(exData);
  }
  $('modal-exercise').classList.remove('active');
  renderEditExerciseList();
});
$('ex-delete').addEventListener('click', () => {
  if (editingExerciseIdx === null) return;
  if (!confirm('Remove this exercise from the routine?')) return;
  editingRoutine.exercises.splice(editingExerciseIdx, 1);
  $('modal-exercise').classList.remove('active');
  renderEditExerciseList();
});

$('save-routine-btn').addEventListener('click', () => {
  editingRoutine.name = $('edit-name').value.trim();
  editingRoutine.day = $('edit-day').value;
  editingRoutine.tag = $('edit-tag').value.trim();
  editingRoutine.notes = $('edit-notes').value.trim();
  if (!editingRoutine.name) { toast('Name required'); return; }
  if (editingRoutine.exercises.length === 0) { toast('Add at least one exercise'); return; }

  if (editingRoutineId) {
    const idx = state.routines.findIndex(r => r.id === editingRoutineId);
    state.routines[idx] = editingRoutine;
  } else {
    state.routines.push(editingRoutine);
  }
  saveState();
  toast('Saved');
  showPage('home');
});

$('delete-routine-btn').addEventListener('click', () => {
  if (!editingRoutineId) return;
  if (!confirm('Delete this routine? Workout history is kept.')) return;
  state.routines = state.routines.filter(r => r.id !== editingRoutineId);
  saveState();
  toast('Deleted');
  showPage('home');
});

/* ============================================================
   WORKOUT (LOGGING)
   ============================================================ */
let activeWorkout = null;

function startWorkout(routineId) {
  const routine = state.routines.find(r => r.id === routineId);
  if (!routine) return;

  activeWorkout = {
    id: uid(),
    routineId: routine.id,
    routineName: routine.name,
    date: todayDate(),
    started: Date.now(),
    cardio: createDefaultCardio(),
    exercises: routine.exercises.map(def => {
      const lastPerf = findLastPerformance(routine.id, def.id, def.name);
      const lastCompleted = lastPerf ? lastPerf.exercise.sets.filter(s => s.completed) : [];

      return {
        exerciseId: def.id,
        plannedName: def.name,
        name: def.name,
        def,
        sets: Array.from({ length: def.sets }, (_, idx) => ({
          weight: lastCompleted[idx] && lastCompleted[idx].weight ? lastCompleted[idx].weight : '',
          reps: '',
          completed: false
        })),
        rpe: '',
        knee: '',
        notes: ''
      };
    })
  };

  renderWorkout();
  saveActiveWorkoutDraft();
  showPage('workout');
}

function renderCardioCard(kind) {
  ensureActiveWorkoutShape();
  const entry = activeWorkout.cardio[kind];
  const isWarmup = kind === 'warmup';
  const last = findLastCardioPerformance(kind);

  const card = el('div', { class: 'exercise-card cardio-card' });
  card.appendChild(el('div', { class: 'cardio-kicker' }, isWarmup ? 'Warm-up' : 'Cardio finisher'));
  card.appendChild(el('div', { class: 'exercise-name' }, isWarmup ? 'Bike warm-up' : 'Bike finisher'));
  card.appendChild(el('div', { class: 'exercise-target' }, isWarmup
    ? '5 minutes · aim to beat your previous distance by 0.05 km'
    : '10 minutes · level 2 · build distance first, then increase level/time'));

  if (last) {
    card.appendChild(el('div', { class: 'last-session-card' }, [
      el('div', { class: 'last-session-label' }, 'LAST TIME'),
      el('div', { class: 'last-session-sets' }, `${parseFloat(last.entry.distance).toFixed(2)} km · ${last.entry.minutes || entry.minutes} min${last.entry.level ? ' · level ' + last.entry.level : ''}`),
      el('div', { class: 'last-session-date' }, fmtShortDate(last.workout.date))
    ]));
  }

  const row = el('div', { class: 'cardio-grid' }, [
    el('div', {}, [
      el('label', { class: 'form-label' }, 'Minutes'),
      el('input', {
        type: 'number', inputmode: 'numeric', class: 'form-input', value: entry.minutes || '', placeholder: isWarmup ? '5' : '10',
        oninput: (e) => { entry.minutes = e.target.value; updateCardioSuggestion(card, kind); saveActiveWorkoutDraft(); }
      })
    ]),
    el('div', {}, [
      el('label', { class: 'form-label' }, 'Level'),
      el('input', {
        type: 'number', inputmode: 'numeric', class: 'form-input', value: entry.level || '', placeholder: isWarmup ? '—' : '2',
        oninput: (e) => { entry.level = e.target.value; updateCardioSuggestion(card, kind); saveActiveWorkoutDraft(); }
      })
    ]),
    el('div', {}, [
      el('label', { class: 'form-label' }, 'Distance km'),
      el('input', {
        type: 'number', step: '0.01', inputmode: 'decimal', class: 'form-input', value: entry.distance || '', placeholder: last ? (parseFloat(last.entry.distance) + 0.05).toFixed(2) : 'km',
        oninput: (e) => { entry.distance = e.target.value; updateCardioSuggestion(card, kind); saveActiveWorkoutDraft(); }
      })
    ])
  ]);
  card.appendChild(row);

  const notes = el('input', {
    type: 'text', class: 'meta-input', value: entry.notes || '', placeholder: 'Cardio notes (optional)', style: 'margin-top:10px',
    oninput: (e) => { entry.notes = e.target.value; saveActiveWorkoutDraft(); }
  });
  card.appendChild(notes);

  const sug = el('div', { class: 'suggestion-bar cardio-suggestion' });
  card.appendChild(sug);
  updateCardioSuggestion(card, kind);
  return card;
}

function updateCardioSuggestion(card, kind) {
  const sug = card.querySelector('.cardio-suggestion');
  if (!sug) return;
  const entry = activeWorkout.cardio[kind];
  sug.innerHTML = '';
  sug.style.display = 'flex';
  sug.appendChild(el('span', {}, '→'));
  sug.appendChild(el('strong', {}, 'TARGET:'));
  sug.appendChild(el('span', {}, cardioProgressText(kind, entry)));
}

function renderLastPerformanceBlock(lastPerf) {
  if (!lastPerf) return null;
  const completed = lastPerf.exercise.sets.filter(s => s.completed);
  if (completed.length === 0) return null;

  return el('div', { class: 'last-session-card' }, [
    el('div', { class: 'last-session-label' }, 'LAST TIME'),
    el('div', { class: 'last-session-sets' }, formatCompletedSets(completed)),
    el('div', { class: 'last-session-date' }, fmtShortDate(lastPerf.workout.date))
  ]);
}

function renderWorkout() {
  ensureActiveWorkoutShape();
  $('workout-title').textContent = activeWorkout.routineName;
  $('workout-date').textContent = fmtDate(activeWorkout.date);
  const wrap = $('workout-exercises');
  wrap.innerHTML = '';

  wrap.appendChild(renderCardioCard('warmup'));

  activeWorkout.exercises.forEach((ex, exIdx) => {
    const def = ex.def;
    const lastPerf = findLastPerformance(activeWorkout.routineId, ex.exerciseId, ex.plannedName || ex.name);
    const lastCompleted = lastPerf ? lastPerf.exercise.sets.filter(s => s.completed) : [];

    const card = el('div', { class: 'exercise-card' });
    const nameEl = el('div', { class: 'exercise-name' }, ex.name);

    const head = el('div', { class: 'exercise-head' }, [
      el('div', { style: 'flex:1;min-width:0' }, [
        nameEl,
        el('div', { class: 'exercise-target' }, `${def.sets} × ${def.repLow}${def.repHigh !== def.repLow ? '–'+def.repHigh : ''}${def.notes ? ' · ' + def.notes : ''}`)
      ])
    ]);
    card.appendChild(head);

    const actualWrap = el('div', { class: 'actual-exercise-wrap' }, [
      el('label', { class: 'form-label' }, 'Actual exercise done'),
      el('input', {
        type: 'text',
        class: 'meta-input actual-exercise-input',
        value: ex.name,
        placeholder: 'Change if you used a different exercise',
        oninput: (e) => {
          ex.name = e.target.value.trim() || ex.plannedName || def.name;
          nameEl.textContent = ex.name;
          saveActiveWorkoutDraft();
        }
      })
    ]);
    card.appendChild(actualWrap);

    const lastBlock = renderLastPerformanceBlock(lastPerf);
    if (lastBlock) card.appendChild(lastBlock);

    const grid = el('div', { class: 'sets-grid' }, [
      el('div', { class: 'sets-grid-header' }, 'Set'),
      el('div', { class: 'sets-grid-header' }, 'Weight'),
      el('div', { class: 'sets-grid-header' }, 'Reps'),
      el('div', { class: 'sets-grid-header' }, 'RPE'),
      el('div', { class: 'sets-grid-header' }, ''),
    ]);

    ex.sets.forEach((set, sIdx) => {
      const previousSet = lastCompleted[sIdx];
      grid.appendChild(el('div', { class: 'set-num' }, String(sIdx + 1)));

      const weightInput = el('input', {
        type: 'number', step: '0.5', inputmode: 'decimal',
        class: 'set-input', placeholder: previousSet && previousSet.weight ? `last ${previousSet.weight}` : '–',
        value: set.weight,
        oninput: (e) => { set.weight = e.target.value; saveActiveWorkoutDraft(); }
      });
      if (set.completed) weightInput.classList.add('completed');
      grid.appendChild(weightInput);

      const repsInput = el('input', {
        type: 'number', inputmode: 'numeric',
        class: 'set-input', placeholder: previousSet && previousSet.reps ? `last ${previousSet.reps}` : String(def.repLow),
        value: set.reps,
        oninput: (e) => { set.reps = e.target.value; saveActiveWorkoutDraft(); }
      });
      if (set.completed) repsInput.classList.add('completed');
      grid.appendChild(repsInput);

      if (sIdx === ex.sets.length - 1) {
        const rpeInput = el('input', {
          type: 'number', inputmode: 'numeric', min: '1', max: '10',
          class: 'rpe-input', placeholder: '7',
          value: ex.rpe,
          oninput: (e) => { ex.rpe = e.target.value; saveActiveWorkoutDraft(); updateSuggestion(card, ex); }
        });
        grid.appendChild(rpeInput);
      } else {
        grid.appendChild(el('div', {}));
      }

      const checkBtn = el('button', {
        class: 'check-btn' + (set.completed ? ' checked' : ''),
        onclick: () => {
          set.completed = !set.completed;
          checkBtn.classList.toggle('checked', set.completed);
          weightInput.classList.toggle('completed', set.completed);
          repsInput.classList.toggle('completed', set.completed);
          if (set.completed && !set.reps) {
            set.reps = def.repHigh;
            repsInput.value = def.repHigh;
          }
          saveActiveWorkoutDraft();
          updateSuggestion(card, ex);
        }
      });
      checkBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      grid.appendChild(checkBtn);
    });

    card.appendChild(grid);

    const addBtn = el('button', { class: 'add-set-btn', onclick: () => {
      ex.sets.push({ weight: '', reps: '', completed: false });
      saveActiveWorkoutDraft();
      renderWorkout();
    }}, '+ Add set');
    card.appendChild(addBtn);

    const isLegs = (state.routines.find(r => r.id === activeWorkout.routineId).tag || '').toLowerCase().includes('leg');
    if (isLegs) {
      const chipsWrap = el('div', { class: 'knee-chips' });
      ['fine', 'tight', 'pain'].forEach(label => {
        const chip = el('button', {
          class: 'knee-chip ' + label + (ex.knee === label ? ' active' : ''),
          onclick: () => {
            ex.knee = ex.knee === label ? '' : label;
            saveActiveWorkoutDraft();
            chipsWrap.querySelectorAll('.knee-chip').forEach(c => c.classList.remove('active','fine','tight','pain'));
            chipsWrap.querySelectorAll('.knee-chip').forEach((c,i) => {
              const lbl = ['fine','tight','pain'][i];
              c.className = 'knee-chip ' + lbl + (ex.knee === lbl ? ' active' : '');
            });
          }
        }, 'Knee: ' + label);
        chipsWrap.appendChild(chip);
      });
      card.appendChild(chipsWrap);
    }

    const notesInput = el('input', {
      type: 'text',
      class: 'meta-input',
      placeholder: 'Notes (optional)',
      value: ex.notes,
      oninput: (e) => { ex.notes = e.target.value; saveActiveWorkoutDraft(); },
      style: 'margin-top:10px'
    });
    card.appendChild(notesInput);

    const sug = el('div', { class: 'suggestion-bar', style: 'display:none' });
    card.appendChild(sug);
    updateSuggestion(card, ex);

    wrap.appendChild(card);
  });

  wrap.appendChild(renderCardioCard('finish'));
}

function updateSuggestion(card, ex) {
  const sug = card.querySelector('.suggestion-bar:not(.cardio-suggestion)');
  if (!sug) return;
  const completed = ex.sets.filter(s => s.completed);
  if (completed.length === 0 || !ex.rpe) {
    sug.style.display = 'none';
    return;
  }
  const fakeLast = { sets: ex.sets, rpe: ex.rpe };
  const text = suggestProgression(fakeLast, ex.def);
  if (text) {
    sug.innerHTML = '';
    sug.style.display = 'flex';
    sug.appendChild(el('span', {}, '→'));
    sug.appendChild(el('strong', {}, 'NEXT TIME:'));
    sug.appendChild(el('span', {}, text));
  } else {
    sug.style.display = 'none';
  }
}

$('back-from-workout').addEventListener('click', () => {
  if (confirm('Leave workout? Your progress has been autosaved and you can resume later.')) {
    showPage('home');
  }
});
$('cancel-workout-btn').addEventListener('click', () => {
  if (confirm('Cancel workout? This will discard the autosaved draft.')) {
    activeWorkout = null;
    clearActiveWorkoutDraft();
    showPage('home');
  }
});

$('finish-workout-btn').addEventListener('click', () => {
  if (!activeWorkout) return;
  ensureActiveWorkoutShape();
  const toSave = {
    id: activeWorkout.id,
    routineId: activeWorkout.routineId,
    routineName: activeWorkout.routineName,
    date: activeWorkout.date,
    started: activeWorkout.started,
    finished: Date.now(),
    cardio: activeWorkout.cardio,
    exercises: activeWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      plannedName: ex.plannedName,
      name: ex.name,
      sets: ex.sets,
      rpe: ex.rpe,
      knee: ex.knee,
      notes: ex.notes
    }))
  };
  const totalCompleted = toSave.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
  const hasCardio = parseFloat(toSave.cardio.warmup.distance) || parseFloat(toSave.cardio.finish.distance);
  if (totalCompleted === 0 && !hasCardio) {
    if (!confirm('No sets or cardio distances are logged. Save anyway?')) return;
  }
  state.workouts.push(toSave);
  saveState();
  activeWorkout = null;
  clearActiveWorkoutDraft();
  toast('Workout saved');
  showPage('history');
});

function resumeActiveWorkoutIfNeeded() {
  const draft = loadActiveWorkoutDraft();
  if (!draft) return false;

  const routine = state.routines.find(r => r.id === draft.routineId);
  if (!routine) {
    clearActiveWorkoutDraft();
    return false;
  }

  if (!confirm(`Resume unfinished workout: ${draft.routineName || routine.name}?`)) {
    clearActiveWorkoutDraft();
    return false;
  }

  activeWorkout = draft;
  if (!activeWorkout.cardio) activeWorkout.cardio = createDefaultCardio();
  activeWorkout.exercises = activeWorkout.exercises.map(ex => {
    const def = routine.exercises.find(d => d.id === ex.exerciseId) || {
      id: ex.exerciseId,
      name: ex.plannedName || ex.name,
      sets: ex.sets ? ex.sets.length : 3,
      repLow: 8,
      repHigh: 12,
      notes: ''
    };
    return { ...ex, def, plannedName: ex.plannedName || def.name };
  });

  renderWorkout();
  showPage('workout');
  toast('Workout resumed');
  return true;
}

/* ============================================================
   HISTORY
   ============================================================ */
function renderHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  if (state.workouts.length === 0) {
    list.appendChild(el('div', { class: 'empty' }, [
      el('h3', {}, 'No workouts logged yet'),
      el('p', {}, 'Your history will appear here once you finish your first session.'),
    ]));
    return;
  }
  const sorted = [...state.workouts].sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.started || 0) - (a.started || 0));
  for (const w of sorted) {
    const totalSets = w.exercises.reduce((s,e) => s + e.sets.filter(x => x.completed).length, 0);
    const totalVolume = w.exercises.reduce((sum, e) =>
      sum + e.sets.filter(s => s.completed).reduce((a, s) => a + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0), 0
    );
    const row = el('div', { class: 'history-row', onclick: () => viewWorkoutDetails(w.id) }, [
      el('div', { class: 'h-date' }, fmtDate(w.date)),
      el('div', { class: 'h-routine' }, w.routineName),
      el('div', { class: 'h-summary' }, `${w.exercises.length} ex · ${totalSets} sets · ${Math.round(totalVolume).toLocaleString()} kg volume${w.cardio && w.cardio.finish && w.cardio.finish.distance ? ' · Bike ' + w.cardio.finish.distance + ' km' : ''}`)
    ]);
    list.appendChild(row);
  }
}

function viewWorkoutDetails(id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w) return;
  let summary = `${w.routineName} — ${fmtDate(w.date)}\n\n`;
  if (w.cardio) {
    if (w.cardio.warmup && w.cardio.warmup.distance) summary += `Warm-up bike: ${w.cardio.warmup.distance} km (${w.cardio.warmup.minutes || 5} min)\n`;
    if (w.cardio.finish && w.cardio.finish.distance) summary += `Finish bike: ${w.cardio.finish.distance} km (${w.cardio.finish.minutes || 10} min${w.cardio.finish.level ? ', level ' + w.cardio.finish.level : ''})\n`;
    summary += '\n';
  }
  w.exercises.forEach(e => {
    const completed = e.sets.filter(s => s.completed);
    if (completed.length === 0) return;
    const setsStr = completed.map(s => `${s.weight ? s.weight+'kg' : 'BW'} × ${s.reps}`).join(', ');
    summary += `• ${e.name}${e.plannedName && e.plannedName !== e.name ? ` (instead of ${e.plannedName})` : ''}: ${setsStr}${e.rpe ? ` @ RPE ${e.rpe}` : ''}${e.knee ? ` · knee ${e.knee}` : ''}\n`;
    if (e.notes) summary += `   note: ${e.notes}\n`;
  });
  if (confirm(summary + '\n\nDelete this workout?')) {
    state.workouts = state.workouts.filter(x => x.id !== id);
    saveState();
    renderHistory();
    toast('Deleted');
  }
}

/* ============================================================
   STATS
   ============================================================ */
function renderStats() {
  const grid = $('weekly-stats');
  grid.innerHTML = '';
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = state.workouts.filter(w => new Date(w.date) >= weekAgo);
  const totalSets = recent.reduce((s,w) => s + w.exercises.reduce((s2,e) => s2 + e.sets.filter(x => x.completed).length, 0), 0);
  const totalVolume = recent.reduce((s,w) =>
    s + w.exercises.reduce((s2,e) =>
      s2 + e.sets.filter(x => x.completed).reduce((a,x) => a + (parseFloat(x.weight)||0) * (parseInt(x.reps)||0), 0), 0
    ), 0
  );
  const warmupKm = recent.reduce((s,w) => s + (parseFloat(w.cardio && w.cardio.warmup && w.cardio.warmup.distance) || 0), 0);
  const finishKm = recent.reduce((s,w) => s + (parseFloat(w.cardio && w.cardio.finish && w.cardio.finish.distance) || 0), 0);
  const bestFinish = state.workouts.reduce((best,w) => {
    const d = parseFloat(w.cardio && w.cardio.finish && w.cardio.finish.distance) || 0;
    return d > best.distance ? { distance: d, date: w.date } : best;
  }, { distance: 0, date: '' });

  grid.appendChild(el('div', { class: 'stats-hero-card' }, [
    el('div', { class: 'card-eyebrow' }, 'Training snapshot'),
    el('div', { class: 'stats-hero-value' }, `${recent.length}`),
    el('div', { class: 'stats-hero-sub' }, `workouts in the last 7 days · Friday is your planned rest day`)
  ]));

  const cards = [
    ['Workouts', recent.length, '/ 7d', 'Sessions completed this week'],
    ['Sets logged', totalSets, '', 'Completed strength sets'],
    ['Volume', Math.round(totalVolume).toLocaleString(), 'kg', 'Total logged lifting volume'],
    ['Training days', calcStreak(), '/ 14d', 'Days trained in the last 14 days'],
    ['Warm-up bike', warmupKm.toFixed(2), 'km', 'Total warm-up distance this week'],
    ['Finish bike', finishKm.toFixed(2), 'km', bestFinish.distance ? `Best: ${bestFinish.distance.toFixed(2)} km on ${fmtShortDate(bestFinish.date)}` : 'No bike finish logged yet']
  ];

  cards.forEach(([label, value, unit, detail]) => {
    grid.appendChild(el('div', { class: 'stat-card stat-card-polished' }, [
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' }, [String(value), unit ? el('span', { class: 'unit' }, unit) : null]),
      el('div', { class: 'delta' }, detail),
    ]));
  });

  renderBodyweight();
  renderPRs();
}

function calcStreak() {
  // streak = consecutive days with workouts going back from today
  const dates = new Set(state.workouts.map(w => w.date));
  let s = 0;
  let d = new Date();
  // also count days off as part of streak — actually a real workout streak counts unique training days
  // simpler approach: count last N days where at least one workout was logged in any of them
  // Actually best: number of training days in the last 14 days
  let count = 0;
  for (let i = 0; i < 14; i++) {
    const iso = d.toISOString().slice(0,10);
    if (dates.has(iso)) count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function renderBodyweight() {
  const wrap = $('bw-stats');
  wrap.innerHTML = '';
  if (state.bodyweight.length === 0) {
    wrap.appendChild(el('p', { style: 'color:var(--text-muted);font-size:13px' }, 'No body weight data yet. Log your first weigh-in above.'));
    return;
  }
  const sorted = [...state.bodyweight].sort((a,b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const last4 = sorted.slice(-4);
  const avg = last4.reduce((s,e) => s + e.weight, 0) / last4.length;
  const first = sorted[0];
  const totalChange = latest.weight - first.weight;

  wrap.appendChild(el('div', { class: 'stat-grid' }, [
    el('div', { class: 'stat-card' }, [
      el('div', { class: 'label' }, 'Latest'),
      el('div', { class: 'value' }, [latest.weight.toFixed(1), el('span', { class: 'unit' }, 'kg')]),
      el('div', { class: 'delta' }, fmtShortDate(latest.date)),
    ]),
    el('div', { class: 'stat-card' }, [
      el('div', { class: 'label' }, '4-wk avg'),
      el('div', { class: 'value' }, [avg.toFixed(1), el('span', { class: 'unit' }, 'kg')]),
      el('div', { class: 'delta ' + (totalChange < 0 ? 'up' : 'down') },
        `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)} kg total`),
    ])
  ]));

  // mini sparkline
  if (sorted.length > 1) {
    const w = 320, h = 60, pad = 4;
    const min = Math.min(...sorted.map(s => s.weight));
    const max = Math.max(...sorted.map(s => s.weight));
    const range = max - min || 1;
    const pts = sorted.map((s,i) => {
      const x = pad + (i / (sorted.length-1)) * (w - 2*pad);
      const y = h - pad - ((s.weight - min) / range) * (h - 2*pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const svgWrap = el('div', { class: 'card', style: 'margin-top:10px;padding:14px' });
    svgWrap.innerHTML = `
      <div class="card-eyebrow">Trend (${sorted.length} weigh-ins)</div>
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:60px;display:block">
        <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    wrap.appendChild(svgWrap);
  }
}

$('bw-save-btn').addEventListener('click', () => {
  const v = parseFloat($('bw-input').value);
  if (!v || v < 30 || v > 300) { toast('Enter a valid weight'); return; }
  // remove existing entry for today, then add
  state.bodyweight = state.bodyweight.filter(b => b.date !== todayDate());
  state.bodyweight.push({ date: todayDate(), weight: v });
  saveState();
  $('bw-input').value = '';
  toast('Logged');
  renderBodyweight();
  renderStats();
});

function renderPRs() {
  const list = $('prs-list');
  list.innerHTML = '';
  // PR = highest weight × reps for each unique exercise
  const prMap = {};
  for (const w of state.workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.completed || !s.weight) continue;
        const wt = parseFloat(s.weight);
        const reps = parseInt(s.reps) || 0;
        const score = wt * reps;
        if (!prMap[ex.name] || score > prMap[ex.name].score) {
          prMap[ex.name] = { weight: wt, reps, date: w.date, score };
        }
      }
    }
  }
  const prs = Object.entries(prMap).sort((a,b) => b[1].score - a[1].score).slice(0, 12);
  if (prs.length === 0) {
    list.appendChild(el('div', { class: 'empty', style: 'padding:20px' }, [
      el('p', {}, 'No PRs yet. Log a few workouts.')
    ]));
    return;
  }
  for (const [name, pr] of prs) {
    list.appendChild(el('div', { class: 'history-row' }, [
      el('div', { class: 'h-routine', style: 'margin-top:0;margin-bottom:2px;font-size:15px' }, name),
      el('div', { class: 'h-summary' }, `${pr.weight}kg × ${pr.reps} reps · ${fmtShortDate(pr.date)}`),
    ]));
  }
}

/* ============================================================
   SETTINGS / EXPORT / IMPORT
   ============================================================ */
$('settings-btn').addEventListener('click', () => $('modal-settings').classList.add('active'));
$('close-settings').addEventListener('click', () => $('modal-settings').classList.remove('active'));

function download(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('export-csv').addEventListener('click', () => {
  // CSV: one row per completed set
  const rows = [['date','routine','planned_exercise','actual_exercise','set','weight_kg','reps','rpe','knee','notes','warmup_km','finish_km']];
  for (const w of state.workouts) {
    for (const ex of w.exercises) {
      ex.sets.forEach((s, i) => {
        if (!s.completed) return;
        rows.push([
          w.date, w.routineName, ex.plannedName || ex.name, ex.name, i + 1,
          s.weight || '', s.reps || '',
          ex.rpe || '', ex.knee || '',
          (ex.notes || '').replace(/[\r\n,]/g, ' '),
          w.cardio && w.cardio.warmup ? (w.cardio.warmup.distance || '') : '',
          w.cardio && w.cardio.finish ? (w.cardio.finish.distance || '') : ''
        ]);
      });
    }
  }
  const csv = rows.map(r => r.map(c => {
    const str = String(c);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');
  download(`lift-export-${todayDate()}.csv`, csv, 'text/csv');
  toast('CSV exported');
});

$('export-json').addEventListener('click', () => {
  download(`lift-backup-${todayDate()}.json`, JSON.stringify(state, null, 2), 'application/json');
  toast('JSON exported');
});

$('export-txt').addEventListener('click', () => {
  let txt = `LIFT — Training log\nExported ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
  const sorted = [...state.workouts].sort((a,b) => b.date.localeCompare(a.date));
  for (const w of sorted) {
    txt += `${fmtDate(w.date)} — ${w.routineName}\n${'-'.repeat(40)}\n`;
    for (const ex of w.exercises) {
      const completed = ex.sets.filter(s => s.completed);
      if (completed.length === 0) continue;
      const setsStr = completed.map(s => `${s.weight ? s.weight+'kg' : 'BW'}×${s.reps}`).join(', ');
      txt += `  ${ex.name}: ${setsStr}`;
      if (ex.rpe) txt += ` @RPE${ex.rpe}`;
      if (ex.knee) txt += ` [knee:${ex.knee}]`;
      txt += '\n';
      if (ex.notes) txt += `    ${ex.notes}\n`;
    }
    txt += '\n';
  }
  if (state.bodyweight.length > 0) {
    txt += `BODY WEIGHT\n${'-'.repeat(40)}\n`;
    [...state.bodyweight].sort((a,b) => a.date.localeCompare(b.date)).forEach(b => {
      txt += `  ${b.date}  ${b.weight} kg\n`;
    });
  }
  download(`lift-summary-${todayDate()}.txt`, txt, 'text/plain');
  toast('Summary exported');
});

$('import-json-btn').addEventListener('click', () => $('import-json-file').click());
$('import-json-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.routines || !imported.workouts) throw new Error('Invalid backup file');
      if (!confirm(`Import ${imported.routines.length} routines and ${imported.workouts.length} workouts? This will REPLACE your current data.`)) return;
      state = Object.assign({}, DEFAULT_STATE, imported);
      saveState();
      toast('Imported');
      $('modal-settings').classList.remove('active');
      showPage('home');
    } catch (err) {
      toast('Invalid backup file');
    }
  };
  reader.readAsText(file);
});

$('reset-data').addEventListener('click', () => {
  if (!confirm('This will delete ALL your routines, workouts, and body weight data. Cannot be undone. Are you sure?')) return;
  if (!confirm('Last warning. Really delete everything?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  saveState();
  toast('Reset');
  $('modal-settings').classList.remove('active');
  showPage('home');
});

/* ============================================================
   PRE-LOAD: import the Wednesday session you already logged
   ============================================================ */
function importSeedHistory() {
  // Only if no workouts exist yet — don't double-import
  if (state.workouts.length > 0) return;
  const wedRoutine = state.routines.find(r => r.name === 'Legs A');
  if (!wedRoutine) return;
  const today = new Date();
  // Set the date to last Wednesday
  const dayOfWeek = today.getDay();
  const daysSinceWed = (dayOfWeek + 4) % 7; // wed = 3, so (today - 3 + 7) % 7
  const wedDate = new Date(today);
  wedDate.setDate(wedDate.getDate() - daysSinceWed);
  const dateIso = wedDate.toISOString().slice(0,10);

  const seed = {
    'Leg extension': { weight: 18, reps: [15,15,15], rpe: 7, knee: 'fine', notes: 'Difficult — repeat next week' },
    'Leg press (feet high, narrow)': { weight: 39, reps: [12,12,12,12], rpe: 5, knee: 'fine', notes: 'Easy — jump to 49kg next week' },
    'Step-ups (low box)': { weight: '', reps: [10,10,10], rpe: 5, knee: 'fine', notes: 'BW too easy — add 5kg DBs' },
    'Reverse lunge (DBs)': { weight: 3, reps: [8,8,8], rpe: 5, knee: 'fine', notes: 'Way too light — jump to 7.5kg' },
    'Standing calf raise': { weight: '', reps: [12,12,12], rpe: 5, knee: 'fine', notes: 'BW too easy — switch to machine' },
    'Plank': { weight: 30, reps: [30,30,30], rpe: 8, knee: 'fine', notes: 'Difficult — repeat' },
    'Dead bug': { weight: '', reps: [10,10,10], rpe: 5, knee: 'fine', notes: 'Easy — bump to 12/side' },
  };

  const workout = {
    id: uid(),
    routineId: wedRoutine.id,
    routineName: wedRoutine.name,
    date: dateIso,
    started: wedDate.getTime(),
    finished: wedDate.getTime() + 60*60*1000,
    exercises: wedRoutine.exercises.map(def => {
      const s = seed[def.name];
      if (!s) return {
        exerciseId: def.id, name: def.name,
        sets: Array.from({length: def.sets}, () => ({ weight: '', reps: '', completed: false })),
        rpe: '', knee: '', notes: ''
      };
      return {
        exerciseId: def.id,
        name: def.name,
        sets: s.reps.map(r => ({ weight: s.weight || '', reps: r, completed: true })),
        rpe: s.rpe,
        knee: s.knee,
        notes: s.notes
      };
    })
  };
  state.workouts.push(workout);
  saveState();
}

/* ============================================================
   INIT
   ============================================================ */
migrateRoutineSchedule();
importSeedHistory();
if (!resumeActiveWorkoutIfNeeded()) {
  showPage('home');
}

/* ============================================================
   LIFT v1.3 — Premium UI/UX overrides
   These functions intentionally override selected v1.x renderers.
   ============================================================ */

const APP_VERSION = 'Lift v1.3';

function getWeeklyPlan() {
  return [
    { day: 'Mon', routine: 'Push A', short: 'Push' },
    { day: 'Tue', routine: 'Pull A', short: 'Pull' },
    { day: 'Wed', routine: 'Legs A', short: 'Legs' },
    { day: 'Thu', routine: 'Push B', short: 'Push' },
    { day: 'Fri', routine: 'Rest', short: 'Rest', rest: true },
    { day: 'Sat', routine: 'Pull B', short: 'Pull' },
    { day: 'Sun', routine: 'Legs B', short: 'Legs' },
  ];
}

function getRoutineForToday() {
  const plan = getWeeklyPlan().find(p => p.day === todayDay());
  if (!plan || plan.rest) return null;
  return state.routines.find(r => r.name === plan.routine) || null;
}

function getLastWorkoutForRoutine(routineName) {
  return [...state.workouts]
    .filter(w => w.routineName === routineName)
    .sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.started || 0) - (a.started || 0))[0] || null;
}

function getCompletedSetCount(w) {
  if (!w) return 0;
  return w.exercises.reduce((s,e) => s + e.sets.filter(x => x.completed).length, 0);
}

function getWorkoutVolume(w) {
  if (!w) return 0;
  return w.exercises.reduce((sum, e) =>
    sum + e.sets.filter(s => s.completed).reduce((a, s) => a + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0), 0
  );
}

function getCardioEntries(kind) {
  const entries = [];
  for (const w of state.workouts) {
    if (w.cardio && w.cardio[kind] && w.cardio[kind].distance) {
      entries.push({
        date: w.date,
        routineName: w.routineName,
        ...w.cardio[kind]
      });
    }
  }
  return entries.sort((a,b) => (a.date || '').localeCompare(b.date || ''));
}

function getLastCardio(kind) {
  const entries = getCardioEntries(kind);
  return entries[entries.length - 1] || null;
}

function getCardioTarget(kind) {
  const last = getLastCardio(kind);
  if (!last || !last.distance) return kind === 'warmup' ? 1.5 : 3.0;
  return Math.round((parseFloat(last.distance) + 0.05) * 100) / 100;
}

function ensureWorkoutCardioShape() {
  if (!activeWorkout) return;
  if (!activeWorkout.cardio) {
    activeWorkout.cardio = {
      warmup: { type: 'bike', minutes: 5, level: 2, distance: '' },
      finisher: { type: 'bike', minutes: 10, level: 2, distance: '' }
    };
  }
  if (!activeWorkout.cardio.warmup) activeWorkout.cardio.warmup = { type: 'bike', minutes: 5, level: 2, distance: '' };
  if (!activeWorkout.cardio.finisher) activeWorkout.cardio.finisher = { type: 'bike', minutes: 10, level: 2, distance: '' };
}

function renderCardioCard(kind) {
  ensureWorkoutCardioShape();

  const isWarmup = kind === 'warmup';
  const data = activeWorkout.cardio[kind];
  const target = getCardioTarget(kind);
  const last = getLastCardio(kind);

  const card = el('div', { class: 'cardio-card' }, [
    el('div', { class: 'premium-kicker' }, isWarmup ? 'Warm-up' : 'Finisher'),
    el('div', { class: 'cardio-title' }, isWarmup ? 'Bike · 5 min' : `Bike · ${data.minutes || 10} min`),
    el('div', { class: 'cardio-meta' }, isWarmup
      ? 'Ease in, get warm, then try to edge past your last distance.'
      : `Level ${data.level || 2}. Finish controlled and aim to beat your last distance.`
    ),
    el('div', { class: 'cardio-grid' }, [
      el('div', { class: 'cardio-stat' }, [
        el('div', { class: 'label' }, 'Last'),
        el('div', { class: 'value' }, last && last.distance ? `${parseFloat(last.distance).toFixed(2)} km` : '—')
      ]),
      el('div', { class: 'cardio-stat' }, [
        el('div', { class: 'label' }, 'Target'),
        el('div', { class: 'value' }, `${target.toFixed(2)} km`)
      ])
    ]),
    el('div', { class: 'cardio-input-wrap' }, [
      el('input', {
        type: 'number',
        step: '0.01',
        inputmode: 'decimal',
        class: 'form-input',
        placeholder: 'km today',
        value: data.distance || '',
        oninput: (e) => {
          data.distance = e.target.value;
          saveActiveWorkoutDraft();
        }
      }),
      el('button', {
        class: 'btn btn-secondary btn-sm',
        onclick: () => {
          data.distance = target.toFixed(2);
          saveActiveWorkoutDraft();
          renderWorkout();
        }
      }, 'Target')
    ])
  ]);

  return card;
}

function renderHome() {
  const day = todayDay();
  const todayPlan = getWeeklyPlan().find(p => p.day === day);
  const todaysRoutine = getRoutineForToday();
  const hero = $('hero-today');
  hero.className = 'today-shell';
  hero.innerHTML = '';

  const todayCard = el('div', { class: 'today-card' });
  todayCard.appendChild(el('div', { class: 'today-kicker' },
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  ));

  if (!todaysRoutine) {
    todayCard.appendChild(el('div', { class: 'today-title' }, 'Rest day'));
    todayCard.appendChild(el('div', { class: 'today-sub' }, 'Friday is your recovery day. Keep steps light, hydrate, and be ready for the weekend sessions.'));
    todayCard.appendChild(el('div', { class: 'today-mini-grid' }, [
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Today'),
        el('div', { class: 'value' }, todayPlan ? todayPlan.routine : 'Rest')
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Next'),
        el('div', { class: 'value' }, 'Pull B · Saturday')
      ])
    ]));
  } else {
    const last = getLastWorkoutForRoutine(todaysRoutine.name);
    todayCard.appendChild(el('div', { class: 'today-title' }, todaysRoutine.name));
    todayCard.appendChild(el('div', { class: 'today-sub' }, `${todaysRoutine.tag || 'Training'} · ${todaysRoutine.exercises.length} exercises · bike warm-up and finisher`));
    todayCard.appendChild(el('div', { class: 'today-mini-grid' }, [
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Warm-up'),
        el('div', { class: 'value' }, `Bike · target ${getCardioTarget('warmup').toFixed(2)}km`)
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Finisher'),
        el('div', { class: 'value' }, `10 min · target ${getCardioTarget('finisher').toFixed(2)}km`)
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Last done'),
        el('div', { class: 'value' }, last ? fmtShortDate(last.date) : 'First session')
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Last sets'),
        el('div', { class: 'value' }, last ? `${getCompletedSetCount(last)} sets` : '—')
      ])
    ]));
    todayCard.appendChild(el('button', {
      class: 'btn btn-primary',
      onclick: () => startWorkout(todaysRoutine.id)
    }, `Start ${todaysRoutine.name}`));
  }

  hero.appendChild(todayCard);

  const weekCard = el('div', { class: 'card', style: 'border-radius:24px' }, [
    el('div', { class: 'premium-kicker' }, 'Weekly rhythm')
  ]);

  const strip = el('div', { class: 'week-strip' });
  getWeeklyPlan().forEach(p => {
    strip.appendChild(el('div', {
      class: 'week-day-pill' + (p.day === day ? ' active' : '') + (p.rest ? ' rest' : '')
    }, [
      el('div', { class: 'd' }, p.day),
      el('div', { class: 'r' }, p.short)
    ]));
  });
  weekCard.appendChild(strip);
  hero.appendChild(weekCard);

  const list = $('routine-list');
  list.innerHTML = '';
  const sectionTitle = document.querySelector('#page-home .section-h h2');
  if (sectionTitle) sectionTitle.textContent = 'All routines';

  const dayOrder = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7, '': 8 };
  const sorted = [...state.routines].sort((a,b) => (dayOrder[a.day]||9) - (dayOrder[b.day]||9));
  for (const r of sorted) {
    const row = el('div', { class: 'routine-row', onclick: () => startWorkout(r.id) }, [
      el('div', {}, [
        el('div', { class: 'routine-row-name' }, r.name),
        el('div', { class: 'routine-row-meta' }, `${r.exercises.length} exercises · ${r.tag || '—'}`),
      ]),
      el('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        el('div', { class: 'routine-row-day' }, r.day || '—'),
        el('button', {
          class: 'icon-btn',
          onclick: (e) => { e.stopPropagation(); editRoutine(r.id); },
          'aria-label': 'Edit'
        }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' })])
      ])
    ]);
    list.appendChild(row);
  }
}

function startWorkout(routineId) {
  const routine = state.routines.find(r => r.id === routineId);
  if (!routine) return;
  activeWorkout = {
    id: uid(),
    routineId: routine.id,
    routineName: routine.name,
    date: todayDate(),
    started: Date.now(),
    cardio: {
      warmup: { type: 'bike', minutes: 5, level: 2, distance: '' },
      finisher: { type: 'bike', minutes: 10, level: 2, distance: '' }
    },
    exercises: routine.exercises.map(def => ({
      exerciseId: def.id,
      plannedName: def.name,
      name: def.name,
      def,
      sets: Array.from({ length: def.sets }, () => ({ weight: '', reps: '', completed: false })),
      rpe: '',
      knee: '',
      notes: ''
    }))
  };
  renderWorkout();
  saveActiveWorkoutDraft();
  showPage('workout');
}

function swapExercise(ex, exIdx) {
  const current = ex.name || ex.plannedName;
  const replacement = prompt('What exercise did you do instead?', current);
  if (!replacement || !replacement.trim()) return;
  ex.plannedName = ex.plannedName || current;
  ex.name = replacement.trim();
  saveActiveWorkoutDraft();
  renderWorkout();
}

function renderWorkout() {
  ensureWorkoutCardioShape();

  $('workout-title').textContent = activeWorkout.routineName;
  $('workout-date').innerHTML = `<span class="workout-progress-pill">In progress · autosaved</span>`;
  const wrap = $('workout-exercises');
  wrap.innerHTML = '';

  wrap.appendChild(renderCardioCard('warmup'));

  activeWorkout.exercises.forEach((ex, exIdx) => {
    const def = ex.def;
    const lastPerf = findLastPerformance(activeWorkout.routineId, ex.name) || findLastPerformance(activeWorkout.routineId, ex.plannedName || ex.name);
    let lastSummary = null;
    if (lastPerf) {
      const completed = lastPerf.exercise.sets.filter(s => s.completed);
      const w = completed[0] && completed[0].weight ? `${completed[0].weight}kg` : 'BW';
      const repsList = completed.map(s => s.reps).join(' / ');
      lastSummary = el('div', { class: 'last-time' }, [
        el('div', { style: 'font-size:9px;letter-spacing:0.2em' }, 'LAST TIME'),
        el('div', {}, [el('strong', {}, w), ` · ${repsList}`]),
        el('div', { style: 'color:var(--text-muted);margin-top:2px' }, fmtShortDate(lastPerf.workout.date))
      ]);
    } else {
      lastSummary = el('div', { class: 'last-time' }, [
        el('div', { style: 'font-size:9px;letter-spacing:0.2em' }, 'LAST TIME'),
        el('div', {}, [el('strong', {}, 'New')]),
        el('div', { style: 'color:var(--text-muted);margin-top:2px' }, 'Set baseline')
      ]);
    }

    const card = el('div', { class: 'exercise-card' });

    const plannedText = ex.plannedName && ex.plannedName !== ex.name ? `Planned: ${ex.plannedName}` : `${def.sets} × ${def.repLow}${def.repHigh !== def.repLow ? '–'+def.repHigh : ''}${def.notes ? ' · ' + def.notes : ''}`;

    const head = el('div', { class: 'exercise-head' }, [
      el('div', { style: 'flex:1' }, [
        el('div', { class: 'premium-kicker' }, `Exercise ${exIdx + 1} of ${activeWorkout.exercises.length}`),
        el('div', { class: 'exercise-name' }, ex.name),
        el('div', { class: 'exercise-target' }, plannedText)
      ]),
      lastSummary
    ]);
    card.appendChild(head);

    const grid = el('div', { class: 'sets-grid' }, [
      el('div', { class: 'sets-grid-header' }, 'Set'),
      el('div', { class: 'sets-grid-header' }, 'Kg'),
      el('div', { class: 'sets-grid-header' }, 'Reps'),
      el('div', { class: 'sets-grid-header' }, 'RPE'),
      el('div', { class: 'sets-grid-header' }, ''),
    ]);

    ex.sets.forEach((set, sIdx) => {
      grid.appendChild(el('div', { class: 'set-num' }, String(sIdx + 1)));

      const weightInput = el('input', {
        type: 'number', step: '0.5', inputmode: 'decimal',
        class: 'set-input', placeholder: '–',
        value: set.weight,
        oninput: (e) => { set.weight = e.target.value; saveActiveWorkoutDraft(); }
      });
      if (set.completed) weightInput.classList.add('completed');
      grid.appendChild(weightInput);

      const repsInput = el('input', {
        type: 'number', inputmode: 'numeric',
        class: 'set-input', placeholder: String(def.repLow),
        value: set.reps,
        oninput: (e) => { set.reps = e.target.value; saveActiveWorkoutDraft(); }
      });
      if (set.completed) repsInput.classList.add('completed');
      grid.appendChild(repsInput);

      if (sIdx === ex.sets.length - 1) {
        const rpeInput = el('input', {
          type: 'number', inputmode: 'numeric', min: '1', max: '10',
          class: 'rpe-input', placeholder: '7',
          value: ex.rpe,
          oninput: (e) => { ex.rpe = e.target.value; saveActiveWorkoutDraft(); updateSuggestion(card, ex); }
        });
        grid.appendChild(rpeInput);
      } else {
        grid.appendChild(el('div', {}));
      }

      const checkBtn = el('button', {
        class: 'check-btn' + (set.completed ? ' checked' : ''),
        onclick: () => {
          set.completed = !set.completed;
          checkBtn.classList.toggle('checked', set.completed);
          weightInput.classList.toggle('completed', set.completed);
          repsInput.classList.toggle('completed', set.completed);
          if (set.completed && !set.reps) {
            set.reps = def.repHigh;
            repsInput.value = def.repHigh;
          }
          saveActiveWorkoutDraft();
          updateSuggestion(card, ex);
        }
      });
      checkBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      grid.appendChild(checkBtn);
    });

    card.appendChild(grid);

    card.appendChild(el('button', { class: 'swap-btn', onclick: () => swapExercise(ex, exIdx) }, 'Swap exercise'));

    const addBtn = el('button', { class: 'add-set-btn', onclick: () => {
      ex.sets.push({ weight: '', reps: '', completed: false });
      saveActiveWorkoutDraft();
      renderWorkout();
    }}, '+ Add set');
    card.appendChild(addBtn);

    const isLegs = (state.routines.find(r => r.id === activeWorkout.routineId).tag || '').toLowerCase().includes('leg');
    if (isLegs) {
      const chipsWrap = el('div', { class: 'knee-chips' });
      ['fine', 'tight', 'pain'].forEach(label => {
        const chip = el('button', {
          class: 'knee-chip ' + label + (ex.knee === label ? ' active' : ''),
          onclick: () => {
            ex.knee = ex.knee === label ? '' : label;
            saveActiveWorkoutDraft();
            renderWorkout();
          }
        }, 'Knee: ' + label);
        chipsWrap.appendChild(chip);
      });
      card.appendChild(chipsWrap);
    }

    const notesInput = el('input', {
      type: 'text',
      class: 'meta-input',
      placeholder: 'Notes, form cue, machine used...',
      value: ex.notes,
      oninput: (e) => { ex.notes = e.target.value; saveActiveWorkoutDraft(); },
      style: 'margin-top:10px'
    });
    card.appendChild(notesInput);

    const sug = el('div', { class: 'suggestion-bar', style: 'display:none' });
    card.appendChild(sug);
    updateSuggestion(card, ex);

    wrap.appendChild(card);
  });

  wrap.appendChild(renderCardioCard('finisher'));
}

const originalFinishWorkoutHandler = null;

function finishActiveWorkout() {
  if (!activeWorkout) return;
  ensureWorkoutCardioShape();

  const toSave = {
    id: activeWorkout.id,
    routineId: activeWorkout.routineId,
    routineName: activeWorkout.routineName,
    date: activeWorkout.date,
    started: activeWorkout.started,
    finished: Date.now(),
    cardio: activeWorkout.cardio,
    exercises: activeWorkout.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      plannedName: ex.plannedName || ex.name,
      name: ex.name,
      sets: ex.sets,
      rpe: ex.rpe,
      knee: ex.knee,
      notes: ex.notes
    }))
  };

  const totalCompleted = toSave.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
  if (totalCompleted === 0 && !toSave.cardio.warmup.distance && !toSave.cardio.finisher.distance) {
    if (!confirm('No sets or bike distance are logged. Save anyway?')) return;
  }

  state.workouts.push(toSave);
  saveState();
  activeWorkout = null;
  clearActiveWorkoutDraft();
  toast('Workout saved');
  showWorkoutSummary(toSave);
}

function showWorkoutSummary(w) {
  const sets = getCompletedSetCount(w);
  const volume = Math.round(getWorkoutVolume(w));
  const warm = w.cardio && w.cardio.warmup && w.cardio.warmup.distance ? parseFloat(w.cardio.warmup.distance) : 0;
  const fin = w.cardio && w.cardio.finisher && w.cardio.finisher.distance ? parseFloat(w.cardio.finisher.distance) : 0;
  const msg = `${w.routineName} complete\n\n${sets} sets logged\n${volume.toLocaleString()} kg volume\n${(warm + fin).toFixed(2)} km bike total\n\nView in History?`;
  if (confirm(msg)) showPage('history');
  else showPage('home');
}

function renderStats() {
  const page = $('page-stats');
  const weekly = $('weekly-stats');
  weekly.innerHTML = '';

  const existingHero = page.querySelector('.stats-hero');
  if (existingHero) existingHero.remove();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = state.workouts.filter(w => new Date(w.date) >= weekAgo);
  const totalSets = recent.reduce((s,w) => s + getCompletedSetCount(w), 0);
  const totalVolume = recent.reduce((s,w) => s + getWorkoutVolume(w), 0);
  const totalBike = recent.reduce((s,w) => {
    const warm = w.cardio && w.cardio.warmup && w.cardio.warmup.distance ? parseFloat(w.cardio.warmup.distance) : 0;
    const fin = w.cardio && w.cardio.finisher && w.cardio.finisher.distance ? parseFloat(w.cardio.finisher.distance) : 0;
    return s + warm + fin;
  }, 0);

  const hero = el('div', { class: 'stats-hero' }, [
    el('div', { class: 'premium-kicker' }, 'Progress'),
    el('h1', {}, 'Your week'),
    el('div', { class: 'today-sub' }, 'Simple signals that show whether training is moving in the right direction.')
  ]);

  const firstSection = page.querySelector('.section-h');
  page.insertBefore(hero, firstSection.nextSibling);

  weekly.appendChild(el('div', { class: 'stat-card feature' }, [
    el('div', {}, [
      el('div', { class: 'label' }, 'Workouts'),
      el('div', { class: 'value' }, [String(recent.length), el('span', { class: 'unit' }, '/ 7d')]),
    ]),
    el('div', { class: 'workout-progress-pill' }, `${calcStreak()} active days`)
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Sets'),
    el('div', { class: 'value' }, String(totalSets)),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Volume'),
    el('div', { class: 'value' }, [String(Math.round(totalVolume).toLocaleString()), el('span', { class: 'unit' }, 'kg')]),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Bike'),
    el('div', { class: 'value' }, [totalBike.toFixed(1), el('span', { class: 'unit' }, 'km')]),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Best warm-up'),
    el('div', { class: 'value' }, [getBestBike('warmup'), el('span', { class: 'unit' }, 'km')]),
  ]));

  renderBodyweight();
  renderPRs();
  renderRecentWins();
}

function getBestBike(kind) {
  const entries = getCardioEntries(kind);
  if (entries.length === 0) return '—';
  return Math.max(...entries.map(e => parseFloat(e.distance) || 0)).toFixed(2);
}

function renderRecentWins() {
  let old = $('recent-wins-list');
  if (old) old.closest('.card')?.remove();

  const prsList = $('prs-list');
  const card = el('div', { class: 'card', style: 'border-radius:24px;margin-bottom:14px' }, [
    el('div', { class: 'premium-kicker' }, 'Recent wins'),
  ]);
  const list = el('div', { class: 'win-list', id: 'recent-wins-list' });

  const warm = getLastCardio('warmup');
  const fin = getLastCardio('finisher');
  const latestWorkout = [...state.workouts].sort((a,b) => (b.finished||0) - (a.finished||0))[0];

  const wins = [];
  if (latestWorkout) wins.push(`<strong>${latestWorkout.routineName}</strong> completed · ${getCompletedSetCount(latestWorkout)} sets`);
  if (warm && warm.distance) wins.push(`<strong>Warm-up bike</strong> latest · ${parseFloat(warm.distance).toFixed(2)}km`);
  if (fin && fin.distance) wins.push(`<strong>Finisher bike</strong> latest · ${parseFloat(fin.distance).toFixed(2)}km`);
  if (state.workouts.length >= 3) wins.push(`<strong>Consistency</strong> ${state.workouts.length} total workouts logged`);

  if (wins.length === 0) wins.push('Log a few sessions and your wins will appear here.');

  wins.slice(0,4).forEach(w => list.appendChild(el('div', { class: 'win-row', html: w })));
  card.appendChild(list);

  const prsSection = prsList.parentElement;
  prsSection.insertBefore(card, prsList);
}

function applyV13Setup() {
  const version = $('app-version-label');
  if (version) version.textContent = APP_VERSION + ' · Premium UI refresh';

  // Override old finish button listener by replacing node.
  const oldBtn = $('finish-workout-btn');
  if (oldBtn && !oldBtn.dataset.v13Bound) {
    const newBtn = oldBtn.cloneNode(true);
    newBtn.dataset.v13Bound = 'true';
    newBtn.addEventListener('click', finishActiveWorkout);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  }
}

applyV13Setup();
showPage('home');

/* ============================================================
   LIFT v1.3.1 — cleaner render overrides
   ============================================================ */

function renderHome() {
  const day = todayDay();
  const todayPlan = getWeeklyPlan().find(p => p.day === day);
  const todaysRoutine = getRoutineForToday();
  const hero = $('hero-today');

  hero.className = 'today-shell';
  hero.innerHTML = '';

  const todayCard = el('div', { class: 'today-card' });

  todayCard.appendChild(el('div', { class: 'today-kicker' },
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  ));

  if (!todaysRoutine) {
    todayCard.appendChild(el('div', { class: 'today-title' }, 'Rest day'));
    todayCard.appendChild(el('div', { class: 'today-sub' }, 'Friday is your recovery day. Keep it light, stay mobile, and be ready for Saturday.'));
    todayCard.appendChild(el('div', { class: 'today-mini-grid' }, [
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Today'),
        el('div', { class: 'value' }, todayPlan ? todayPlan.routine : 'Rest')
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Next session'),
        el('div', { class: 'value' }, 'Pull B')
      ])
    ]));
  } else {
    const last = getLastWorkoutForRoutine(todaysRoutine.name);

    todayCard.appendChild(el('div', { class: 'today-title' }, todaysRoutine.name));
    todayCard.appendChild(el('div', { class: 'today-sub' },
      `${todaysRoutine.tag || 'Training'} · ${todaysRoutine.exercises.length} exercises · bike warm-up and finisher`
    ));

    todayCard.appendChild(el('div', { class: 'today-mini-grid' }, [
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Warm-up'),
        el('div', { class: 'value' }, `Bike · ${getCardioTarget('warmup').toFixed(2)}km target`)
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Finisher'),
        el('div', { class: 'value' }, `10 min · ${getCardioTarget('finisher').toFixed(2)}km target`)
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Last done'),
        el('div', { class: 'value' }, last ? fmtShortDate(last.date) : 'First session')
      ]),
      el('div', { class: 'today-mini' }, [
        el('div', { class: 'label' }, 'Last volume'),
        el('div', { class: 'value' }, last ? `${Math.round(getWorkoutVolume(last)).toLocaleString()}kg` : '—')
      ])
    ]));

    todayCard.appendChild(el('button', {
      class: 'btn btn-primary',
      onclick: () => startWorkout(todaysRoutine.id)
    }, `Start ${todaysRoutine.name}`));
  }

  hero.appendChild(todayCard);

  const weekCard = el('div', { class: 'card', style: 'border-radius:26px;padding:18px;margin-bottom:4px;' }, [
    el('div', { class: 'premium-kicker', style: 'color:var(--text-muted)' }, 'Weekly rhythm')
  ]);

  const strip = el('div', { class: 'week-strip' });
  getWeeklyPlan().forEach(p => {
    strip.appendChild(el('div', {
      class: 'week-day-pill' + (p.day === day ? ' active' : '') + (p.rest ? ' rest' : '')
    }, [
      el('div', { class: 'd' }, p.day),
      el('div', { class: 'r' }, p.short)
    ]));
  });
  weekCard.appendChild(strip);
  hero.appendChild(weekCard);

  const sectionTitle = document.querySelector('#page-home .section-h h2');
  if (sectionTitle) sectionTitle.textContent = 'All routines';

  const list = $('routine-list');
  list.innerHTML = '';

  const dayOrder = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7, '': 8 };
  const sorted = [...state.routines].sort((a,b) => (dayOrder[a.day]||9) - (dayOrder[b.day]||9));

  for (const r of sorted) {
    const row = el('div', { class: 'routine-row', onclick: () => startWorkout(r.id) }, [
      el('div', {}, [
        el('div', { class: 'routine-row-name' }, r.name),
        el('div', { class: 'routine-row-meta' }, `${r.exercises.length} exercises · ${r.tag || '—'}`),
      ]),
      el('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        el('div', { class: 'routine-row-day' }, r.day || '—'),
        el('button', {
          class: 'icon-btn',
          onclick: (e) => { e.stopPropagation(); editRoutine(r.id); },
          'aria-label': 'Edit'
        }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' })])
      ])
    ]);
    list.appendChild(row);
  }
}

function renderStats() {
  const page = $('page-stats');
  const weekly = $('weekly-stats');
  weekly.innerHTML = '';

  page.querySelectorAll('.stats-hero').forEach(n => n.remove());

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recent = state.workouts.filter(w => new Date(w.date) >= weekAgo);
  const totalSets = recent.reduce((s,w) => s + getCompletedSetCount(w), 0);
  const totalVolume = recent.reduce((s,w) => s + getWorkoutVolume(w), 0);
  const totalBike = recent.reduce((s,w) => {
    const warm = w.cardio && w.cardio.warmup && w.cardio.warmup.distance ? parseFloat(w.cardio.warmup.distance) : 0;
    const fin = w.cardio && w.cardio.finisher && w.cardio.finisher.distance ? parseFloat(w.cardio.finisher.distance) : 0;
    return s + warm + fin;
  }, 0);

  const hero = el('div', { class: 'stats-hero' }, [
    el('div', { class: 'premium-kicker' }, 'Progress'),
    el('h1', {}, 'Your week'),
    el('div', { class: 'today-sub' }, 'A simple view of consistency, strength and conditioning.')
  ]);

  const firstSection = page.querySelector('.section-h');
  page.insertBefore(hero, firstSection ? firstSection.nextSibling : page.firstChild);

  weekly.appendChild(el('div', { class: 'stat-card feature' }, [
    el('div', {}, [
      el('div', { class: 'label' }, 'Workouts'),
      el('div', { class: 'value' }, [String(recent.length), el('span', { class: 'unit' }, '/ 7d')]),
      el('div', { class: 'delta' }, `${calcStreak()} active days`)
    ]),
    el('div', { class: 'workout-progress-pill' }, recent.length >= 4 ? 'On track' : 'Build rhythm')
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Sets'),
    el('div', { class: 'value' }, String(totalSets)),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Volume'),
    el('div', { class: 'value' }, [String(Math.round(totalVolume).toLocaleString()), el('span', { class: 'unit' }, 'kg')]),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Bike'),
    el('div', { class: 'value' }, [totalBike.toFixed(1), el('span', { class: 'unit' }, 'km')]),
  ]));

  weekly.appendChild(el('div', { class: 'stat-card' }, [
    el('div', { class: 'label' }, 'Best warm-up'),
    el('div', { class: 'value' }, [getBestBike('warmup'), el('span', { class: 'unit' }, 'km')]),
  ]));

  renderBodyweight();
  renderPRs();
  renderRecentWins();
}

applyV13Setup();
showPage('home');
