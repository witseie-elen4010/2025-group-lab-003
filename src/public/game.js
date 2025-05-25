// Extract query params
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('gameCode');
const playerName = urlParams.get('playerName');
let playerRole = null;

// Discussion phase variables
let gamePhase = 'waiting'; // 'waiting', 'description', 'discussion', 'voting'
let currentSpeaker = null;

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

  // Show test button for admins
  //showTestButtonForAdmin();
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
  showGameNotification(data.message || 'All players have voted!');
});

socket.on('playerEliminated', (data) => {
  if (data.eliminatedPlayer === playerName) {
    showGameNotification('You have been eliminated! Redirecting...', {
      type: 'error',
      duration: 3000
    });

    // Automatically redirect eliminated players after 3 seconds
    setTimeout(() => {
      if(playerRole !== 'undercover') {
        window.location.href = `/eliminated.html?gameCode=${gameCode}&playerName=${playerName}`;
      }
    }, 3000);
  } else {
    showGameNotification(`Player eliminated: ${data.eliminatedPlayer}`, {
      type: 'warning'
    });
  }
});

socket.on('gameEnded', (data) => {
  const isWinner = playerRole === data.winner;
  const title = isWinner ? '🎉 You Won!' : '😞 Game Over';
  const message = `Game over! Winner: ${data.winner}s. Redirecting...`;

  console.log('Game ended, redirecting to results page...', { isWinner, winner: data.winner, playerRole });

  showGameNotification(message, {
    title: title,
    type: isWinner ? 'success' : 'error',
    duration: 2500
  });

  // Automatically redirect all players to the appropriate results page
  setTimeout(() => {
    if (isWinner) {
      console.log('Redirecting to winner page...');
      window.location.href = `/winner.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
    } else {
      console.log('Redirecting to loser page...');
      window.location.href = `/loser.html?gameCode=${gameCode}&playerName=${playerName}&winnerSide=${data.winner}`;
    }
  }, 2500);
});

socket.on('newRoundStarted', (data) => {
  if (data.eliminatedPlayer !== playerName) {
    showGameNotification(`Round ${data.round} started! Your word has been updated. Reloading...`, {
      title: '🔄 New Round',
      type: 'info',
      duration: 2500
    });

    // Automatically reload the game page for the new round
    setTimeout(() => {
      window.location.href = `/game.html?gameCode=${gameCode}&playerName=${playerName}&mode=${gameMode}`;
    }, 2500);
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

        // Show notification that description phase will start soon
        showGameNotification('Get ready! Description phase will start in 10 seconds. Each player gets 1 minute to describe their word.', {
          title: '⏰ Description Phase Starting Soon',
          type: 'info',
          duration: 5000
        });
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
      if (player.status === 'eliminated') return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-danger m-1';
      btn.innerText = `Vote ${player.userId}`;
      btn.onclick = () => {
        showConfirmNotification(`Are you sure you want to vote for ${player.userId}?`,
          () => submitVote(player.userId)
        );
      };
      votingList.appendChild(btn);
    });
  } catch (err) {
    showErrorNotification('Error loading players for voting');
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
      showSuccessNotification(`Your vote for ${votedPlayer} has been recorded.`);
      document.getElementById('votingList').innerHTML = '<p>Thank you for voting!</p>';
    } else {
      const errorData = await response.json();
      showErrorNotification(`Failed to submit vote: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    showErrorNotification('Error submitting vote. Please try again.');
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
  // Prevent all typing during description phase when it's not player's turn
  if (gamePhase === 'description' && currentSpeaker !== playerName) {
    e.preventDefault();
    return false;
  }

  if (e.key === 'Enter') sendChat();
});

// Also prevent paste events when it's not player's turn
document.getElementById('chatInput').addEventListener('paste', function(e) {
  if (gamePhase === 'description' && currentSpeaker !== playerName) {
    e.preventDefault();
    return false;
  }
});

// Discussion Phase Socket Events
socket.on('startDescriptionPhase', (data) => {
  gamePhase = 'description';
  currentSpeaker = data.currentSpeaker;

  console.log('Description phase started:', data);

  document.getElementById('discussionPhase').style.display = 'block';
  document.getElementById('phaseTitle').textContent = 'Description Phase';

  updateChatAccess();
  updateSpeakerDisplay(data.currentSpeaker, data.speakerIndex, data.totalSpeakers);

  /*showGameNotification('Description phase started! Each player gets 1 minute to describe their word.', {
    title: '🎤 Description Phase',
    type: 'info',
    duration: 3000
  });*/
});

socket.on('timerUpdate', (data) => {
  updateTimer(data.timeLeft);
  updateProgressBar(data.timeLeft, data.maxTime);

  if (data.phase === 'description') {
    currentSpeaker = data.currentSpeaker;
    updateSpeakerDisplay(data.currentSpeaker, data.speakerIndex, data.totalSpeakers);
    updateChatAccess();
  }
});

socket.on('nextSpeaker', (data) => {
  currentSpeaker = data.currentSpeaker;
  updateSpeakerDisplay(data.currentSpeaker, data.speakerIndex, data.totalSpeakers);
  updateChatAccess();

  showGameNotification(`${data.currentSpeaker}'s turn to describe their word! Each player gets 1 minute to describe their word.`, {
    type: 'info',
    duration: 10000
  });
});

socket.on('phaseChange', (data) => {
  gamePhase = data.newPhase;

  if (data.newPhase === 'discussion') {
    document.getElementById('phaseTitle').textContent = 'Discussion Phase';
    document.getElementById('currentSpeaker').innerHTML =
      '<strong>Open Discussion:</strong> Ask questions and discuss! 💬';
    document.getElementById('currentSpeaker').className = 'alert alert-success';

    updateChatAccess();

    showGameNotification('Discussion phase started! Everyone can now chat freely.', {
      title: '💬 Discussion Phase',
      type: 'success',
      duration: 5000
    });
  } else if (data.newPhase === 'voting') {
    document.getElementById('discussionPhase').style.display = 'none';
    gamePhase = 'voting';
    updateChatAccess();

    showGameNotification('Time to vote! Choose who to eliminate.', {
      title: '🗳️ Voting Phase',
      type: 'warning',
      duration: 3000
    });

    // Show voting buttons
    startVote();
  }
});

// Handle revote requirement
socket.on('revoteRequired', (data) => {
  showGameNotification(data.message, {
    title: '🔄 Revote Required',
    type: 'warning',
    duration: 8000
  });

  // Clear and rebuild voting UI
  const votingList = document.getElementById('votingList');
  votingList.innerHTML = '';

  // Check if current player is eligible to vote
  const isEligibleVoter = data.eligibleVoters.includes(playerName);

    if (isEligibleVoter) {
      // Show voting buttons for tied players (excluding self if in small group)
      const heading = document.createElement('h5');
      heading.innerText = data.message || '🔄 Revote - Choose between:';
      heading.className = 'text-warning mb-3';
      votingList.appendChild(heading);

      data.tiedPlayers.forEach(player => {
        // Skip creating button if this is the current player in a small group revote
        if (player !== playerName || data.tiedPlayers.length > 3) {
          const btn = document.createElement('button');
          btn.className = 'btn btn-outline-danger m-1';
          btn.innerText = `Vote ${player}`;
          btn.onclick = () => {
            showConfirmNotification(`Are you sure you want to vote for ${player}?`,
              () => submitVote(player)
            );
          };
          votingList.appendChild(btn);
        }
      });

      // Add special instructions for small group revotes
      if (data.tiedPlayers.length <= 3) {
        const info = document.createElement('p');
        info.className = 'text-muted small mt-2';
        info.innerText = 'Note: You cannot vote for yourself in this revote';
        votingList.appendChild(info);
      }
  } else {
    // Player is not eligible to vote (they are tied)
    const heading = document.createElement('h5');
    heading.innerText = '⏳ Waiting for Revote';
    heading.className = 'text-info mb-3';
    votingList.appendChild(heading);

    const message = document.createElement('p');
    message.innerText = 'You are tied for elimination. Other players are voting to decide your fate.';
    message.className = 'text-muted';
    votingList.appendChild(message);

    const eligibleVotersText = document.createElement('small');
    eligibleVotersText.innerText = `Voters: ${data.eligibleVoters.join(', ')}`;
    eligibleVotersText.className = 'text-secondary';
    votingList.appendChild(eligibleVotersText);
  }
});

// Discussion Phase Helper Functions
function updateTimer(secondsLeft) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timeRemaining').textContent = `${timeString} remaining`;
}

function updateProgressBar(timeLeft, maxTime) {
  const percentage = (timeLeft / maxTime) * 100;
  const progressBar = document.getElementById('timeProgress');
  progressBar.style.width = `${percentage}%`;

  // Color coding based on time remaining
  if (percentage > 50) {
    progressBar.className = 'progress-bar bg-success';
  } else if (percentage > 20) {
    progressBar.className = 'progress-bar bg-warning';
  } else {
    progressBar.className = 'progress-bar bg-danger';
  }
}

function updateSpeakerDisplay(speaker, index, total) {
  const speakerDiv = document.getElementById('currentSpeaker');

  if (speaker === playerName) {
    speakerDiv.className = 'alert alert-success';
    speakerDiv.innerHTML = `
      <strong>Your turn!</strong> Describe your word without saying it directly.
      <span class="badge bg-secondary">${index + 1}/${total}</span>
      <br><small>💡 Tip: Give clues about what your word means, how it's used, or what category it belongs to.</small>
    `;
  } else {
    speakerDiv.className = 'alert alert-info';
    speakerDiv.innerHTML = `
      <strong>${speaker}</strong> is describing their word...
      <span class="badge bg-secondary">${index + 1}/${total}</span>
      <br><small>🤫 Listen carefully to their description!</small>
    `;
  }
}

function updateChatAccess() {
  console.log('updateChatAccess called - gamePhase:', gamePhase, 'currentSpeaker:', currentSpeaker, 'playerName:', playerName);
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.querySelector('#chatCard button');

  if (gamePhase === 'description') {
    document.getElementById('startVoteBtn').style.display = 'none';
    document.getElementById('voteList').style.display = 'none';

    // Only current speaker can type during description phase
    const canSpeak = (currentSpeaker === playerName);
    chatInput.disabled = !canSpeak;
    chatInput.readOnly = !canSpeak; // Prevent typing completely
    if (sendButton) sendButton.disabled = !canSpeak;

    if (canSpeak) {
      chatInput.placeholder = "Describe your word (avoid saying it directly)...";
      chatInput.className = 'form-control me-2 border-success';
      chatInput.style.cursor = 'text';
      chatInput.style.backgroundColor = '';
    } else {
      chatInput.placeholder = "Wait up until your turn to type";
      chatInput.className = 'form-control me-2 bg-light text-muted';
      chatInput.style.cursor = 'not-allowed';
      chatInput.style.backgroundColor = '#f8f9fa';
    }
  } else if (gamePhase === 'discussion') {
    document.getElementById('timeRemaining').style.display = 'none';
    document.getElementById('timeProgress').style.display = 'none';
    document.getElementById('currentSpeaker').style.display = 'none';
    document.getElementById('startVoteBtn').style.display = 'block';
    document.getElementById('voteList').style.display = 'block';

    // Everyone can chat during discussion phase
    chatInput.disabled = false;
    chatInput.readOnly = false;
    if (sendButton) sendButton.disabled = false;
    chatInput.placeholder = "Ask questions and discuss...";
    chatInput.className = 'form-control me-2 border-primary';
    chatInput.style.cursor = 'text';
    chatInput.style.backgroundColor = '';
  } else {
    document.getElementById('startVoteBtn').style.display = 'block';
    document.getElementById('voteList').style.display = 'block';

    // Default state (waiting/voting)
    chatInput.disabled = false;
    chatInput.readOnly = false;
    if (sendButton) sendButton.disabled = false;
    chatInput.placeholder = "Type a message...";
    chatInput.className = 'form-control me-2';
    chatInput.style.cursor = 'text';
    chatInput.style.backgroundColor = '';
  }
}

// Test function to manually trigger description phase
async function testDescriptionPhase() {
  console.log('Testing description phase...');

  try {
    // Call the backend to start the description phase
    const response = await fetch('/api/game/test-description-phase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameCode: gameCode,
        playerName: playerName
      })
    });

    if (response.ok) {
      showGameNotification('Test description phase started!', {
        title: '🧪 Test Mode',
        type: 'info',
        duration: 5000
      });
    } else {
      console.error('Failed to start test description phase');
      showGameNotification('Failed to start test phase', {
        type: 'error',
        duration: 5000
      });
    }
  } catch (error) {
    console.error('Error starting test description phase:', error);
    showGameNotification('Error starting test phase', {
      type: 'error',
      duration: 3000
    });
  }
}

// Show test button for admins
async function showTestButtonForAdmin() {
  if (!playerName || !gameCode) return;
  try {
    const res = await fetch(`/api/game/is-admin/${gameCode}/${playerName}`);
    const data = await res.json();
    if (data.admin) {
      const testBtn = document.getElementById('testDescriptionBtn');
      if (testBtn) {
        testBtn.style.display = 'inline-block';
      }
    }
  } catch (err) {
    console.error('Admin check for test button failed:', err);
  }
}
