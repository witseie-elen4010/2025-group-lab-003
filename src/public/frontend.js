'use strict';
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
  playerName = document.getElementById('playerName').value.trim();

  console.log('Attempting to create game with player:', playerName);

  // Validate input
  if (!playerName) {
    showErrorNotification('Please enter your name first!', {
      title: '❌ Name Required'
    });
    return;
  }

  const createGameBtn = document.getElementById('createGameBtn');
  const joinGameBtn = document.getElementById('joinGameBtn');

  // Disable and hide buttons immediately on click
  if (createGameBtn) {
    createGameBtn.disabled = true;
    createGameBtn.classList.add('d-none');
  }
  if (joinGameBtn) {
    joinGameBtn.disabled = true;
    joinGameBtn.classList.add('d-none');
  }

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

      showSuccessNotification('Game created! Game Code: ' + data.gameCode, {
        title: '🎮 Game Created',
        duration: 5000
      });

      socket.emit('joinGame', gameCode, playerName);

      // Start polling for game start as a fallback
      startGameStartPolling();

      document.getElementById('lobbySection').classList.remove('d-none');

      // SHOW game mode dropdown here after game creation
      document.getElementById('gameModeContainer').classList.remove('d-none');
    } else {
      // Re-enable buttons on error
      if (createGameBtn) {
        createGameBtn.disabled = false;
        createGameBtn.classList.remove('d-none');
      }
      if (joinGameBtn) {
        joinGameBtn.disabled = false;
        joinGameBtn.classList.remove('d-none');
      }
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create game');
    }
  } catch (e) {
    // Re-enable buttons on exception
    if (createGameBtn) {
      createGameBtn.disabled = false;
      createGameBtn.classList.remove('d-none');
    }
    if (joinGameBtn) {
      joinGameBtn.disabled = false;
      joinGameBtn.classList.remove('d-none');
    }
    console.error('Game creation error:', e.message);
    showErrorNotification(e.message, {
      title: '❌ Game Creation Failed'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const joinGameBtn = document.getElementById('joinGameBtn');
  const joinGameInputSection = document.getElementById('joinGameInputSection');
  const confirmJoinBtn = document.getElementById('confirmJoinBtn');

  // When user clicks "Join Game", show input & confirm button, hide the initial button
  if (joinGameBtn && joinGameInputSection) {
    joinGameBtn.addEventListener('click', () => {
      joinGameBtn.classList.add('d-none');
      joinGameInputSection.classList.remove('d-none');
    });
  }

  if (confirmJoinBtn) {
    confirmJoinBtn.addEventListener('click', () => {
      confirmJoinBtn.disabled = true; // Disable confirm join button on click
      joinGame();
    });
  }
});

// JOIN GAME
async function joinGame() {
  playerName = document.getElementById('playerName').value.trim();
  gameCode = document.getElementById('gameCodeInput').value.trim().toUpperCase();

  console.log('Attempting to join game:', { playerName, gameCode });

  // Validate inputs
  if (!playerName) {
    showErrorNotification('Please enter your name!', {
      title: '❌ Name Required'
    });
    return;
  }

  if (!gameCode) {
    showErrorNotification('Please enter a game code!', {
      title: '❌ Game Code Required'
    });
    return;
  }

  const confirmJoinBtn = document.getElementById('confirmJoinBtn');
  const createGameBtn = document.getElementById('createGameBtn');
  const joinGameBtn = document.getElementById('joinGameBtn');

  // Disable and hide relevant buttons
  if (confirmJoinBtn) {
    confirmJoinBtn.disabled = true;
    confirmJoinBtn.classList.add('d-none');
  }
  if (createGameBtn) {
    createGameBtn.disabled = true;
    createGameBtn.classList.add('d-none');
  }
  if (joinGameBtn) {
    joinGameBtn.disabled = true;
    joinGameBtn.classList.add('d-none');
  }

  try {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, gameCode })
    });

    if (res.ok) {
      showSuccessNotification(`Joined game ${gameCode} successfully!`, {
        title: '🎮 Game Joined',
        duration: 3000
      });
      document.getElementById('lobbySection').classList.remove('d-none');
      document.getElementById('gameCodeInput').classList.remove('d-none');

      // Tell backend we joined the game room
      socket.emit('joinGame', gameCode, playerName);

      // Start polling for game start as a fallback
      startGameStartPolling();

      //await loadLobby(gameCode); // Initial load
    } else {
      // Re-enable buttons on error
      if (confirmJoinBtn) {
        confirmJoinBtn.disabled = false;
        confirmJoinBtn.classList.remove('d-none');
      }
      if (createGameBtn) {
        createGameBtn.disabled = false;
        createGameBtn.classList.remove('d-none');
      }
      if (joinGameBtn) {
        joinGameBtn.disabled = false;
        joinGameBtn.classList.remove('d-none');
      }
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to join game');
    }
  } catch (err) {
    // Re-enable buttons on exception
    if (confirmJoinBtn) {
      confirmJoinBtn.disabled = false;
      confirmJoinBtn.classList.remove('d-none');
    }
    if (createGameBtn) {
      createGameBtn.disabled = false;
      createGameBtn.classList.remove('d-none');
    }
    if (joinGameBtn) {
      joinGameBtn.disabled = false;
      joinGameBtn.classList.remove('d-none');
    }
    console.error('Join game error:', err.message);
    showErrorNotification(err.message, {
      title: '❌ Failed to Join Game'
    });
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
      showGameNotification('Game started!', {
        title: '🎲 Game Starting',
        type: 'success',
        duration: 3000
      });
      socket.emit('startGame', gameCode);
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to start game');
    }
  } catch (err) {
    console.error('Start game error:', err.message);
    showErrorNotification('Could not start game.');
  }
}

