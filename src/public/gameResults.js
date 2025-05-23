window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const gameCode = params.get('gameCode');

  if (!gameCode) {
    alert('Game code missing. Cannot load results.');
    return;
  }

  try {
    const res = await fetch(`/api/game/results/${gameCode}`);
    if (!res.ok) throw new Error('Failed to fetch game results');

    const data = await res.json();

    document.getElementById('winnerSide').textContent = data.winnerSide || 'Unknown';
    document.getElementById('roundsPlayed').textContent = data.roundsPlayed ?? 'Unknown';

    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    if (data.players.length === 0) {
      playersList.innerHTML = '<li class="list-group-item">No players found.</li>';
    } else {
      data.players.forEach(player => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${player.userId} — ${player.role}`;
        playersList.appendChild(li);
      });
    }
  } catch (err) {
    alert(err.message);
    console.error(err);
    document.getElementById('winnerSide').textContent = 'Error loading results';
    document.getElementById('roundsPlayed').textContent = 'Error loading results';
    document.getElementById('playersList').innerHTML = '<li class="list-group-item text-danger">Error loading players.</li>';
  }
});
