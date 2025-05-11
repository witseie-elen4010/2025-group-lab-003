// CREATE GAME
async function createGame() {
  const creatorName = document.getElementById('playerName').value; // Get the creator's name from input

  try {
    // Send a POST request to create a game, including the creator's name
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorName }) // Send the creator's name in the request body
    });

    if (res.ok) {
      const data = await res.json(); // Parse the response to get the game code and creator's name
      console.log('Game created! Game Code: ' + data.gameCode); // Log the game code to the console
      alert('Game created! Game Code: ' + data.gameCode); // Display the game code to the user
      document.getElementById('lobbySection').classList.remove('d-none');
      await loadLobby(data.gameCode) // Load the lobby with the new game code
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
  const playerName = document.getElementById('playerName').value;
  const gameCode = document.getElementById('gameCodeInput').value.toUpperCase();

  try {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, gameCode })
    });

    if (res.ok) {
      alert(`Joined game ${gameCode} successfully!`);
      document.getElementById('lobbySection').classList.remove('d-none');
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

async function loadLobby(gameCode) {
  try {
    const res = await fetch(`/api/game/players/${gameCode}`);
    const players = await res.json();
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = ''; // Clear previous list

    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player.userId; // Assuming userId is the player's name`;
      playerList.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load lobby:', err.message);
  }
}
