// Constants
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const SPIN_COST = 40;
const STARTING_COINS = 1000;
const EARLY_WIN_THRESHOLD = 5; // Number of spins with higher win chance
const EARLY_WIN_CHANCE = 0.4; // 40% win chance for first 5 spins
const NORMAL_WIN_CHANCE = 0.12; // 12% win chance after first 5 spins
const BIG_WIN_CHANCE = 0.015; // ~1.5% chance for big win

// Slot machine symbols (emojis for simplicity)
const SYMBOLS = ['🍒', '🍊', '🍋', '🍇', '🍉', '🍓', '🍌', '💎', '7️⃣', '🎰'];

// Store data and instances
const appData = {
  instances: {},
  currentInstanceId: null,
  isAdmin: false,
  notifications: []
};

// DOM Elements
const screens = {
  login: document.getElementById('login-screen'),
  admin: document.getElementById('admin-dashboard'),
  instance: document.getElementById('instance-dashboard'),
  slot: document.getElementById('slot-machine')
};

const elements = {
  loginBtn: document.getElementById('login-btn'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  createInstanceBtn: document.getElementById('create-instance-btn'),
  instancesList: document.getElementById('instance-items'),
  instanceIdSpan: document.querySelector('#instance-id span'),
  backToAdminBtn: document.getElementById('back-to-admin'),
  startSessionBtn: document.getElementById('start-session-btn'),
  endSessionBtn: document.getElementById('end-session-btn'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  runSimulationBtn: document.getElementById('run-simulation-btn'),
  coinBalance: document.getElementById('coin-balance'),
  spinBtn: document.getElementById('spin-btn'),
  messageDisplay: document.getElementById('message'),
  reels: document.querySelectorAll('.reel .symbol'),
  buyMoreModal: document.getElementById('buy-more'),
  buyCoinsBtn: document.getElementById('buy-coins-btn'),
  noThanksBtn: document.getElementById('no-thanks-btn'),
  simulationModal: document.getElementById('simulation-modal'),
  playerCountInput: document.getElementById('player-count'),
  spinsPerPlayerInput: document.getElementById('spins-per-player'),
  startSimulationBtn: document.getElementById('start-simulation-btn'),
  cancelSimulationBtn: document.getElementById('cancel-simulation-btn'),
  notificationContainer: document.getElementById('notification-container')
};

// Stats elements
const statElements = {
  totalPlayers: document.getElementById('total-players'),
  avgSpins: document.getElementById('avg-spins'),
  avgWins: document.getElementById('avg-wins'),
  avgLosses: document.getElementById('avg-losses'),
  playersWantedBuy: document.getElementById('players-wanted-buy'),
  avgNet: document.getElementById('avg-net')
};

// Chart objects
let charts = {
  winsVsLosses: null,
  coinsLeft: null,
  coinBalanceTime: null,
  timeBetweenSpins: null
};

// Player data model
class Player {
  constructor(id) {
    this.id = id;
    this.coins = STARTING_COINS;
    this.spins = 0;
    this.wins = 0;
    this.losses = 0;
    this.nearMisses = 0;
    this.coinBalanceHistory = [{time: 0, balance: STARTING_COINS}];
    this.spinTimes = [];
    this.winLossEvents = [];
    this.coinsSpent = 0;
    this.totalWinsAmount = 0;
    this.totalLossesAmount = 0;
    this.spinHistory = [];
    this.cantGambleTime = null;
    this.wantToBuyTime = null;
    this.timeBetweenSpins = [];
    this.lastSpinTime = null;
  }
  
  recordSpin(result, symbols, winAmount = 0) {
    const now = Date.now();
    
    // Record time between spins
    if (this.lastSpinTime !== null) {
      const timeDiff = (now - this.lastSpinTime) / 1000; // in seconds
      this.timeBetweenSpins.push(timeDiff);
    }
    this.lastSpinTime = now;
    
    // Record basic spin data
    this.spins++;
    this.coinsSpent += SPIN_COST;
    
    if (result === 'win') {
      this.wins++;
      this.totalWinsAmount += winAmount;
      this.winLossEvents.push({time: now, type: 'win', amount: winAmount});
    } else if (result === 'loss') {
      this.losses++;
      this.totalLossesAmount += SPIN_COST;
      this.winLossEvents.push({time: now, type: 'loss', amount: SPIN_COST});
      
      // Check for near miss (2 matching symbols)
      if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
        this.nearMisses++;
      }
    }
    
    // Record coin balance
    this.coinBalanceHistory.push({
      time: (now - this.coinBalanceHistory[0].time) / 1000, // time in seconds since start
      balance: this.coins
    });
    
    // Record spin time
    this.spinTimes.push({
      time: (now - this.coinBalanceHistory[0].time) / 1000, // time in seconds since start
      spinNumber: this.spins
    });
    
    // Record full spin details
    this.spinHistory.push({
      time: now,
      symbols: [...symbols],
      result: result,
      winAmount: winAmount,
      balanceAfter: this.coins
    });
    
    // Check if player can't afford to spin
    if (this.coins < SPIN_COST && this.cantGambleTime === null) {
      this.cantGambleTime = now;
    }
  }
  
  recordWantToBuy() {
    if (this.wantToBuyTime === null) {
      this.wantToBuyTime = Date.now();
    }
  }
  
  getAverageTimeBetweenSpins() {
    if (this.timeBetweenSpins.length === 0) return 0;
    const sum = this.timeBetweenSpins.reduce((a, b) => a + b, 0);
    return sum / this.timeBetweenSpins.length;
  }
  
  getNetProfit() {
    return this.totalWinsAmount - this.totalLossesAmount;
  }
}

// Instance model to separate data for different sessions
class Instance {
  constructor(id) {
    this.id = id;
    this.players = {};
    this.active = false;
    this.createdAt = Date.now();
  }
  
  addPlayer() {
    const playerId = `player_${Date.now()}`;
    this.players[playerId] = new Player(playerId);
    
    // Add notification for admin
    if (appData.isAdmin) {
      showNotification(`New player joined instance ${this.id.substring(0, 8)}`);
    } else {
      // Store notification for when admin logs in
      appData.notifications.push({
        type: 'new_player',
        instanceId: this.id,
        playerId: playerId,
        time: Date.now(),
        read: false,
        message: `New player joined instance ${this.id.substring(0, 8)}`
      });
      // Save app state to persist the notification
      saveAppState();
    }
    
    // Save app state when a new player is added
    saveAppState();
    
    return playerId;
  }
  
  getPlayer(playerId) {
    return this.players[playerId];
  }
  
  getPlayerCount() {
    return Object.keys(this.players).length;
  }
  
  // Statistics calculations
  getAverageSpins() {
    const players = Object.values(this.players);
    if (players.length === 0) return 0;
    
    const totalSpins = players.reduce((sum, player) => sum + player.spins, 0);
    return totalSpins / players.length;
  }
  
  getAverageWins() {
    const players = Object.values(this.players);
    if (players.length === 0) return 0;
    
    const totalWins = players.reduce((sum, player) => sum + player.wins, 0);
    return totalWins / players.length;
  }
  
  getAverageLosses() {
    const players = Object.values(this.players);
    if (players.length === 0) return 0;
    
    const totalLosses = players.reduce((sum, player) => sum + player.losses, 0);
    return totalLosses / players.length;
  }
  
  getAverageCoinsLeft() {
    const players = Object.values(this.players);
    if (players.length === 0) return 0;
    
    const totalCoins = players.reduce((sum, player) => sum + player.coins, 0);
    return totalCoins / players.length;
  }
  
  getPlayersWhoWantedToBuy() {
    return Object.values(this.players).filter(player => player.wantToBuyTime !== null).length;
  }
  
  getAverageNetProfit() {
    const players = Object.values(this.players);
    if (players.length === 0) return 0;
    
    const totalNet = players.reduce((sum, player) => sum + player.getNetProfit(), 0);
    return totalNet / players.length;
  }
  
  // Data for charts
  getWinsLossesData() {
    const playerIds = Object.keys(this.players).slice(0, 10); // limit to 10 players for chart readability
    const wins = playerIds.map(id => this.players[id].wins);
    const losses = playerIds.map(id => this.players[id].losses);
    
    return {
      labels: playerIds.map(id => id.substring(0, 6) + '...'),
      datasets: [
        {
          label: 'Wins',
          data: wins,
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        },
        {
          label: 'Losses',
          data: losses,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }
      ]
    };
  }
  
  getCoinsLeftDistribution() {
    const players = Object.values(this.players);
    const coinRanges = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
    const distribution = Array(coinRanges.length - 1).fill(0);
    
    players.forEach(player => {
      for (let i = 0; i < coinRanges.length - 1; i++) {
        if (player.coins >= coinRanges[i] && player.coins < coinRanges[i+1]) {
          distribution[i]++;
          break;
        }
      }
    });
    
    const labels = coinRanges.slice(0, -1).map((min, i) => `${min}-${coinRanges[i+1]}`);
    
    return {
      labels: labels,
      datasets: [{
        label: 'Players',
        data: distribution,
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      }]
    };
  }
  
  getCoinBalanceTimeData() {
    // We'll take an average of all players for simplicity
    const players = Object.values(this.players);
    if (players.length === 0) return { labels: [], datasets: [] };
    
    // Get the maximum time across all players
    let maxTime = 0;
    players.forEach(player => {
      if (player.coinBalanceHistory.length > 0) {
        const lastTime = player.coinBalanceHistory[player.coinBalanceHistory.length - 1].time;
        if (lastTime > maxTime) maxTime = lastTime;
      }
    });
    
    // Create time intervals (every 5 seconds)
    const timeInterval = 5;
    const timePoints = [];
    for (let t = 0; t <= maxTime + timeInterval; t += timeInterval) {
      timePoints.push(t);
    }
    
    // For each player, interpolate balance at each time point
    const datasets = players.slice(0, 5).map(player => { // limit to 5 players for chart readability
      const balances = timePoints.map(timePoint => {
        // Find the closest balance entry before and after this time point
        let before = null;
        let after = null;
        
        for (let i = 0; i < player.coinBalanceHistory.length; i++) {
          const entry = player.coinBalanceHistory[i];
          if (entry.time <= timePoint) {
            before = entry;
          } else {
            after = entry;
            break;
          }
        }
        
        if (before === null) return null;
        if (after === null) return before.balance;
        
        // Linear interpolation
        const ratio = (timePoint - before.time) / (after.time - before.time);
        return before.balance + ratio * (after.balance - before.balance);
      });
      
      return {
        label: player.id.substring(0, 6) + '...',
        data: balances,
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1
      };
    });
    
    // Add average line
    const avgData = timePoints.map(timePoint => {
      let sum = 0;
      let count = 0;
      
      players.forEach(player => {
        // Find the closest balance entry before and after this time point
        let before = null;
        let after = null;
        
        for (let i = 0; i < player.coinBalanceHistory.length; i++) {
          const entry = player.coinBalanceHistory[i];
          if (entry.time <= timePoint) {
            before = entry;
          } else {
            after = entry;
            break;
          }
        }
        
        if (before === null) return;
        
        let value;
        if (after === null) {
          value = before.balance;
        } else {
          // Linear interpolation
          const ratio = (timePoint - before.time) / (after.time - before.time);
          value = before.balance + ratio * (after.balance - before.balance);
        }
        
        sum += value;
        count++;
      });
      
      return count > 0 ? sum / count : null;
    });
    
    datasets.push({
      label: 'Average',
      data: avgData,
      fill: false,
      borderColor: 'rgba(0, 0, 0, 0.8)',
      borderWidth: 3,
      tension: 0.1
    });
    
    return {
      labels: timePoints,
      datasets: datasets
    };
  }
  
  getTimeBetweenSpinsData() {
    const players = Object.values(this.players);
    if (players.length === 0) return { labels: [], datasets: [] };
    
    // Get all time intervals
    let allIntervals = [];
    players.forEach(player => {
      allIntervals = allIntervals.concat(player.timeBetweenSpins);
    });
    
    // Create time ranges (in seconds)
    const timeRanges = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 60];
    const distribution = Array(timeRanges.length - 1).fill(0);
    
    allIntervals.forEach(interval => {
      for (let i = 0; i < timeRanges.length - 1; i++) {
        if (interval >= timeRanges[i] && interval < timeRanges[i+1]) {
          distribution[i]++;
          break;
        }
        
        // Last bucket is for all intervals >= the last range value
        if (i === timeRanges.length - 2 && interval >= timeRanges[i+1]) {
          distribution[i]++;
        }
      }
    });
    
    const labels = timeRanges.slice(0, -1).map((min, i) => 
      i === timeRanges.length - 2 ? `${min}+` : `${min}-${timeRanges[i+1]}`
    );
    
    return {
      labels: labels,
      datasets: [{
        label: 'Frequency',
        data: distribution,
        backgroundColor: 'rgba(255, 159, 64, 0.6)'
      }]
    };
  }
}

