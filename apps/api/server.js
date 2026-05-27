const http = require('node:http');
const { verifyToken } = require('../../packages/shared/token');

const PORT = Number(process.env.API_SERVICE_PORT || 4000);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev-auth-secret';

const state = {
  members: [
    {
      id: 'member-1',
      name: 'Member User',
      email: 'member@gym.local',
      role: 'member',
      attendance: [{ date: '2026-05-27', status: 'present' }],
      exercisePlan: 'Upper body strength',
      dietPlan: 'High protein meal plan',
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
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.url === '/health') {
    sendJson(res, 200, { ok: true, service: 'api' });
    return;
  }

  if (req.url === '/me' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const member = state.members.find((item) => item.email === user.email);
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

  if (req.url === '/admin/overview' && req.method === 'GET') {
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

  if (req.url === '/admin/members' && req.method === 'GET') {
    try {
      requireRole(req, ['admin']);
      sendJson(res, 200, { members: state.members });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  if (req.url === '/admin/members' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = {
        id: `member-${Date.now()}`,
        name: body.name,
        email: body.email,
        role: 'member',
        attendance: [],
        exercisePlan: body.exercisePlan || '',
        dietPlan: body.dietPlan || '',
      };
      state.members.push(member);
      sendJson(res, 201, { member });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (req.url === '/admin/attendance' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = state.members.find((item) => item.id === body.memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      const record = {
        date: body.date || new Date().toISOString().slice(0, 10),
        status: body.status || 'present',
      };
      member.attendance.push(record);
      sendJson(res, 201, { member, attendance: record });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (req.url === '/admin/plans' && req.method === 'POST') {
    try {
      requireRole(req, ['admin']);
      const body = await readJson(req);
      const member = state.members.find((item) => item.id === body.memberId);
      if (!member) {
        sendJson(res, 404, { message: 'Member not found' });
        return;
      }
      member.exercisePlan = body.exercisePlan || member.exercisePlan;
      member.dietPlan = body.dietPlan || member.dietPlan;
      sendJson(res, 200, { member });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message || 'Bad request' });
    }
    return;
  }

  if (req.url === '/member/dashboard' && req.method === 'GET') {
    try {
      const user = requireRole(req, ['member']);
      const member = state.members.find((item) => item.email === user.email);
      if (!member) {
        sendJson(res, 404, { message: 'Member profile not found' });
        return;
      }
      sendJson(res, 200, { member, offers: state.offers });
    } catch (error) {
      sendJson(res, error.statusCode || 401, { message: error.message || 'Unauthorized' });
    }
    return;
  }

  sendJson(res, 404, { message: 'API route not found' });
});

server.listen(PORT, () => {
  console.log(`API service listening on http://localhost:${PORT}`);
});
