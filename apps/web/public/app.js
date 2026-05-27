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
const welcomeTitle = document.getElementById('welcomeTitle');
const roleLine = document.getElementById('roleLine');
const logoutButton = document.getElementById('logoutButton');
const publicSections = () => document.querySelectorAll('.public-section');
const dashboardView = document.querySelector('.dashboard-view');

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
}

function showDashboardPanel(role) {
  document.body.classList.add('dashboard-mode');
  window.location.hash = role === 'admin' ? 'admin-dashboard' : 'member-dashboard';
  publicSections().forEach((section) => {
    section.hidden = true;
  });
  authPanel.hidden = true;
  dashboardCard.hidden = false;
  dashboardView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

function renderAdmin(view) {
  const members = view.members || [];
  const overview = view.overview || {};

  dashboard.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><span>Total members</span><strong>${overview.totalMembers || 0}</strong></div>
      <div class="metric"><span>Total offers</span><strong>${overview.totalOffers || 0}</strong></div>
      <div class="metric"><span>Attendance records</span><strong>${overview.attendanceRecords || 0}</strong></div>
    </div>

    <div class="dashboard-grid">
      <section class="subcard">
        <div class="section-head compact">
          <div>
            <p class="eyebrow small">Admin control</p>
            <h3>Add member</h3>
          </div>
        </div>
        <form id="memberForm" class="stack compact">
          <input name="name" placeholder="Member name" required />
          <input name="email" type="email" placeholder="Member email" required />
          <input name="goal" placeholder="Training goal" />
          <input name="exercisePlan" placeholder="Exercise plan" />
          <input name="dietPlan" placeholder="Diet plan" />
          <button type="submit">Create member</button>
        </form>
      </section>

      <section class="subcard">
        <div class="section-head compact">
          <div>
            <p class="eyebrow small">Member roster</p>
            <h3>Members</h3>
          </div>
        </div>
        <div class="list">
          ${members
            .map(
              (member) => `
                <article class="list-item">
                  <div>
                    <strong>${member.name}</strong>
                    <p class="muted">${member.email}</p>
                    <p class="muted">Goal: ${member.goal || 'Not set'}</p>
                    <p class="muted">Exercise: ${member.exercisePlan || 'Not assigned'}</p>
                    <p class="muted">Diet: ${member.dietPlan || 'Not assigned'}</p>
                  </div>
                  <div class="actions">
                    <button data-attendance="${member.id}">Mark attendance</button>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </section>
    </div>
  `;

  document.getElementById('memberForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await request(`${API_URL}/admin/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    await loadDashboard();
  });

  dashboard.querySelectorAll('[data-attendance]').forEach((button) => {
    button.addEventListener('click', async () => {
      await request(`${API_URL}/admin/attendance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ memberId: button.dataset.attendance }),
      });
      await loadDashboard();
    });
  });
}

function renderMember(view) {
  const member = view.member;
  const attendance = member?.attendance || [];
  const offers = view.offers || [];

  dashboard.innerHTML = `
    <div class="dashboard-grid member-layout">
      <section class="subcard profile-panel">
        <div class="section-head compact">
          <div>
            <p class="eyebrow small">Member view</p>
            <h3>Your profile</h3>
          </div>
        </div>
        <p class="profile-name">${member?.name || 'Member'}</p>
        <p class="muted">${member?.email || ''}</p>
        <div class="profile-chip-row">
          <span>Goal: ${member?.goal || 'Not set'}</span>
          <span>Exercise: ${member?.exercisePlan || 'Not assigned'}</span>
          <span>Diet: ${member?.dietPlan || 'Not assigned'}</span>
        </div>
      </section>

      <section class="subcard">
        <div class="section-head compact">
          <div>
            <p class="eyebrow small">Movement</p>
            <h3>Attendance</h3>
          </div>
        </div>
        <ul class="plain-list">
          ${attendance.map((item) => `<li>${item.date} - ${item.status}</li>`).join('') || '<li>No attendance yet</li>'}
        </ul>
      </section>

      <section class="subcard offers-panel">
        <div class="section-head compact">
          <div>
            <p class="eyebrow small">Membership</p>
            <h3>Offers</h3>
          </div>
        </div>
        <div class="offer-stack">
          ${offers
            .map(
              (offer) => `
                <article class="offer-item">
                  <strong>${offer.title}</strong>
                  <p>${offer.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </section>
    </div>
  `;
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
  dashboardCard.dataset.role = me.role;
  showDashboardPanel(me.role);

  if (me.role === 'admin') {
    const [overview, members] = await Promise.all([
      request(`${API_URL}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } }),
      request(`${API_URL}/admin/members`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    renderAdmin({ overview, members: members.members });
    return;
  }

  const view = await request(`${API_URL}/member/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  renderMember(view);
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  signupStatus.textContent = 'Creating your Zeon account...';

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
    await loadDashboard();
  } catch (error) {
    signupStatus.textContent = error.message;
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Signing in...';

  try {
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const result = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setToken(result.token);
    loginStatus.textContent = 'Signed in successfully.';
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
});

loadDashboard().catch((error) => {
  loginStatus.textContent = error.message;
});

renderLandingOffers();
