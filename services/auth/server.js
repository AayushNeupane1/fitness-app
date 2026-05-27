const http = require('node:http');
const { createToken, verifyToken } = require('../../packages/shared/token');

const PORT = Number(process.env.AUTH_SERVICE_PORT || 4001);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev-auth-secret';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 8;

const users = [
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@gym.local',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'user-member',
    name: 'Member User',
    email: 'member@gym.local',
    password: 'member123',
    role: 'member',
  },
];

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

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
    sendJson(res, 200, { ok: true, service: 'auth' });
    return;
  }

  if (req.url === '/login' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const user = users.find(
        (candidate) => candidate.email === body.email && candidate.password === body.password,
      );

      if (!user) {
        sendJson(res, 401, { message: 'Invalid email or password' });
        return;
      }

      const token = createToken(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        JWT_SECRET,
        ACCESS_TOKEN_TTL_SECONDS,
      );

      sendJson(res, 200, {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
      return;
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid request body' });
      return;
    }
  }

  if (req.url === '/register' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      if (!body.name || !body.email || !body.password) {
        sendJson(res, 400, { message: 'Name, email, and password are required' });
        return;
      }

      if (findUserByEmail(body.email)) {
        sendJson(res, 409, { message: 'That email is already registered' });
        return;
      }

      const user = {
        id: `user-${Date.now()}`,
        name: body.name,
        email: body.email,
        password: body.password,
        role: 'member',
      };
      users.push(user);

      const token = createToken(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        JWT_SECRET,
        ACCESS_TOKEN_TTL_SECONDS,
      );

      sendJson(res, 201, {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid request body' });
    }
    return;
  }

  if (req.url === '/me' && req.method === 'GET') {
    try {
      const payload = verifyToken(getBearerToken(req), JWT_SECRET);
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, 401, { message: 'Unauthorized' });
    }
    return;
  }

  sendJson(res, 404, { message: 'Auth route not found' });
});

server.listen(PORT, () => {
  console.log(`Auth service listening on http://localhost:${PORT}`);
  console.log('Seed users: admin@gym.local / admin123, member@gym.local / member123');
});
