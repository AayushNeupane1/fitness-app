import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.ok ? 'connected' : 'error'))
      .catch(() => setStatus('server not reachable'));
  }, []);

  return (
    <div className="min-h-screen bg-zeon-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-extrabold text-zeon-green tracking-tight">
        ZEON FITNESS
      </h1>
      <p className="text-lg text-gray-300">
        Server status: <span className="font-semibold">{status}</span>
      </p>
    </div>
  );
}

export default App;
