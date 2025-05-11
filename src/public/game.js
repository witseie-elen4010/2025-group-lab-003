// public/game.js
window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('playerName');
    const gameCode = params.get('gameCode');
  
    try {
      const res = await fetch(`/api/game/player/${gameCode}/${playerName}`);
      const data = await res.json();
  
      if (res.ok) {
        // Only show the player's word — omit role
        document.getElementById('playerWord').textContent = data.word;
      } else {
        document.getElementById('playerWord').textContent = data.error || 'Could not load your word.';
      }
    } catch (err) {
      console.error('Error fetching word:', err.message);
      document.getElementById('playerWord').textContent = 'An unexpected error occurred.';
    }
  });
  