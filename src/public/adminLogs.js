window.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('logTableBody');

  try {
    const res = await fetch('/api/admin/logs');
    if (!res.ok) throw new Error('Failed to fetch logs');
    const logs = await res.json();

    if (logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No logs found.</td></tr>';
      return;
    }

    tableBody.innerHTML = ''; // Clear loading row
    logs.forEach((log, index) => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.userId}</td>
        <td>${log.actionType}</td>
        <td>${log.details || '-'}</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading logs:', err);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
  }
});
