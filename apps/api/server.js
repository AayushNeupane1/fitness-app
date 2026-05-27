const http = require('node:http');
const { URL } = require('node:url');
const { verifyToken } = require('../../packages/shared/token');

const PORT = Number(process.env.API_SERVICE_PORT || 4000);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev-auth-secret';
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const state = {
  members: [
    {
      id: 'member-1',
      name: 'Member User',
      email: 'member@gym.local',
      role: 'member',
      goal: 'Build consistency and strength',
      attendance: [{ date: '2026-05-27', status: 'present' }],
      exercisePlan: 'Upper body strength',
      dietPlan: 'High protein meal plan',
      subscriptions: [
        {
          id: 'sub-1',
          label: 'Monthly starter',
          startDate: '2026-05-01',
          endDate: '2026-06-01',
          status: 'active',
        },
      ],
      weeklyPlan: {
        notes: 'Focused on strength and mobility.',
        days: WEEKDAYS.map((day, index) => ({
          day,
          workout: index < 3 ? 'Upper body strength' : 'Active recovery',
          diet: index < 3 ? 'High protein meal plan' : 'Balanced meals',
          exerciseList: index < 3 ? 'Bench press, rows, overhead press' : 'Walk, stretch, mobility',
          imageUrl: '',
          videoUrl: '',
        })),
      },
    },
  ],
  offers: [
    { id: 'offer-1', title: 'First Month Discount', description: '20% off for new members' },
  ],
};

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function parsePath(req) {
  return new URL(req.url, 'http://localhost').pathname;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
}

function authenticate(req) {
  const token = getBearerToken(req);
  return verifyToken(token, JWT_SECRET);
}

