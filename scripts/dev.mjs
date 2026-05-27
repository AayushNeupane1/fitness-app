import { spawn } from 'node:child_process';

const services = [
  ['web', 'node', ['apps/web/server.js']],
  ['api', 'node', ['apps/api/server.js']],
  ['auth', 'node', ['services/auth/server.js']],
];

const processes = services.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exitCode = code ?? 1;
    }
  });

  return child;
});

function shutdown(signal) {
  for (const child of processes) {
    child.kill(signal);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
