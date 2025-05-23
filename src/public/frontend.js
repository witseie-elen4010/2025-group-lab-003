// Redirect to login if no auth token
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    console.log('Token exp:', payload.exp, 'Current time:', now);
    return payload.exp < now;
  } catch {
    return true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const token = sessionStorage.getItem('token');

  // Run token check ONLY on protected pages, not on login or signup
  if ((path === '/' || path === '/index.html') && (!token || isTokenExpired(token))) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login.html';
  }
});

const socket = io(); // Initialize socket.io client

let creatorName = '';
let playerName = '';
let gameCode = '';
let gameMode = '';

// CREATE GAME
async function createGame() {
  playerName = document.getElementById('playerName').value;

  try {
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorName: playerName }) // No gameMode here
    });

    if (res.ok) {
      const data = await res.json();
      creatorName = playerName;
      gameCode = data.gameCode;

      alert('Game created! Game Code: ' + data.gameCode);

      socket.emit('joinGame', gameCode, playerName);

      document.getElementById('lobbySection').classList.remove('d-none');

      // SHOW game mode dropdown here after game creation
      document.getElementById('gameModeContainer').classList.remove('d-none');
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create game');
    }
  } catch (e) {
    const errorDisplay = document.getElementById('errorDisplay');
    errorDisplay.innerText = e.message;
    errorDisplay.classList.remove('d-none'); // Show the alert
    console.error('Game creation error:', e.message);
    setTimeout(() => {
      errorDisplay.classList.add('d-none');
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const joinGameBtn = document.getElementById('joinGameBtn');
  const joinGameInputSection = document.getElementById('joinGameInputSection');
  const confirmJoinBtn = document.getElementById('confirmJoinBtn');

  // When user clicks "Join Game", show input & confirm button, hide the initial button
  joinGameBtn.addEventListener('click', () => {
    joinGameBtn.classList.add('d-none');
    joinGameInputSection.classList.remove('d-none');
  });

  // When user clicks confirm, call joinGame()
  confirmJoinBtn.addEventListener('click', () => {
    joinGame();
  });
});

// JOIN GAME
async function joinGame() {
  playerName = document.getElementById('playerName').value;
  gameCode = document.getElementById('gameCodeInput').value.toUpperCase();

  try {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, gameCode})
    });

    if (res.ok) {
      alert(`Joined game ${gameCode} successfully!`);
      document.getElementById('lobbySection').classList.remove('d-none');
      document.getElementById('gameCodeInput').classList.remove('d-none');
      // Tell backend we joined the game room
      socket.emit('joinGame', gameCode, playerName);

      //await loadLobby(gameCode); // Initial load
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to join game');
    }
  } catch (err) {
    const errorDisplay = document.getElementById('errorDisplay');
    errorDisplay.innerText = err.message;
    errorDisplay.classList.remove('d-none');
    console.error('Join game error:', err.message);
    setTimeout(() => {
      errorDisplay.classList.add('d-none');
    }, 4000);
  }
}

async function startGame() {
  // Read game mode from dropdown when starting game
  gameMode = document.getElementById('gameMode').value;

  try {
    const res = await fetch(`/api/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameCode, playerName, gameMode }) // Send gameMode here
    });

    if (res.ok) {
      alert('Game started!');
      socket.emit('startGame', gameCode);
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to start game');
    }
  } catch (err) {
    console.error('Start game error:', err.message);
    alert('Could not start game.');
  }
}

// Listen for events from server
socket.on('playerJoined', (joinedPlayerName) => {
  console.log(`${joinedPlayerName} has joined the game`);
  // You can still add individual player if you want, but main update is below
});

socket.on('gameStarted', (data) => {
  alert('Game has started!');
  // Redirect with gameMode sent from backend
  window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}&mode=${data.gameMode}`;
});

// Listen for updated player list
socket.on('updatePlayerList', async (players) => {
  console.log('Received updated player list:', players);
  const playerList = document.getElementById('playerList');
  const startBtn = document.getElementById('startGameBtn');
  playerList.innerHTML = '';

  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.userId;
    playerList.appendChild(li);
  });

  if (players.length >= 3) {
    console.log('Enough players, checking admin status...');
    try {
      const adminCheckRes = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
      if (!adminCheckRes.ok) {
        console.error('Admin check API failed:', adminCheckRes.status);
        startBtn.classList.add('d-none');
        return;
      }
      const adminData = await adminCheckRes.json();
      console.log('Admin check result:', adminData);
      if (adminData.admin) {
        console.log('Player is admin, showing start button');
        startBtn.classList.remove('d-none');
      } else {
        console.log('Player is not admin, hiding start button');
        startBtn.classList.add('d-none');
      }
    } catch (err) {
      console.error('Admin check failed:', err);
      startBtn.classList.add('d-none');
    }
  } else {
    console.log('Not enough players, hiding start button');
    startBtn.classList.add('d-none');
  }
});

function addPlayerToLobby(name) {
  const playerList = document.getElementById('playerList');
  const li = document.createElement('li');
  li.textContent = name;
  playerList.appendChild(li);
}

// Optional initial load to populate lobby on page load
/*async function loadLobby(gameCode) {
  console.log('loadLobby called, gameCode:', gameCode, 'playerName:', playerName);
  try {
    const res = await fetch(`/api/game/players/${gameCode}`);
    const players = await res.json();
    const playerList = document.getElementById('playerList');
    const startBtn = document.getElementById('startGameBtn');
    playerList.innerHTML = '';

    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player.userId;
      playerList.appendChild(li);
    });

    if (players.length >= 3) {
      const adminCheckRes = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
      if (!adminCheckRes.ok) {
        console.error('Admin check API failed:', adminCheckRes.status);
        startBtn.classList.add('d-none');
        return;
      }
      const adminData = await adminCheckRes.json();
      if (adminData.admin) {
        startBtn.classList.remove('d-none');
      } else {
        startBtn.classList.add('d-none');
      }
    } else {
      startBtn.classList.add('d-none');
    }
  } catch (err) {
    console.error('Failed to load lobby:', err.message);
  }
}*/
