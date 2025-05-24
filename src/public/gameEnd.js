// Handle Game Results button click
document.addEventListener('DOMContentLoaded', () => {
  const resultsBtn = document.getElementById('gameResultsBtn');
  if (resultsBtn) {
    resultsBtn.onclick = () => {
      const params = new URLSearchParams(window.location.search);
      const gameCode = params.get('gameCode');

      if (!gameCode) {
        showErrorNotification('Game code missing. Cannot show results.');
        return;
      }

      window.location.href = `/gameResults.html?gameCode=${gameCode}`;
    };
  }
});

// Check if player is admin and show logs button
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const playerName = params.get('playerName');
  const gameCode = params.get('gameCode');

  if (!playerName || !gameCode) return;

  try {
    const res = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
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