// Helper function to get random color for charts
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = 'rgba(';
  for (let i = 0; i < 3; i++) {
    color += Math.floor(Math.random() * 256) + ',';
  }
  color += '0.6)';
  return color;
}

// Game Logic
function spinReels(player) {
  // Check if player has enough coins
  if (player.coins < SPIN_COST) {
    showBuyMorePrompt(player);
    return;
  }
  
  // Deduct spin cost
  player.coins -= SPIN_COST;
  updateCoinDisplay(player.coins);
  
  // Start spinning animation
  elements.spinBtn.disabled = true;
  elements.messageDisplay.textContent = '';
  
  for (let i = 0; i < elements.reels.length; i++) {
    elements.reels[i].textContent = '';
    elements.reels[i].classList.add('spinning');
  }
  
  // Determine results after animation delay
  const spinResults = determineSpinResults(player.spins);
  const reelSymbols = spinResults.symbols;
  const isWin = spinResults.isWin;
  const winAmount = spinResults.winAmount;
  const isNearMiss = !isWin && (reelSymbols[0] === reelSymbols[1] || reelSymbols[1] === reelSymbols[2] || reelSymbols[0] === reelSymbols[2]);
  
  // Show results after a delay
  setTimeout(() => {
    // Stop spinning animation
    for (let i = 0; i < elements.reels.length; i++) {
      elements.reels[i].classList.remove('spinning');
      elements.reels[i].textContent = reelSymbols[i];
    }
    
    // Process results
    if (isWin) {
      player.coins += winAmount;
      elements.messageDisplay.textContent = `You won ${winAmount} coins!`;
      elements.messageDisplay.classList.add('win-animation');
      
      // For big wins, add extra animation
      if (winAmount >= 300) {
        for (let i = 0; i < elements.reels.length; i++) {
          elements.reels[i].classList.add('win-animation');
        }
        
        // Play big win sound
        playResultSound('win', false, winAmount);
      } else {
        // Play regular win sound
        playResultSound('win', false, winAmount);
      }
      
      // Record win
      player.recordSpin('win', reelSymbols, winAmount);
    } else {
      elements.messageDisplay.textContent = 'Try again!';
      
      // Play appropriate loss sound (near miss or regular loss)
      playResultSound('loss', isNearMiss, 0);
      
      // Record loss
      player.recordSpin('loss', reelSymbols);
    }
    
    // Update display
    updateCoinDisplay(player.coins);
    
    // Re-enable spin button after a short delay
    setTimeout(() => {
      elements.spinBtn.disabled = false;
      elements.messageDisplay.classList.remove('win-animation');
      for (let i = 0; i < elements.reels.length; i++) {
        elements.reels[i].classList.remove('win-animation');
      }
      
      // Check if player is out of coins
      if (player.coins < SPIN_COST) {
        showBuyMorePrompt(player);
      }
    }, 1000);
    
    // Update stats if in admin mode
    if (appData.isAdmin && appData.currentInstanceId) {
      updateInstanceStats();
    }
  }, 1500); // 1.5 seconds spinning animation
}

