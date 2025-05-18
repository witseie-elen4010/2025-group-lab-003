// Assume you have playerName and gameCode available, for example from URL params:
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('gameCode');
const playerName = urlParams.get('playerName');

const socket = io();

// Join the Socket.IO room for this game so you receive room events
socket.emit('joinGame', gameCode, playerName);

// Listen for 'allVotesIn' event from server
socket.on('allVotesIn', (data) => {
  console.log('All votes are in:', data);
  alert(data.message || 'All players have voted!');
  // TODO: call eliminatePlayer() or update UI accordingly
});

socket.on('playerEliminated', (data) => {
  if (data.eliminatedPlayer === playerName) {
    alert('You have been eliminated!');
    window.location.href = `/eliminated.html?gameCode=${gameCode}&playerName=${playerName}`;
  } else {
    alert(`Player eliminated: ${data.eliminatedPlayer}`);
    // update lobby UI if desired
  }
});

// When game ends
socket.on('gameEnded', (data) => {
  alert(`Game over! Winner: ${data.winner}`);
  // Redirect players to winner/loser pages (as you already implemented)
  if (playerName === data.winner) {
    //window.location.href = `/winner.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
  } else {
    //window.location.href = `/loser.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
  }
});

// When new round starts
socket.on('newRoundStarted', (data) => {
  alert(`Round ${data.round} started! Your word has been updated.`);
  // Reload game.html for new round (preserves playerName and gameCode)
  window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}`;
});

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
          submitVote(player.userId);
        }
      };

      votingList.appendChild(btn);
    });
  } catch (err) {
    alert('Error loading players for voting');
    console.error(err);
  }
}

async function submitVote(votedPlayer) {
  try {
    const response = await fetch('/api/game/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameCode,     // from URL param
        voterName: playerName,  // from URL param
        votedFor: votedPlayer
      })
    });

    if (response.ok) {
      alert(`Your vote for ${votedPlayer} has been recorded.`);
      document.getElementById('votingList').innerHTML = '<p>Thank you for voting!</p>';
    } else {
      const errorData = await response.json();
      alert(`Failed to submit vote: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    alert('Error submitting vote. Please try again.');
    console.error(error);
  }
}