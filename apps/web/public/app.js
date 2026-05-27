const AUTH_URL = 'http://localhost:4001';
const API_URL = 'http://localhost:4000';

const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const dashboardCard = document.getElementById('dashboardCard');
const dashboard = document.getElementById('dashboard');
const welcomeTitle = document.getElementById('welcomeTitle');
const roleLine = document.getElementById('roleLine');
const logoutButton = document.getElementById('logoutButton');

function getToken() {
  return localStorage.getItem('gym-token');
}

function setToken(token) {
  localStorage.setItem('gym-token', token);
}

function clearToken() {
  localStorage.removeItem('gym-token');
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
    <div class="grid two">
      <div class="metric"><span>Total members</span><strong>${overview.totalMembers || 0}</strong></div>
      <div class="metric"><span>Total offers</span><strong>${overview.totalOffers || 0}</strong></div>
    </div>

    <section class="subcard">
      <h3>Add member</h3>
      <form id="memberForm" class="stack compact">
        <input name="name" placeholder="Member name" required />
        <input name="email" type="email" placeholder="Member email" required />
        <input name="exercisePlan" placeholder="Exercise plan" />
        <input name="dietPlan" placeholder="Diet plan" />
        <button type="submit">Create member</button>
      </form>
    </section>

    <section class="subcard">
      <h3>Members</h3>
      <div class="list">
        ${members
          .map(
            (member) => `
              <article class="list-item">
                <div>
                  <strong>${member.name}</strong>
                  <p class="muted">${member.email}</p>
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
    <section class="subcard">
      <h3>Your profile</h3>
      <p><strong>${member?.name || 'Member'}</strong></p>
      <p class="muted">${member?.email || ''}</p>
      <p class="muted">Exercise plan: ${member?.exercisePlan || 'Not assigned'}</p>
      <p class="muted">Diet plan: ${member?.dietPlan || 'Not assigned'}</p>
    </section>

    <div class="grid two">
      <section class="subcard">
        <h3>Attendance</h3>
        <ul class="plain-list">
          ${attendance.map((item) => `<li>${item.date} - ${item.status}</li>`).join('') || '<li>No attendance yet</li>'}
        </ul>
      </section>
      <section class="subcard">
        <h3>Offers</h3>
        <ul class="plain-list">
          ${offers.map((offer) => `<li><strong>${offer.title}</strong><br /><span class="muted">${offer.description}</span></li>`).join('')}
        </ul>
      </section>
    </div>
  `;
}

async function loadDashboard() {
  const token = getToken();
  if (!token) {
    dashboardCard.hidden = true;
    return;
  }

  const me = await request(`${AUTH_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  welcomeTitle.textContent = `Welcome, ${me.name}`;
  roleLine.textContent = `Role: ${me.role}`;
  dashboardCard.hidden = false;

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
  dashboardCard.hidden = true;
  dashboard.innerHTML = '';
  loginStatus.textContent = 'Logged out.';
});

loadDashboard().catch((error) => {
  loginStatus.textContent = error.message;
});