// Listen for events from server
socket.on('playerJoined', (joinedPlayerName) => {
  console.log(`${joinedPlayerName} has joined the game`);
  // You can still add individual player if you want, but main update is below
});

socket.on('gameStarted', (data) => {
  console.log('Received gameStarted event:', data);
  showGameNotification('Game has started! Redirecting to game...', {
    title: '🎮 Game Started',
    type: 'success',
    duration: 1500
  });

  // Stop polling since we received the socket event
  stopGameStartPolling();

  // Automatically redirect all players to the game page after a short delay
  setTimeout(() => {
    console.log('Redirecting to game page...');
    window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}&mode=${data.gameMode}`;
  }, 1500);
});

// Add a fallback mechanism - listen for room join confirmation
socket.on('joinedRoom', (data) => {
  console.log('Joined room confirmation:', data);
  if (!data.success) {
    console.error('Failed to join socket room:', data.error);
    showErrorNotification('Failed to connect to game room. Please refresh and try again.');
  }
});

// Add connection status monitoring
socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Polling fallback to check if game has started (in case socket events fail)
let gameStartPolling = null;

function startGameStartPolling() {
  if (gameStartPolling) return; // Already polling

  gameStartPolling = setInterval(async () => {
    if (!gameCode) return;

    try {
      const res = await fetch(`/api/game/status/${gameCode}`);
      if (res.ok) {
        const status = await res.json();
        if (status.gameStarted && !status.redirected) {
          console.log('Game started detected via polling, redirecting...');
          clearInterval(gameStartPolling);
          gameStartPolling = null;

          showGameNotification('Game has started! Redirecting to game...', {
            title: '🎮 Game Started',
            type: 'success',
            duration: 1000
          });

          setTimeout(() => {
            window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}&mode=${status.gameMode || 'online'}`;
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error polling game status:', err);
    }
  }, 2000); // Check every 2 seconds
}

function stopGameStartPolling() {
  if (gameStartPolling) {
    clearInterval(gameStartPolling);
    gameStartPolling = null;
  }
}

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
