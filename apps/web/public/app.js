const AUTH_URL = 'http://localhost:4001';
const API_URL = 'http://localhost:4000';

const authPanel = document.getElementById('authPanel');
const signupForm = document.getElementById('signupForm');
const signupStatus = document.getElementById('signupStatus');
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const dashboardCard = document.getElementById('dashboardCard');
const dashboard = document.getElementById('dashboard');
const landingOffers = document.getElementById('landingOffers');
const breadcrumbBar = document.getElementById('breadcrumbBar');
const welcomeTitle = document.getElementById('welcomeTitle');
const roleLine = document.getElementById('roleLine');
const logoutButton = document.getElementById('logoutButton');
const publicSections = () => document.querySelectorAll('.public-section');
const dashboardView = document.querySelector('.dashboard-view');
const interactiveSelector = 'button, .primary-link, .ghost-link, .offer-cta, .nav-links a';

const breadcrumbPresets = {
  public: ['Home', 'About', 'Offers'],
  signup: ['Home', 'Sign up', 'Create account'],
  login: ['Home', 'Login', 'Sign in'],
  admin: ['Home', 'Dashboard', 'Admin center'],
  member: ['Home', 'Dashboard', 'Member center'],
  adminAction: ['Home', 'Dashboard', 'Admin center', 'Members'],
  memberAction: ['Home', 'Dashboard', 'Member center', 'Offers'],
  logout: ['Home', 'Login'],
};

function flashInteractive(element) {
  if (!element) {
    return;
  }

  element.classList.add('is-pressed');
  window.setTimeout(() => {
    element.classList.remove('is-pressed');
  }, 180);
}

function renderBreadcrumbs(items) {
  breadcrumbBar.innerHTML = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      return `
        <span class="crumb ${isLast ? 'current' : ''}">${item}</span>
        ${isLast ? '' : '<span class="crumb-divider">/</span>'}
      `;
    })
    .join('');
}

function findSubmitButtonFromEvent(event) {
  if (!event) return null;
  const container = event.currentTarget || event.target || null;
  if (container && typeof container.querySelector === 'function') {
    return container.querySelector('button[type="submit"], button');
  }
  // fallback: try to find a focused button or the first button inside the form elements
  if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
    return document.activeElement;
  }
  return null;
}

function setTrail(key, detail) {
  if (key === 'adminAction' && detail) {
    renderBreadcrumbs(['Home', 'Dashboard', 'Admin center', detail]);
    return;
  }

  if (key === 'memberAction' && detail) {
    renderBreadcrumbs(['Home', 'Dashboard', 'Member center', detail]);
    return;
  }

  renderBreadcrumbs(breadcrumbPresets[key] || breadcrumbPresets.public);
}

function getToken() {
  return localStorage.getItem('gym-token');
}

function setToken(token) {
  localStorage.setItem('gym-token', token);
}

function clearToken() {
  localStorage.removeItem('gym-token');
}

function renderLandingOffers() {
  const offers = [
    {
      title: 'First Month Discount',
      description: 'New members get 20% off their first month.',
      cta: 'Join now',
    },
    {
      title: 'Strength Package',
      description: 'Built for serious lifters who want consistent progress.',
      cta: 'See details',
    },
    {
      title: 'Recovery Access',
      description: 'Priority recovery and mobility access for premium members.',
      cta: 'Upgrade membership',
    },
  ];

  landingOffers.innerHTML = offers
    .map(
      (offer) => `
        <article class="offer-card">
          <p class="eyebrow small">Offer</p>
          <h3>${offer.title}</h3>
          <p>${offer.description}</p>
          <a class="offer-cta" href="#authPanel">${offer.cta}</a>
        </article>
      `,
    )
    .join('');
}

function showAuthPanel() {
  document.body.classList.remove('dashboard-mode');
  window.location.hash = 'home';
  publicSections().forEach((section) => {
    section.hidden = false;
  });
  authPanel.hidden = false;
  dashboardCard.hidden = true;
  dashboardCard.dataset.role = '';
  setTrail('public');
}