function determineSpinResults(spinCount) {
  const symbols = [];
  let isWin = false;
  let winAmount = 0;
  
  // Decide if this is a win based on the spin count
  const winChance = spinCount < EARLY_WIN_THRESHOLD ? EARLY_WIN_CHANCE : NORMAL_WIN_CHANCE;
  const randomValue = Math.random();
  
  if (randomValue < winChance) {
    // This is a win, decide if it's a big win
    const isBigWin = Math.random() < BIG_WIN_CHANCE;
    
    // Choose the winning symbol
    const winningSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    
    // All 3 reels show the same symbol
    symbols[0] = winningSymbol;
    symbols[1] = winningSymbol;
    symbols[2] = winningSymbol;
    
    // Calculate win amount
    if (isBigWin) {
      winAmount = 300 + Math.floor(Math.random() * 100); // 300-399 coins
    } else {
      winAmount = 60 + Math.floor(Math.random() * 21); // 60-80 coins
    }
    
    isWin = true;
  } else {
    // This is a loss, decide if it's a near miss
    const isNearMiss = Math.random() < 0.5; // 50% chance for near miss
    
    if (isNearMiss) {
      // Create a near miss with 2 matching symbols
      const winningSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const differentSymbol = SYMBOLS.filter(s => s !== winningSymbol)[
        Math.floor(Math.random() * (SYMBOLS.length - 1))
      ];
      
      // Determine which position will have the different symbol
      const differentPosition = Math.floor(Math.random() * 3);
      
      for (let i = 0; i < 3; i++) {
        symbols[i] = i === differentPosition ? differentSymbol : winningSymbol;
      }
    } else {
      // Complete miss, all different symbols
      let availableSymbols = [...SYMBOLS];
      
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableSymbols.length);
        symbols[i] = availableSymbols[randomIndex];
        
        // Remove the selected symbol to ensure all are different
        availableSymbols.splice(randomIndex, 1);
      }
    }
  }
  
  return { symbols, isWin, winAmount };
}