function requireRole(req, allowedRoles) {
  const user = authenticate(req);
  if (!allowedRoles.includes(user.role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

function createWeeklyPlan() {
  return {
    notes: '',
    days: WEEKDAYS.map((day) => ({
      day,
      workout: '',
      diet: '',
      exerciseList: '',
      imageUrl: '',
      videoUrl: '',
    })),
  };
}

function normalizeMember(member) {
  return {
    ...member,
    subscriptions: member.subscriptions || [],
    weeklyPlan: member.weeklyPlan || createWeeklyPlan(),
    attendance: member.attendance || [],
  };
}

function ensureMemberProfile(user, goal = '') {
  let member = state.members.find((item) => item.email === user.email);

  if (!member) {
    member = {
      id: `member-${Date.now()}`,
      name: user.name,
      email: user.email,
      role: 'member',
      goal,
      attendance: [],
      exercisePlan: '',
      dietPlan: '',
      subscriptions: [],
      weeklyPlan: createWeeklyPlan(),
    };
    state.members.push(member);
  }

  return normalizeMember(member);
}

function getMemberById(memberId) {
  return state.members.find((member) => member.id === memberId) || null;
}

function getSubscriptionById(member, subscriptionId) {
  return (member.subscriptions || []).find((subscription) => subscription.id === subscriptionId) || null;
}

const server = http.createServer(async (req, res) => {
  const pathname = parsePath(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  if (pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'api' });
    return;
  }

  if (pathname === '/me' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const member = normalizeMember(state.members.find((item) => item.email === user.email) || null);
      sendJson(res, 200, {
        user,
        member: member || null,
        offers: state.offers,
      });
    } catch (error) {
      sendJson(res, 401, { message: 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/member/profile' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const body = await readJson(req);
      const member = ensureMemberProfile(user, body.goal || '');
      member.name = user.name || member.name;
      member.goal = body.goal || member.goal || '';
      sendJson(res, 200, { member });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/member/dashboard' && req.method === 'GET') {
    try {
      const user = requireRole(req, ['member']);
      const member = ensureMemberProfile(user);
      sendJson(res, 200, { member, offers: state.offers });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/admin/overview' && req.method === 'GET') {
    try {
      requireRole(req, ['admin']);
      sendJson(res, 200, {
        totalMembers: state.members.length,
        totalOffers: state.offers.length,
        attendanceRecords: state.members.reduce((count, member) => count + member.attendance.length, 0),
      });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/admin/members' && req.method === 'GET') {
    try {
      requireRole(req, ['admin']);
      sendJson(res, 200, { members: state.members.map(normalizeMember) });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname.startsWith('/admin/members/') && req.method === 'GET') {
    try {
      requireRole(req, ['admin']);
      const [, , , memberId] = pathname.split('/');
      const member = getMemberById(memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      sendJson(res, 200, { member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/admin/members' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = normalizeMember({
        id: `member-${Date.now()}`,
        name: body.name,
        email: body.email,
        role: 'member',
        goal: body.goal || '',
        attendance: [],
        exercisePlan: body.exercisePlan || '',
        dietPlan: body.dietPlan || '',
        subscriptions: [],
        weeklyPlan: createWeeklyPlan(),
      });
      state.members.push(member);
      sendJson(res, 201, { member });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.startsWith('/admin/members/') && req.method === 'PUT') {
    try {
      requireRole(req, ['admin']);
      const [, , , memberId] = pathname.split('/');
      const member = getMemberById(memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }

      const body = await readJson(req);
      member.name = body.name ?? member.name;
      member.email = body.email ?? member.email;
      member.goal = body.goal ?? member.goal ?? '';
      member.exercisePlan = body.exercisePlan ?? member.exercisePlan ?? '';
      member.dietPlan = body.dietPlan ?? member.dietPlan ?? '';

      sendJson(res, 200, { member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.startsWith('/admin/members/') && req.method === 'DELETE') {
    try {
      requireRole(req, ['admin']);
      const [, , , memberId] = pathname.split('/');
      const memberIndex = state.members.findIndex((member) => member.id === memberId);
      if (memberIndex === -1) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      state.members.splice(memberIndex, 1);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (pathname === '/admin/attendance' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = getMemberById(body.memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      const record = {
        id: `attendance-${Date.now()}`,
        date: body.date || new Date().toISOString().slice(0, 10),
        status: body.status || 'present',
      };
      member.attendance.push(record);
      sendJson(res, 201, { member: normalizeMember(member), attendance: record });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname === '/admin/plans' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = getMemberById(body.memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      member.exercisePlan = body.exercisePlan || member.exercisePlan;
      member.dietPlan = body.dietPlan || member.dietPlan;
      sendJson(res, 200, { member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.match(/^\/admin\/members\/[^/]+\/weekly-plan$/) && req.method === 'PUT') {
    try {
      requireRole(req, ['admin']);
      const [, , , memberId] = pathname.split('/');
      const member = getMemberById(memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      const body = await readJson(req);
      member.weeklyPlan = {
        notes: body.notes || '',
        days: Array.isArray(body.days)
          ? body.days.slice(0, 7).map((day, index) => ({
              day: WEEKDAYS[index],
              workout: day.workout || '',
              diet: day.diet || '',
              exerciseList: day.exerciseList || '',
              imageUrl: day.imageUrl || '',
              videoUrl: day.videoUrl || '',
            }))
          : createWeeklyPlan().days,
      };
      sendJson(res, 200, { member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.match(/^\/admin\/members\/[^/]+\/subscriptions$/) && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const [, , , memberId] = pathname.split('/');
      const member = getMemberById(memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      const body = await readJson(req);
      const subscription = {
        id: `subscription-${Date.now()}`,
        label: body.label || 'Subscription',
        startDate: body.startDate || new Date().toISOString().slice(0, 10),
        endDate: body.endDate || new Date().toISOString().slice(0, 10),
        status: body.status || 'active',
      };
      member.subscriptions = member.subscriptions || [];
      member.subscriptions.push(subscription);
      sendJson(res, 201, { subscription, member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.match(/^\/admin\/members\/[^/]+\/subscriptions\/[^/]+$/) && req.method === 'PUT') {
    try {
      requireRole(req, ['admin']);
      const segments = pathname.split('/');
      const member = getMemberById(segments[3]);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      const subscription = getSubscriptionById(member, segments[5]);
      if (!subscription) {
        sendJson(res, 404, { message: 'Subscription not found' });
        return;
      }
      const body = await readJson(req);
      subscription.label = body.label ?? subscription.label;
      subscription.startDate = body.startDate ?? subscription.startDate;
      subscription.endDate = body.endDate ?? subscription.endDate;
      subscription.status = body.status ?? subscription.status;
      sendJson(res, 200, { subscription, member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (pathname.match(/^\/admin\/members\/[^/]+\/subscriptions\/[^/]+$/) && req.method === 'DELETE') {
    try {
      requireRole(req, ['admin']);
      const segments = pathname.split('/');
      const member = getMemberById(segments[3]);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      member.subscriptions = (member.subscriptions || []).filter((subscription) => subscription.id !== segments[5]);
      sendJson(res, 200, { member: normalizeMember(member) });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  sendJson(res, 404, { message: 'API route not found' });
});

server.listen(PORT, () => {
  console.log(`API service listening on http://localhost:${PORT}`);
});
