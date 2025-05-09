// CREATE GAME
async function createGame() {
  const creatorName = document.getElementById('playerName').value; // Get the creator's name from input

  if (!creatorName) {
    console.log('Please enter your name to create a game');
    return;  // Don't proceed if the player hasn't entered their name
  }

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
    } else {
      throw new Error('Failed to create game');
    }
  } catch (e) {
    console.log(e.message); 
  }
}