// UI Handlers
function showScreen(screenId) {
  Object.values(screens).forEach(screen => {
    screen.classList.add('hidden');
  });
  
  screens[screenId].classList.remove('hidden');
}

function updateCoinDisplay(coins) {
  elements.coinBalance.textContent = coins;
}

function showBuyMorePrompt(player) {
  elements.buyMoreModal.classList.remove('hidden');
  player.recordWantToBuy();
}

function showSimulationModal() {
  elements.simulationModal.classList.remove('hidden');
}

function hideSimulationModal() {
  elements.simulationModal.classList.add('hidden');
}

function createInstanceElement(instance) {
  const li = document.createElement('li');
  
  const nameSpan = document.createElement('span');
  nameSpan.textContent = `Instance ${instance.id} (${instance.getPlayerCount()} players)`;
  
  const btnContainer = document.createElement('div');
  
  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'View Dashboard';
  viewBtn.addEventListener('click', () => showInstanceDashboard(instance.id));
  
  btnContainer.appendChild(viewBtn);
  li.appendChild(nameSpan);
  li.appendChild(btnContainer);
  
  return li;
}

function updateInstancesList() {
  elements.instancesList.innerHTML = '';
  
  Object.values(appData.instances).forEach(instance => {
    const li = createInstanceElement(instance);
    elements.instancesList.appendChild(li);
  });
}

