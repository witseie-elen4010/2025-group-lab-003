const socket = io(); // Initialize socket.io client

let creatorName = '';
let playerName = '';
let gameCode = '';

// CREATE GAME
async function createGame() {
  playerName = document.getElementById('playerName').value; // Get the creator's name from input

  try {
    // Send a POST request to create a game, including the creator's name
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorName: playerName }) // Send the creator's name in the request body
    });

    if (res.ok) {
      const data = await res.json(); // Parse the response to get the game code and creator's name
      creatorName = playerName;
      gameCode = data.gameCode; // Store the game code in a variable
      console.log('Game created! Game Code: ' + data.gameCode); // Log the game code to the console
      alert('Game created! Game Code: ' + data.gameCode); // Display the game code to the user
      
      // Tell backend we joined the game room
      socket.emit('joinGame', gameCode, playerName);

      document.getElementById('lobbySection').classList.remove('d-none');
      await loadLobby(gameCode) // Load the lobby with the new game code
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

// JOIN GAME
async function joinGame() {
  playerName = document.getElementById('playerName').value;
  gameCode = document.getElementById('gameCodeInput').value.toUpperCase();

  try {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, gameCode })
    });

    if (res.ok) {
      alert(`Joined game ${gameCode} successfully!`);
      document.getElementById('lobbySection').classList.remove('d-none');
      // Tell backend we joined the game room
      socket.emit('joinGame', gameCode, playerName);

      await loadLobby(gameCode);
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
  //const gameCode = document.getElementById('gameCodeInput').value.toUpperCase();

  try {
    const res = await fetch(`/api/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameCode })
    });

    if (res.ok) {
      alert('Game started!');
      console.log('Game Code: ' + gameCode);
      console.log('Player Name: ' + playerName);

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
  addPlayerToLobby(joinedPlayerName);
});

socket.on('gameStarted', () => {
  alert('Game has started!');
  window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}`;
});

function addPlayerToLobby(name) {
  const playerList = document.getElementById('playerList');
  const li = document.createElement('li');
  li.textContent = name;
  playerList.appendChild(li);
}

async function loadLobby(gameCode) {
  try {
    const res = await fetch(`/api/game/players/${gameCode}`);
    const players = await res.json();
    const playerList = document.getElementById('playerList');
    const startBtn = document.getElementById('startGameBtn');
    playerList.innerHTML = ''; // Clear previous list

    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player.userId; // Assuming userId is the player's name`;
      playerList.appendChild(li);
    });

    if (players.length >= 3) {
        startBtn.classList.remove('d-none');
    } else {
      startBtn.classList.add('d-none');
    }
  } catch (err) {
    console.error('Failed to load lobby:', err.message);
  }
}
