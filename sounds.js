// Sound effects for the gambling app
const soundUrls = {
  spin: 'https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-wheel-1932.mp3',
  win: 'https://assets.mixkit.co/sfx/preview/mixkit-casino-bling-achievement-2067.mp3',
  bigWin: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
  lose: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-tap-2576.mp3',
  nearMiss: 'https://assets.mixkit.co/sfx/preview/mixkit-game-notification-wave-alarm-987.mp3',
  buttonClick: 'https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3',
  coinDrop: 'https://assets.mixkit.co/sfx/preview/mixkit-coins-handling-1939.mp3'
};

// Create Audio objects with fallback
const sounds = {};
let soundsLoaded = false;
let soundsError = false;

// Functions to play sounds
function playSound(soundName) {
  // Skip if sounds had loading errors or user hasn't interacted
  if (soundsError || !document.documentElement.hasAttribute('data-user-interacted')) {
    return;
  }
  
  // Check if sounds exist
  if (!sounds[soundName]) {
    console.log(`Sound ${soundName} not found`);
    return;
  }
  
  try {
    // Stop and reset the sound first (in case it's already playing)
    sounds[soundName].pause();
    sounds[soundName].currentTime = 0;
    
    // Play the sound with error handling
    sounds[soundName].play().catch(error => {
      console.log(`Failed to play sound: ${error}`);
      // Mark as error so we don't keep trying
      if (error.name === 'NotSupportedError') {
        soundsError = true;
      }
    });
  } catch (e) {
    console.log(`Error playing sound: ${e.message}`);
  }
}

// Initialize sounds after user interaction
function initSounds() {
  // Mark that user has interacted with the page
  document.documentElement.setAttribute('data-user-interacted', 'true');
  
  // Only initialize once
  if (soundsLoaded) return;
  
  // Create and load all sound objects
  try {
    Object.keys(soundUrls).forEach(soundName => {
      sounds[soundName] = new Audio(soundUrls[soundName]);
      sounds[soundName].volume = getSoundVolume(soundName);
      
      // Add error handling for each sound
      sounds[soundName].addEventListener('error', () => {
        console.log(`Error loading sound: ${soundName}`);
      });
      
      // Start loading the sound
      sounds[soundName].load();
    });
    
    soundsLoaded = true;
  } catch (e) {
    console.log(`Error initializing sounds: ${e.message}`);
    soundsError = true;
  }
}

// Helper function to get volume for each sound
function getSoundVolume(soundName) {
  const volumes = {
    spin: 0.3,
    win: 0.5,
    bigWin: 0.7,
    lose: 0.3,
    nearMiss: 0.4,
    buttonClick: 0.2,
    coinDrop: 0.4
  };
  
  return volumes[soundName] || 0.5;
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