function updateInstanceStats() {
  const instance = appData.instances[appData.currentInstanceId];
  if (!instance) return;
  
  // Update stat cards
  statElements.totalPlayers.textContent = instance.getPlayerCount();
  statElements.avgSpins.textContent = instance.getAverageSpins().toFixed(1);
  statElements.avgWins.textContent = instance.getAverageWins().toFixed(1);
  statElements.avgLosses.textContent = instance.getAverageLosses().toFixed(1);
  statElements.playersWantedBuy.textContent = instance.getPlayersWhoWantedToBuy();
  statElements.avgNet.textContent = instance.getAverageNetProfit().toFixed(1);
  
  // Update charts
  updateCharts(instance);
}

function updateCharts(instance) {
  // Destroy existing charts
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  
  // Create new charts
  charts.winsVsLosses = new Chart(
    document.getElementById('wins-vs-losses-chart'),
    {
      type: 'bar',
      data: instance.getWinsLossesData(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Wins vs Losses per Player'
          }
        }
      }
    }
  );
  
  charts.coinsLeft = new Chart(
    document.getElementById('coins-left-chart'),
    {
      type: 'bar',
      data: instance.getCoinsLeftDistribution(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Coins Left Distribution'
          }
        }
      }
    }
  );
  
  charts.coinBalanceTime = new Chart(
    document.getElementById('coin-balance-time-chart'),
    {
      type: 'line',
      data: instance.getCoinBalanceTimeData(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Coin Balance Over Time'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Coins'
            }
          }
        }
      }
    }
  );
  
  charts.timeBetweenSpins = new Chart(
    document.getElementById('time-between-spins-chart'),
    {
      type: 'bar',
      data: instance.getTimeBetweenSpinsData(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Time Between Spins (seconds)'
          }
        }
      }
    }
  );
}

