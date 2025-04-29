// Sound effects for the gambling app
const sounds = {
  spin: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-wheel-1932.mp3'),
  win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-casino-bling-achievement-2067.mp3'),
  bigWin: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
  lose: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-tap-2576.mp3'),
  nearMiss: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-notification-wave-alarm-987.mp3'),
  buttonClick: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3'),
  coinDrop: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-coins-handling-1939.mp3')
};

// Volume settings
sounds.spin.volume = 0.3;
sounds.win.volume = 0.5;
sounds.bigWin.volume = 0.7;
sounds.lose.volume = 0.3;
sounds.nearMiss.volume = 0.4;
sounds.buttonClick.volume = 0.2;
sounds.coinDrop.volume = 0.4;

// Functions to play sounds
function playSound(soundName) {
  // Only play sounds if they've been loaded and user has interacted with the page
  if (sounds[soundName] && document.documentElement.hasAttribute('data-user-interacted')) {
    // Stop and reset the sound first (in case it's already playing)
    sounds[soundName].pause();
    sounds[soundName].currentTime = 0;
    
    // Play the sound
    sounds[soundName].play().catch(error => {
      console.log(`Failed to play sound: ${error}`);
    });
  }
}

// Initialize sounds after user interaction
function initSounds() {
  // Mark that user has interacted with the page
  document.documentElement.setAttribute('data-user-interacted', 'true');
  
  // Preload all sounds
  Object.values(sounds).forEach(sound => {
    sound.load();
  });
}

// Add sound triggers to UI elements
function setupSoundTriggers() {
  // Find elements
  const spinBtn = document.getElementById('spin-btn');
  const buyCoinsBtn = document.getElementById('buy-coins-btn');
  const noThanksBtn = document.getElementById('no-thanks-btn');
  const loginBtn = document.getElementById('login-btn');
  
  // Add listeners
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      playSound('spin');
    });
  }
  
  if (buyCoinsBtn) {
    buyCoinsBtn.addEventListener('click', () => {
      playSound('coinDrop');
    });
  }
  
  if (noThanksBtn) {
    noThanksBtn.addEventListener('click', () => {
      playSound('buttonClick');
    });
  }
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      playSound('buttonClick');
    });
  }
  
  // Set up global click listener to initialize sounds
  document.addEventListener('click', function initOnFirstClick() {
    initSounds();
    document.removeEventListener('click', initOnFirstClick);
  }, { once: true });
}

// Function to play result sounds based on game outcome
function playResultSound(result, isNearMiss, winAmount) {
  if (result === 'win') {
    if (winAmount >= 300) {
      playSound('bigWin');
    } else {
      playSound('win');
    }
  } else if (result === 'loss') {
    if (isNearMiss) {
      playSound('nearMiss');
    } else {
      playSound('lose');
    }
  }
}

// Initialize sound triggers when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupSoundTriggers); 