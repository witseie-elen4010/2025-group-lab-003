// Extract query params
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('gameCode');
const playerName = urlParams.get('playerName');
let playerRole = null;

// Get game mode from URL, default to 'online'
const gameMode = urlParams.get('mode') || 'online';

async function fetchGameMode(gameCode) {
  try {
    const res = await fetch(`/api/game/mode/${gameCode}`);
    if (!res.ok) throw new Error('Failed to fetch game mode');
    const data = await res.json();
    return data.mode || 'online';
  } catch (e) {
    console.error('Error fetching game mode:', e);
    return 'online';
  }
}


// Show/hide chat based on game mode
window.addEventListener('DOMContentLoaded', async () => {
  const mode = await fetchGameMode(gameCode);
  // Hide chat for in-person mode
  if (gameMode === 'inperson') {
    const chatCard = document.getElementById('chatCard');
    if (chatCard) chatCard.style.display = 'none';
  }

  // Fetch and display player word/role
  try {
    const res = await fetch(`/api/game/player/${gameCode}/${playerName}`);
    const data = await res.json();

    if (res.ok) {
      playerRole = data.role;
      document.getElementById('playerWord').textContent = data.word;
    } else {
      document.getElementById('playerWord').textContent = data.error || 'Could not load your word.';
    }
  } catch (err) {
    console.error('Error fetching word:', err.message);
    document.getElementById('playerWord').textContent = 'An unexpected error occurred.';
  }

  // Show admin logs button if admin
  checkIfAdminAndShowLogs();
});

// Check if player is admin and show admin logs button
async function checkIfAdminAndShowLogs() {
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
}

const socket = io();

// Join the game and chat rooms
socket.emit('joinGame', gameCode, playerName);
socket.emit('joinRoom', gameCode);

// Voting and game events
socket.on('allVotesIn', (data) => {
  alert(data.message || 'All players have voted!');
});

socket.on('playerEliminated', (data) => {
  if (data.eliminatedPlayer === playerName) {
    alert('You have been eliminated!');
    if (playerRole !== 'undercover') {
      window.location.href = `/eliminated.html?gameCode=${gameCode}&playerName=${playerName}`;
    }
  } else {
    alert(`Player eliminated: ${data.eliminatedPlayer}`);
  }
});

socket.on('gameEnded', (data) => {
  alert(`Game over! Winner: ${data.winner}s`);
  if (playerRole === data.winner) {
    window.location.href = `/winner.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
  } else {
    window.location.href = `/loser.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
  }
});

socket.on('newRoundStarted', (data) => {
  if (data.eliminatedPlayer !== playerName) {
    alert(`Round ${data.round} started! Your word has been updated.`);
    window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}&mode=${gameMode}`;
  }
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
        playerRole = data.role;
        document.getElementById('playerWord').textContent = data.word;
        //document.getElementById('playerRole').textContent = `Your role: ${data.role}`;
      } else {
        document.getElementById('playerWord').textContent = data.error || 'Could not load your word.';
        //document.getElementById('playerRole').textContent = 'Unknown role';
      }
    } catch (err) {
      console.error('Error fetching word:', err.message);
      document.getElementById('playerWord').textContent = 'An unexpected error occurred.';
      //document.getElementById('playerRole').textContent = 'Unknown role';
    }
  });
  
async function startVote() {
  try {
    const res = await fetch(`/api/game/players/${gameCode}`);
    if (!res.ok) throw new Error('Failed to fetch players');
    const players = await res.json();

    const votingList = document.getElementById('votingList');
    votingList.innerHTML = '';

    const heading = document.createElement('h5');
    heading.innerText = 'Vote a player out:';
    votingList.appendChild(heading);

    players.forEach(player => {
      if (player.userId === playerName) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-danger m-1';
      btn.innerText = `Vote ${player.userId}`;
      btn.onclick = () => {
        if (confirm(`Are you sure you want to vote for ${player.userId}?`)) {
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
        gameCode,
        voterName: playerName,
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

// Chat functionality
socket.on('chatMessage', ({ playerName, message }) => {
  const chatBox = document.getElementById('chatBox');
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>${playerName}:</strong> ${message}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function sendChat() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('chatMessage', { gameCode, playerName, message });
    chatInput.value = '';
  }
}

document.getElementById('chatInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendChat();
});