// Admin functions
function createInstance() {
  const instanceId = `instance_${Date.now()}`;
  appData.instances[instanceId] = new Instance(instanceId);
  saveAppState();
  updateInstancesList();
}

function showInstanceDashboard(instanceId) {
  appData.currentInstanceId = instanceId;
  elements.instanceIdSpan.textContent = instanceId;
  
  const instance = appData.instances[instanceId];
  elements.startSessionBtn.disabled = instance.active;
  elements.endSessionBtn.disabled = !instance.active;
  
  updateInstanceStats();
  updateCharts(instance);
  
  showScreen('instance');
  
  // Save current state
  saveAppState();
}

// Player functions
function startGame(instanceId, playerId) {
  if (!appData.instances[instanceId]) {
    // Try to load from localStorage
    if (!loadAppState() || !appData.instances[instanceId]) {
      alert('Invalid instance ID');
      return;
    }
  }
  
  const instance = appData.instances[instanceId];
  
  // Create player if they don't exist
  let player;
  if (!playerId) {
    playerId = instance.addPlayer();
    player = instance.getPlayer(playerId);
    
    // Save the new player state
    saveAppState();
  } else {
    player = instance.getPlayer(playerId);
    if (!player) {
      alert('Invalid player ID');
      return;
    }
  }
  
  // Update session storage for player (not localStorage to avoid modifications)
  sessionStorage.setItem('playerId', playerId);
  sessionStorage.setItem('instanceId', instanceId);
  
  // Set up slot machine for player
  updateCoinDisplay(player.coins);
  
  // Show slot machine screen
  showScreen('slot');
  
  // Add event listener for spin button (removed when player leaves)
  elements.spinBtn.onclick = function() {
    if (player.coins >= SPIN_COST) {
      spinReels(player);
    } else {
      showBuyMorePrompt(player);
    }
  };
  
  // Save app state after setup
  saveAppState();
}

// Simulation functions
function runSimulation(instanceId, playerCount, spinsPerPlayer) {
  const instance = appData.instances[instanceId];
  
  // Create simulated players
  const simulatedPlayers = [];
  for (let i = 0; i < playerCount; i++) {
    const playerId = instance.addPlayer();
    simulatedPlayers.push(instance.getPlayer(playerId));
  }
  
  // Perform spins for each player
  simulatedPlayers.forEach(player => {
    for (let i = 0; i < spinsPerPlayer && player.coins >= SPIN_COST; i++) {
      // Determine outcome of the spin
      const spinCount = player.spins;
      const { result, symbols, winAmount } = determineSpinResults(spinCount);
      
      // Apply result to player
      if (result === 'win') {
        player.coins += winAmount - SPIN_COST;
      } else {
        player.coins -= SPIN_COST;
      }
      
      // Record the spin
      player.recordSpin(result, symbols, winAmount);
      
      // Simulate the player wanting to buy more coins (30% chance when they're low)
      if (player.coins < 100 && Math.random() < 0.3) {
        player.recordWantToBuy();
      }
    }
  });
  
  // Update stats and charts
  updateInstanceStats();
  updateCharts(instance);
  
  // Save simulation results
  saveAppState();
  
  hideSimulationModal();
  
  showNotification(`Simulation completed: ${playerCount} players, ${spinsPerPlayer} spins each`);
}

