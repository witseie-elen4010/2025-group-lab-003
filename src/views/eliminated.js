document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const playerName = params.get('playerName');
  const gameCode = params.get('gameCode');

  if (!playerName || !gameCode) return;

  try {
    const res = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
    if (!res.ok) throw new Error('Failed to check admin');
    const data = await res.json();

    if (data.admin) {
      const logsBtn = document.getElementById('viewLogsBtn');
      if (logsBtn) {
        logsBtn.style.display = 'inline-block';
        logsBtn.onclick = () => {
          window.location.href = `/adminLogs.html?playerName=${playerName}&gameCode=${gameCode}`;
        };
      }
    }
  } catch (err) {
    console.error('Admin check failed:', err);
  }
});
