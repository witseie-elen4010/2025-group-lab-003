// Assume you have playerName and gameCode available, for example from URL params:
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('gameCode');
const playerName = urlParams.get('playerName');

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
  
async function startVote() {
  try {
    // Fetch players for this game
    const res = await fetch(`/api/game/players/${gameCode}`);
    if (!res.ok) throw new Error('Failed to fetch players');
    const players = await res.json();

    // Get votingList container
    const votingList = document.getElementById('votingList');
    votingList.innerHTML = ''; // Clear current contents (removes startVoteBtn)

    // Add a heading
    const heading = document.createElement('h5');
    heading.innerText = 'Vote a player out:';
    votingList.appendChild(heading);

    // For each player except self, create a button
    players.forEach(player => {
      if (player.userId === playerName) return; // skip voting self

      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-danger m-1';
      btn.innerText = `Vote ${player.userId}`;
      // For now, just log the clicked player
      btn.onclick = () => {
    const confirmed = confirm(`Are you sure you want to vote for ${player.userId}?`);
    if (confirmed) {
      alert(`You confirmed voting for ${player.userId}`);
    }
  };

      votingList.appendChild(btn);
    });
  } catch (err) {
    alert('Error loading players for voting');
    console.error(err);
  }
}