// Persistence functions
function saveAppState() {
  // Create a copy of appData to save, excluding any circular references
  const dataToSave = {
    instances: {},
    currentInstanceId: appData.currentInstanceId,
    notifications: appData.notifications || []
  };
  
  // Save each instance
  for (const instanceId in appData.instances) {
    const instance = appData.instances[instanceId];
    dataToSave.instances[instanceId] = {
      id: instance.id,
      players: {},
      active: instance.active,
      createdAt: instance.createdAt
    };
    
    // Save each player within the instance
    for (const playerId in instance.players) {
      const player = instance.players[playerId];
      dataToSave.instances[instanceId].players[playerId] = { ...player };
    }
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('gamblingSim', JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to save app state:', e);
  }
}

function loadAppState() {
  try {
    const savedData = localStorage.getItem('gamblingSim');
    if (!savedData) return false;
    
    const parsedData = JSON.parse(savedData);
    
    // Clear current data
    appData.instances = {};
    appData.currentInstanceId = parsedData.currentInstanceId;
    appData.notifications = parsedData.notifications || [];
    
    // Recreate instances and players
    for (const instanceId in parsedData.instances) {
      const savedInstance = parsedData.instances[instanceId];
      const instance = new Instance(savedInstance.id);
      instance.active = savedInstance.active;
      instance.createdAt = savedInstance.createdAt;
      
      // Recreate each player
      for (const playerId in savedInstance.players) {
        const savedPlayer = savedInstance.players[playerId];
        const player = new Player(playerId);
        
        // Copy all properties from saved player to the new player object
        Object.assign(player, savedPlayer);
        
        // Add the player to the instance
        instance.players[playerId] = player;
      }
      
      // Add the instance to the app data
      appData.instances[instanceId] = instance;
    }
    
    return true;
  } catch (e) {
    console.error('Failed to load app state:', e);
    return false;
  }
}

// Notification system
function createNotificationElement() {
  // Create notification container if it doesn't exist
  if (!document.getElementById('notification-container')) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    elements.notificationContainer = container;
  }
}

function showNotification(message, duration = 5000) {
  // Ensure notification container exists
  createNotificationElement();
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'notification-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    notification.remove();
  };
  
  notification.appendChild(closeBtn);
  elements.notificationContainer.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
}

function displayUnreadNotifications() {
  if (!appData.notifications || !appData.isAdmin) return;
  
  const unreadNotifications = appData.notifications.filter(n => !n.read);
  
  unreadNotifications.forEach(notification => {
    showNotification(notification.message);
    notification.read = true;
  });
  
  // Save updated notification status
  saveAppState();
}