function showDashboardPanel(role) {
  document.body.classList.add('dashboard-mode');
  window.location.hash = role === 'admin' ? 'admin-dashboard' : 'member-dashboard';
  publicSections().forEach((section) => {
    section.hidden = true;
  });
  authPanel.hidden = true;
  dashboardCard.hidden = false;
  dashboardCard.dataset.role = role;
  setTrail(role === 'admin' ? 'admin' : 'member');
  dashboardView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', (event) => {
  const target = event.target.closest(interactiveSelector);
  if (target) {
    flashInteractive(target);
    if (target.matches('.nav-links a')) {
      const label = target.textContent.trim().toLowerCase();
      if (label.includes('sign up')) {
        setTrail('signup');
      } else if (label.includes('login')) {
        setTrail('login');
      } else if (label.includes('offers')) {
        setTrail('public');
      } else {
        setTrail('public');
      }
    } else if (target.matches('.primary-link')) {
      setTrail('signup');
    } else if (target.matches('.ghost-link')) {
      setTrail('public');
    } else if (target.matches('.offer-cta')) {
      setTrail('signup');
    }
  }
});

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || 'Request failed');
  }
  return body;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const dashboardState = {
  selectedMemberId: null,
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getSelectedMember(members) {
  if (!members.length) {
    return null;
  }

  return (
    members.find((member) => member.id === dashboardState.selectedMemberId) || members[0]
  );
}

function renderWeeklyPlanEditor(member, readOnly = false) {
  const days = member?.weeklyPlan?.days || WEEKDAYS.map((day) => ({
    day,
    workout: '',
    diet: '',
    exerciseList: '',
    imageUrl: '',
    videoUrl: '',
  }));
  const notes = member?.weeklyPlan?.notes || '';

  return `
    <form id="weeklyPlanForm" class="stack planner-form">
      <label>
        Weekly notes
        <textarea name="notes" rows="3" ${readOnly ? 'readonly' : ''} placeholder="High-level training and diet notes">${escapeHtml(notes)}</textarea>
      </label>
      <div class="planner-grid">
        ${days
          .map(
            (day, index) => `
              <article class="day-card">
                <div class="section-head compact">
                  <div>
                    <p class="eyebrow small">Day ${index + 1}</p>
                    <h4>${escapeHtml(day.day)}</h4>
                  </div>
                </div>
                <label>
                  Workout
                  <input name="workout-${index}" value="${escapeHtml(day.workout)}" ${readOnly ? 'readonly' : ''} placeholder="Chest + triceps" />
                </label>
                <label>
                  Diet
                  <input name="diet-${index}" value="${escapeHtml(day.diet)}" ${readOnly ? 'readonly' : ''} placeholder="High protein meals" />
                </label>
                <label>
                  Exercise list
                  <textarea name="exerciseList-${index}" rows="3" ${readOnly ? 'readonly' : ''} placeholder="Bench press, fly, dips">${escapeHtml(day.exerciseList)}</textarea>
                </label>
                <div class="media-grid">
                  <label>
                    Image URL
                    <input name="imageUrl-${index}" value="${escapeHtml(day.imageUrl)}" ${readOnly ? 'readonly' : ''} placeholder="https://..." />
                  </label>
                  <label>
                    Video URL
                    <input name="videoUrl-${index}" value="${escapeHtml(day.videoUrl)}" ${readOnly ? 'readonly' : ''} placeholder="https://..." />
                  </label>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
      ${readOnly ? '' : '<button type="submit">Save weekly plan</button>'}
    </form>
  `;
}

function renderSubscriptionManager(member, readOnly = false) {
  const subscriptions = member?.subscriptions || [];

  return `
    <div class="subscription-manager">
      ${readOnly
        ? ''
        : `
          <form id="newSubscriptionForm" class="stack compact">
            <input name="label" placeholder="Subscription label" />
            <input name="startDate" type="date" />
            <input name="endDate" type="date" />
            <select name="status">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            <button type="submit">Create subscription</button>
          </form>
        `}
      <div class="subscription-list">
        ${subscriptions
          .map(
            (subscription) => `
              <article class="subscription-card">
                <div class="section-head compact">
                  <div>
                    <p class="eyebrow small">Subscription</p>
                    <h4>${escapeHtml(subscription.label)}</h4>
                  </div>
                  <span class="status-pill">${escapeHtml(subscription.status)}</span>
                </div>
                <div class="subscription-dates">
                  <label>
                    Start date
                    <input name="startDate-${subscription.id}" type="date" value="${escapeHtml(subscription.startDate)}" ${readOnly ? 'readonly' : ''} />
                  </label>
                  <label>
                    End date
                    <input name="endDate-${subscription.id}" type="date" value="${escapeHtml(subscription.endDate)}" ${readOnly ? 'readonly' : ''} />
                  </label>
                </div>
                ${readOnly ? '' : `<div class="actions"><button type="button" data-save-subscription="${subscription.id}">Save date</button><button type="button" class="secondary" data-delete-subscription="${subscription.id}">Delete</button></div>`}
              </article>
            `,
          )
          .join('') || '<p class="muted">No subscriptions yet.</p>'}
      </div>
    </div>
  `;
}

function collectWeeklyPlan(form) {
  const formData = new FormData(form);
  return {
    notes: formData.get('notes') || '',
    days: WEEKDAYS.map((day, index) => ({
      day,
      workout: formData.get(`workout-${index}`) || '',
      diet: formData.get(`diet-${index}`) || '',
      exerciseList: formData.get(`exerciseList-${index}`) || '',
      imageUrl: formData.get(`imageUrl-${index}`) || '',
      videoUrl: formData.get(`videoUrl-${index}`) || '',
    })),
  };
}

function renderDashboardShell(title, subtitle, statsMarkup, panelsMarkup) {
  dashboard.innerHTML = `
    <section class="dashboard-shell">
      <header class="dashboard-header card">
        <div>
          <p class="eyebrow small">${title}</p>
          <h2>${subtitle}</h2>
        </div>
      </header>

      ${statsMarkup}

      <div class="dashboard-grid dashboard-grid-three">
        ${panelsMarkup}
      </div>
    </section>
  `;
}

function renderAdmin(view) {
  const members = (view.members || []).map((member) => ({
    ...member,
    subscriptions: member.subscriptions || [],
    weeklyPlan: member.weeklyPlan || { notes: '', days: WEEKDAYS.map((day) => ({ day, workout: '', diet: '', exerciseList: '', imageUrl: '', videoUrl: '' })) },
  }));
  const overview = view.overview || {};

  if (!dashboardState.selectedMemberId || !members.some((member) => member.id === dashboardState.selectedMemberId)) {
    dashboardState.selectedMemberId = members[0]?.id || null;
  }

  const selectedMember = getSelectedMember(members);
  const statsMarkup = `
    <div class="metric-grid">
      <div class="metric"><span>Total members</span><strong>${overview.totalMembers || 0}</strong></div>
      <div class="metric"><span>Total offers</span><strong>${overview.totalOffers || 0}</strong></div>
      <div class="metric"><span>Attendance records</span><strong>${overview.attendanceRecords || 0}</strong></div>
    </div>
  `;

  const panelsMarkup = `
    <section class="subcard roster-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Member roster</p>
          <h3>All members</h3>
        </div>
      </div>
      <div class="list roster-list">
        ${members
          .map(
            (member) => `
              <article class="list-item ${member.id === selectedMember?.id ? 'selected' : ''}">
                <button type="button" class="member-pick" data-member-select="${member.id}">
                  <strong>${escapeHtml(member.name)}</strong>
                  <p class="muted">${escapeHtml(member.email)}</p>
                  <p class="muted">Goal: ${escapeHtml(member.goal || 'Not set')}</p>
                </button>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>

    <section class="subcard editor-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Member details</p>
          <h3>${selectedMember ? escapeHtml(selectedMember.name) : 'Select a member'}</h3>
        </div>
      </div>
      ${selectedMember ? `
        <form id="memberEditorForm" class="stack">
          <div class="grid two">
            <label>Full name<input name="name" value="${escapeHtml(selectedMember.name)}" /></label>
            <label>Email<input name="email" type="email" value="${escapeHtml(selectedMember.email)}" /></label>
          </div>
          <label>Goal<input name="goal" value="${escapeHtml(selectedMember.goal || '')}" /></label>
          <label>Exercise plan<input name="exercisePlan" value="${escapeHtml(selectedMember.exercisePlan || '')}" /></label>
          <label>Diet plan<input name="dietPlan" value="${escapeHtml(selectedMember.dietPlan || '')}" /></label>
          <div class="actions">
            <button type="submit">Save details</button>
            <button type="button" class="secondary" id="deleteMemberButton">Delete member</button>
          </div>
        </form>
        <div class="selected-member-meta">
          <span>Subscription count: ${selectedMember.subscriptions.length}</span>
          <span>Plan days: ${selectedMember.weeklyPlan.days.length}</span>
        </div>
        <div class="section-head compact section-gap">
          <div>
            <p class="eyebrow small">Subscriptions</p>
            <h4>Manage subscription</h4>
          </div>
        </div>
        ${renderSubscriptionManager(selectedMember, false)}
      ` : '<p class="muted">No member available.</p>'}
    </section>

    <section class="subcard plan-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Training plan</p>
          <h3>Weekly planner</h3>
        </div>
      </div>
      ${selectedMember ? renderWeeklyPlanEditor(selectedMember, false) : '<p class="muted">No member selected.</p>'}
    </section>
  `;

  renderDashboardShell('Admin control center', 'Shared dashboard shell', statsMarkup, panelsMarkup);

  dashboard.querySelectorAll('[data-member-select]').forEach((button) => {
    button.addEventListener('click', async () => {
      dashboardState.selectedMemberId = button.dataset.memberSelect;
      const selected = members.find((member) => member.id === dashboardState.selectedMemberId);
      setTrail('adminAction');
      if (selected) {
        renderBreadcrumbs(['Home', 'Dashboard', 'Admin center', selected.name]);
      }
      flashInteractive(button);
      await loadDashboard();
    });
  });

  const memberEditorForm = document.getElementById('memberEditorForm');
  if (memberEditorForm && selectedMember) {
    memberEditorForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setTrail('adminAction');
      flashInteractive(findSubmitButtonFromEvent(event));
      const form = new FormData(event.currentTarget);
      await request(`${API_URL}/admin/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      await loadDashboard();
    });
  }

  const deleteMemberButton = document.getElementById('deleteMemberButton');
  if (deleteMemberButton && selectedMember) {
    deleteMemberButton.addEventListener('click', async () => {
      setTrail('adminAction');
      flashInteractive(deleteMemberButton);
      await request(`${API_URL}/admin/members/${selectedMember.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      dashboardState.selectedMemberId = null;
      await loadDashboard();
    });
  }

  const weeklyPlanForm = document.getElementById('weeklyPlanForm');
  if (weeklyPlanForm && selectedMember) {
    weeklyPlanForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setTrail('adminAction');
      flashInteractive(findSubmitButtonFromEvent(event));
      const plan = collectWeeklyPlan(event.currentTarget);
      await request(`${API_URL}/admin/members/${selectedMember.id}/weekly-plan`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(plan),
      });
      await loadDashboard();
    });
  }

  const newSubscriptionForm = document.getElementById('newSubscriptionForm');
  if (newSubscriptionForm && selectedMember) {
    newSubscriptionForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setTrail('adminAction');
      flashInteractive(findSubmitButtonFromEvent(event));
      const form = new FormData(event.currentTarget);
      await request(`${API_URL}/admin/members/${selectedMember.id}/subscriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      await loadDashboard();
    });
  }

  dashboard.querySelectorAll('[data-save-subscription]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!selectedMember) {
        return;
      }
      const subscriptionId = button.dataset.saveSubscription;
      const startDate = dashboard.querySelector(`input[name="startDate-${subscriptionId}"]`)?.value || '';
      const endDate = dashboard.querySelector(`input[name="endDate-${subscriptionId}"]`)?.value || '';
      setTrail('adminAction');
      flashInteractive(button);
      await request(`${API_URL}/admin/members/${selectedMember.id}/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ startDate, endDate }),
      });
      await loadDashboard();
    });
  });

  dashboard.querySelectorAll('[data-delete-subscription]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!selectedMember) {
        return;
      }
      setTrail('adminAction');
      flashInteractive(button);
      await request(`${API_URL}/admin/members/${selectedMember.id}/subscriptions/${button.dataset.deleteSubscription}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await loadDashboard();
    });
  });
}

function renderMember(view) {
  const member = view.member;
  const attendance = member?.attendance || [];
  const offers = view.offers || [];
  const subscriptions = member?.subscriptions || [];

  const statsMarkup = `
    <div class="metric-grid">
      <div class="metric"><span>Attendance logs</span><strong>${attendance.length}</strong></div>
      <div class="metric"><span>Subscriptions</span><strong>${subscriptions.length}</strong></div>
      <div class="metric"><span>Offers</span><strong>${offers.length}</strong></div>
    </div>
  `;

  const panelsMarkup = `
    <section class="subcard profile-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Member dashboard</p>
          <h3>${escapeHtml(member?.name || 'Member')}</h3>
        </div>
      </div>
      <p class="profile-name">${escapeHtml(member?.name || 'Member')}</p>
      <p class="muted">${escapeHtml(member?.email || '')}</p>
      <div class="profile-chip-row">
        <span>Goal: ${escapeHtml(member?.goal || 'Not set')}</span>
        <span>Exercise: ${escapeHtml(member?.exercisePlan || 'Not assigned')}</span>
        <span>Diet: ${escapeHtml(member?.dietPlan || 'Not assigned')}</span>
      </div>
      <div class="selected-member-meta">
        <span>Role: member</span>
        <span>Weekly plan: ${member?.weeklyPlan?.days?.length || 7} days</span>
      </div>
    </section>

    <section class="subcard plan-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Training plan</p>
          <h3>Weekly overview</h3>
        </div>
      </div>
      ${renderWeeklyPlanEditor(member, true)}
    </section>

    <section class="subcard offers-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow small">Membership</p>
          <h3>Subscriptions and offers</h3>
        </div>
      </div>
      ${renderSubscriptionManager(member, true)}
      <div class="offer-stack">
        ${offers
          .map(
            (offer) => `
              <article class="offer-item">
                <strong>${escapeHtml(offer.title)}</strong>
                <p>${escapeHtml(offer.description)}</p>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;

  renderDashboardShell('Member control center', 'Shared dashboard shell', statsMarkup, panelsMarkup);
}

async function loadDashboard() {
  const token = getToken();
  if (!token) {
    showAuthPanel();
    return;
  }

  const me = await request(`${AUTH_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  welcomeTitle.textContent = me.role === 'admin' ? 'Admin control center' : 'Member control center';
  roleLine.textContent = `Role: ${me.role}`;
  showDashboardPanel(me.role);

  if (me.role === 'admin') {
    const [overview, members] = await Promise.all([
      request(`${API_URL}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } }),
      request(`${API_URL}/admin/members`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    renderAdmin({ overview, members: members.members });
    setTrail('admin');
    return;
  }

  const view = await request(`${API_URL}/member/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  renderMember(view);
  setTrail('member');
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  signupStatus.textContent = 'Creating your Zeon account...';
  setTrail('signup');

  try {
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const result = await request(`${AUTH_URL}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    setToken(result.token);
    await request(`${API_URL}/member/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${result.token}` },
      body: JSON.stringify({ goal: body.goal }),
    });

    signupStatus.textContent = 'Your account is ready.';
      flashInteractive(findSubmitButtonFromEvent(event));
    await loadDashboard();
  } catch (error) {
    signupStatus.textContent = error.message;
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Signing in...';
  setTrail('login');

  try {
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const result = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setToken(result.token);
    loginStatus.textContent = 'Signed in successfully.';
      flashInteractive(findSubmitButtonFromEvent(event));
    await loadDashboard();
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});

logoutButton.addEventListener('click', () => {
  clearToken();
  showAuthPanel();
  dashboard.innerHTML = '';
  loginStatus.textContent = 'Logged out.';
  setTrail('logout');
});

loadDashboard().catch((error) => {
  loginStatus.textContent = error.message;
});

renderLandingOffers();
setTrail('public');
