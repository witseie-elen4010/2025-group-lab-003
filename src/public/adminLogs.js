window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const playerName = params.get('playerName');
  const gameCode = params.get('gameCode');

  if (!playerName || !gameCode) {
    showErrorNotification("Missing gameCode or playerName. Redirecting to lobby...", {
      duration: 3000
    });

    // Automatically redirect to lobby
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
    return;
  }

  // Admin check
  try {
    const res = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
    const { admin } = await res.json();

    if (!admin) {
      showErrorNotification("Access denied. You are not the admin. Redirecting to lobby...", {
        duration: 3000
      });

      // Automatically redirect to lobby
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return;
    }
  } catch (err) {
    console.error('Failed to check admin:', err);
  }

  // Fetch logs
  try {
    const logsRes = await fetch(`/api/admin/logs/${gameCode}`);
    const logs = await logsRes.json();
    const tableBody = document.getElementById('logTableBody');
    tableBody.innerHTML = '';

    if (!logs.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">No logs found.</td></tr>';
      return;
    }

    logs.forEach((log, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.userId}</td>
        <td>${log.actionType}</td>
        <td>${log.details || '-'}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading logs:', err);
    document.getElementById('logTableBody').innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
  }
});