// Event Listeners
function setupEventListeners() {
  // Login
  elements.loginBtn.addEventListener('click', function() {
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      appData.isAdmin = true;
      
      // Load app state from storage
      loadAppState();
      
      // Update UI based on loaded state
      updateInstancesList();
      
      // Show admin dashboard
      showScreen('admin');
      
      // Display any unread notifications
      displayUnreadNotifications();
    } else {
      alert('Invalid credentials');
    }
  });
  
  // Create instance
  elements.createInstanceBtn.addEventListener('click', function() {
    createInstance();
  });
  
  // Instance dashboard
  elements.backToAdminBtn.addEventListener('click', () => {
    showScreen('admin');
    updateInstancesList();
    playSound('buttonClick');
  });
  
  elements.startSessionBtn.addEventListener('click', () => {
    const instance = appData.instances[appData.currentInstanceId];
    if (instance) {
      instance.active = true;
      elements.startSessionBtn.disabled = true;
      elements.endSessionBtn.disabled = false;
      
      // Generate player link
      const baseUrl = window.location.href.split('?')[0];
      const playerLink = `${baseUrl}?instance=${instance.id}`;
      
      alert(`Session started! Players can join at:\n${playerLink}`);
      playSound('buttonClick');
    }
  });
  
  elements.endSessionBtn.addEventListener('click', () => {
    const instance = appData.instances[appData.currentInstanceId];
    if (instance) {
      instance.active = false;
      elements.startSessionBtn.disabled = false;
      elements.endSessionBtn.disabled = true;
      alert('Session ended!');
      playSound('buttonClick');
    }
  });
  
  elements.copyLinkBtn.addEventListener('click', () => {
    const instance = appData.instances[appData.currentInstanceId];
    if (instance) {
      const baseUrl = window.location.href.split('?')[0];
      const playerLink = `${baseUrl}?instance=${instance.id}`;
      
      navigator.clipboard.writeText(playerLink)
        .then(() => {
          alert('Link copied to clipboard!');
          playSound('buttonClick');
        })
        .catch(err => alert('Failed to copy link. Please copy it manually: ' + playerLink));
    }
  });
  
  // Simulation
  elements.runSimulationBtn.addEventListener('click', () => {
    showSimulationModal();
    playSound('buttonClick');
  });
  
  elements.startSimulationBtn.addEventListener('click', () => {
    const playerCount = parseInt(elements.playerCountInput.value) || 10;
    const spinsPerPlayer = parseInt(elements.spinsPerPlayerInput.value) || 30;
    
    hideSimulationModal();
    runSimulation(appData.currentInstanceId, playerCount, spinsPerPlayer);
    playSound('buttonClick');
  });
  
  elements.cancelSimulationBtn.addEventListener('click', () => {
    hideSimulationModal();
    playSound('buttonClick');
  });
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    // Space bar to spin
    if (e.code === 'Space' && 
        !screens.slot.classList.contains('hidden') && 
        !elements.spinBtn.disabled) {
      e.preventDefault(); // Prevent scrolling
      elements.spinBtn.click();
    }
    
    // Enter key for dialogs
    if (e.code === 'Enter') {
      if (!elements.buyMoreModal.classList.contains('hidden')) {
        elements.buyCoinsBtn.click();
      } else if (!elements.simulationModal.classList.contains('hidden')) {
        elements.startSimulationBtn.click();
      }
    }
    
    // Escape key to cancel dialogs
    if (e.code === 'Escape') {
      if (!elements.buyMoreModal.classList.contains('hidden')) {
        elements.noThanksBtn.click();
      } else if (!elements.simulationModal.classList.contains('hidden')) {
        elements.cancelSimulationBtn.click();
      }
    }
  });
  
  // When window closes or refreshes, save state
  window.addEventListener('beforeunload', function() {
    saveAppState();
  });
}

// Initialization
function init() {
  // Try to load saved state
  const stateLoaded = loadAppState();
  
  // Check if player URL parameters are provided
  const urlParams = new URLSearchParams(window.location.search);
  const instanceId = urlParams.get('instance');
  const playerId = urlParams.get('player');
  
  // Create the notification container
  createNotificationElement();
  
  // Add CSS for notification system
  const notificationStyle = document.createElement('style');
  notificationStyle.textContent = `
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
    }
    
    .notification {
      background-color: #343a40;
      color: white;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 5px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16);
      position: relative;
      animation: notificationFadeIn 0.3s ease-in-out;
    }
    
    .notification-close {
      position: absolute;
      top: 5px;
      right: 10px;
      cursor: pointer;
      font-size: 18px;
    }
    
    @keyframes notificationFadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(notificationStyle);
  
  // Setup all event listeners
  setupEventListeners();
  
  if (instanceId && playerId) {
    // Direct access to game (player link)
    startGame(instanceId, playerId);
  } else {
    // Show login screen by default
    showScreen('login');
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 