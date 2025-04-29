/**
 * Standalone Slot Machine Game Logic
 * Based on standalone_slot_machine.html but integrated with session management
 */

class SlotMachine {
    constructor() {
        // Game elements
        this.reels = Array.from(document.querySelectorAll('.reel'));
        this.spinButton = document.getElementById('spin-button');
        this.creditDisplay = document.getElementById('credit-display');
        this.slotDisplay = document.querySelector('.slot-display');
        this.buyMoreModal = document.getElementById('buy-more-modal');
        this.buyMoreYesButton = document.getElementById('buy-more-yes');
        this.buyMoreNoButton = document.getElementById('buy-more-no');
        
        // Game state
        this.currentPlayer = null;
        this.playerData = null;
        this.isSpinning = false;
        this.spinCount = 0;
        this.coinCount = 1000; // Starting with 10.00 credits (100 cents = 1 credit)
        this.startTime = Date.now();
        this.bigWinGiven = false;
        
        // Mobile detection
        this.isMobile = this.checkIfMobile();
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        // Constants
        this.SPIN_COST = 40;
        this.SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣', '🎰'];
        
        // Sound effects
        this.sounds = {
            spin: new Audio('public/sounds/spin.mp3'),
            win: new Audio('public/sounds/win.mp3'),
            lose: new Audio('public/sounds/lose.mp3'),
            nearMiss: new Audio('public/sounds/near_miss.mp3')
        };
        
        // Initialize player and event listeners
        this.initPlayer();
        this.initEventListeners();
        
        // Apply mobile-specific adjustments
        if (this.isMobile) {
            this.applyMobileOptimizations();
        }
    }
    
    /**
     * Check if the user is on a mobile device
     */
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.matchMedia("(max-width: 768px)").matches);
    }
    
    /**
     * Initialize a new player
     */
    initPlayer() {
        // Create a new player in the session
        this.currentPlayer = sessionManager.createNewPlayer();
        this.playerData = sessionManager.getPlayer(this.currentPlayer);
        
        // Initialize player data with 10.00 credits (1000 cents)
        this.coinCount = 1000;
        this.playerData.coinsLeft = 10;
        sessionManager.updatePlayerData(this.currentPlayer, { coinsLeft: 10 });
        
        this.updateCreditDisplay();
    }
    
    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
        // Adjust UI based on orientation
        this.handleOrientationChange();
        
        // Listen for orientation changes
        window.addEventListener('resize', () => {
            const newOrientation = window.innerHeight > window.innerWidth;
            if (newOrientation !== this.isPortrait) {
                this.isPortrait = newOrientation;
                this.handleOrientationChange();
            }
        });
        
        // Add touch-specific classes
        document.body.classList.add('mobile-device');
        if (this.isPortrait) {
            document.body.classList.add('portrait');
        } else {
            document.body.classList.add('landscape');
        }
        
        // Ensure buttons have proper touch feedback
        const touchTargets = [this.spinButton, this.buyMoreYesButton, this.buyMoreNoButton];
        touchTargets.forEach(button => {
            if (button) {
                button.classList.add('touch-target');
            }
        });
    }
    
    /**
     * Handle orientation changes for mobile
     */
    handleOrientationChange() {
        if (this.isPortrait) {
            // Portrait adjustments
            document.body.classList.remove('landscape');
            document.body.classList.add('portrait');
        } else {
            // Landscape adjustments
            document.body.classList.remove('portrait');
            document.body.classList.add('landscape');
        }
    }
    
    /**
     * Trigger device vibration (if supported)
     */
    vibrate(pattern) {
        if (this.isMobile && 'vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                console.warn('Vibration not supported', e);
            }
        }
    }
    
    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Spin button event - use touchend for mobile
        if (this.isMobile) {
            this.spinButton.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent ghost clicks
                if (!this.spinButton.disabled) {
                    this.handleSpin();
                }
            }, { passive: false });
        } else {
            this.spinButton.addEventListener('click', () => this.handleSpin());
        }
        
        // Buy more coins buttons
        if (this.buyMoreYesButton && this.buyMoreNoButton) {
            // Mobile optimized event handlers
            if (this.isMobile) {
                this.buyMoreYesButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.buyMoreCoins();
                }, { passive: false });
                
                this.buyMoreNoButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.endGame();
                }, { passive: false });
            } else {
                this.buyMoreYesButton.addEventListener('click', () => this.buyMoreCoins());
                this.buyMoreNoButton.addEventListener('click', () => this.endGame());
            }
        }
        
        // Button animations - shared between mobile and desktop
        this.spinButton.addEventListener('mousedown', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(4px)';
                this.style.boxShadow = '0 0 0 #c62d00';
            }
        });
        
        this.spinButton.addEventListener('mouseup', function() {
            if (!this.disabled) {
                this.style.transform = '';
                this.style.boxShadow = '0 4px 0 #c62d00';
            }
        });
        
        this.spinButton.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = '';
                this.style.boxShadow = '0 4px 0 #c62d00';
            }
        });
        
        // Prevent double tap zoom on iOS
        if (this.isMobile) {
            document.addEventListener('touchmove', function(e) {
                if (e.scale !== 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // Listen for page close to save final stats
        window.addEventListener('beforeunload', () => {
            this.savePlayerStats();
        });
        
        // Add swipe down to refresh coins (only when out of coins)
        if (this.isMobile) {
            let touchStartY = 0;
            let touchEndY = 0;
            
            document.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                touchEndY = e.changedTouches[0].clientY;
                if (this.coinCount < this.SPIN_COST && touchEndY - touchStartY > 100) {
                    // Swipe down detected when out of coins
                    this.buyMoreCoins();
                    this.vibrate([15, 10, 15]);
                }
            }, { passive: true });
        }
    }
    
    /**
     * Convert cents to display format
     */
    formatCredit(cents) {
        return (cents / 100).toFixed(2);
    }
    
    /**
     * Update the credit display
     */
    updateCreditDisplay() {
        if (this.creditDisplay) {
            this.creditDisplay.textContent = 'CREDIT ' + this.formatCredit(this.coinCount);
        }
        
        // Update the coin-count for session display
        const coinCountElement = document.getElementById('coin-count');
        if (coinCountElement) {
            coinCountElement.textContent = (this.coinCount / 100).toFixed(2);
        }
        
        // Update player data and record balance history
        const dollars = this.coinCount / 100;
        this.playerData.coinsLeft = dollars;
        
        // Record the balance change in the player's history
        sessionManager.recordBalanceChange(this.currentPlayer, dollars, 'update');
        
        // Disable spin button if not enough coins
        this.spinButton.disabled = this.coinCount < this.SPIN_COST;
    }
    
    /**
     * Handle spin button click
     */
    handleSpin() {
        // Check if already spinning
        if (this.isSpinning) return;
        this.isSpinning = true;
        
        // Check if player has enough coins
        if (this.coinCount < this.SPIN_COST) {
            this.showOutOfCoinsMessage();
            this.isSpinning = false;
            return;
        }
        
        // Vibrate on mobile
        if (this.isMobile) {
            this.vibrate(20);
        }
        
        // Deduct cost
        this.coinCount -= this.SPIN_COST;
        this.spinCount++;
        
        // Update session data
        this.playerData.spins = this.spinCount;
        this.playerData.coinsLeft = this.coinCount / 100; // Convert to dollars for session data
        
        // Record the balance change with spin event type
        sessionManager.recordBalanceChange(this.currentPlayer, this.playerData.coinsLeft, 'spin');
        
        sessionManager.updatePlayerData(this.currentPlayer, {
            coinsLeft: this.playerData.coinsLeft,
            spins: this.spinCount
        });
        
        this.updateCreditDisplay();
        
        // Disable button during animation
        this.spinButton.disabled = true;
        
        // Remove any existing win message during spin
        this.removeElement('.win-message');
        this.removeElement('.message');
        this.removeElement('.buy-more-btn');
        this.removeElement('.near-miss');
        
        // Add flashing lights animation
        this.slotDisplay.classList.add('spinning');
        
        // Play spin sound
        this.playSound('spin');
        
        // Start the spinning animation
        this.startSpinAnimation().then(() => {
            // Process the spin result
            const result = this.processSpinResult();
            
            // Update credits with winnings
            this.coinCount += result.win_amount;
            this.playerData.coinsLeft = this.coinCount / 100;
            
            // Update win/loss stats
            if (result.is_win) {
                this.playerData.wins++;
                
                // Vibrate for win on mobile (stronger for big win)
                if (this.isMobile) {
                    if (result.is_big_win) {
                        this.vibrate([30, 50, 30, 50, 80]);
                    } else {
                        this.vibrate([15, 15, 30]);
                    }
                }
                
                // Record the balance change with win event type
                sessionManager.recordBalanceChange(this.currentPlayer, this.playerData.coinsLeft, 'win');
                
                sessionManager.updatePlayerData(this.currentPlayer, {
                    coinsLeft: this.playerData.coinsLeft,
                    wins: this.playerData.wins
                });
                
                // Play win sound
                this.playSound('win');
            } else {
                this.playerData.losses++;
                
                // Short vibration for loss
                if (this.isMobile && !result.is_near_miss) {
                    this.vibrate(10);
                }
                
                // Record the balance change with loss event type
                sessionManager.recordBalanceChange(this.currentPlayer, this.playerData.coinsLeft, 'loss');
                
                sessionManager.updatePlayerData(this.currentPlayer, {
                    coinsLeft: this.playerData.coinsLeft,
                    losses: this.playerData.losses
                });
                
                // Play lose sound if not a near miss
                if (!result.is_near_miss) {
                    this.playSound('lose');
                }
            }
            
            this.updateCreditDisplay();
            
            // Check for near miss
            if (result.is_near_miss) {
                this.displayNearMiss();
                this.playerData.nearMisses++;
                
                // Distinct vibration for near miss on mobile
                if (this.isMobile) {
                    this.vibrate([20, 40, 20]);
                }
                
                sessionManager.updatePlayerData(this.currentPlayer, {
                    nearMisses: this.playerData.nearMisses
                });
                
                // Play near miss sound
                this.playSound('nearMiss');
            }
            
            // Show win message if applicable
            if (result.win_amount > 0) {
                this.showWinMessage(result.win_amount, result.is_big_win);
            }
            
            // Check if out of coins
            if (this.coinCount < this.SPIN_COST) {
                this.showOutOfCoinsMessage();
            }
            
            // Reset spinning state
            this.isSpinning = false;
        });
    }
    
    /**
     * Start the spinning animation for all reels
     */
    startSpinAnimation() {
        return new Promise(resolve => {
            const originalSymbols = [];
            
            // Store original symbols and start spinning effect
            this.reels.forEach((reel, index) => {
                originalSymbols.push(reel.textContent);
                
                // Add spinning class
                reel.classList.add('spinning');
                
                // Start the rapid symbol change animation
                let spinInterval = setInterval(() => {
                    reel.textContent = this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
                }, 100);
                
                // Use setTimeout to create a staggered spinning effect
                setTimeout(() => {
                    // Clear the rapid symbol change
                    clearInterval(spinInterval);
                    
                    // Apply main reel spinning animation
                    reel.style.animation = `spin-reel 1.5s ease-out`;
                    
                    // Remove animation after it completes
                    setTimeout(() => {
                        reel.style.animation = '';
                        reel.classList.remove('spinning');
                        
                        // If this is the last reel, resolve the promise
                        if (index === this.reels.length - 1) {
                            // Remove flashing lights
                            this.slotDisplay.classList.remove('spinning');
                            this.spinButton.disabled = false;
                            resolve();
                        }
                    }, 1500);
                }, 500 + (index * 300)); // Staggered start for each reel
            });
        });
    }
    
    /**
     * Process the result of a spin based on win probability
     */
    processSpinResult() {
        // First 5 spins logic - higher win chance
        let winChance, isBigWin;
        
        if (this.spinCount <= 5) {
            // Guarantee one big win within first 5 spins if not already given
            if (!this.bigWinGiven && (this.spinCount === 3 || (this.spinCount === 5 && !this.bigWinGiven))) {
                const result = this.generateBigWin();
                this.bigWinGiven = true;
                return result;
            }
            
            // Higher general win chance (30%)
            winChance = 30;
        } else {
            // Lower win chance after first 5 spins (10%)
            winChance = 10;
        }
        
        // Determine if this spin is a win based on the win chance
        const isWin = (Math.random() * 100 <= winChance);
        
        // For spins after the first 5, determine if it's a big win (1% chance if it's a win)
        isBigWin = (this.spinCount > 5 && isWin && Math.random() * 100 <= 8); // ~1% of total spins
        
        if (isBigWin) {
            const result = this.generateBigWin();
            this.bigWinGiven = true;
            return result;
        } else if (isWin) {
            return this.generateSmallWin();
        } else {
            // Not a win - 30% chance of near miss
            if (Math.random() * 100 <= 30) {
                return this.generateNearMiss();
            } else {
                return this.generateLoss();
            }
        }
    }
    
    /**
     * Generate a big win result
     */
    generateBigWin() {
        // Use premium symbols (last 3)
        const premiumSymbols = this.SYMBOLS.slice(5, 8);
        const winSymbol = premiumSymbols[Math.floor(Math.random() * premiumSymbols.length)];
        
        this.updateReels([winSymbol, winSymbol, winSymbol]);
        
        return {
            symbols: [winSymbol, winSymbol, winSymbol],
            win_amount: Math.floor(Math.random() * 51) + 250, // 250-300 cents
            is_win: true,
            is_big_win: true,
            is_near_miss: false
        };
    }
    
    /**
     * Generate a small win result
     */
    generateSmallWin() {
        // Use common symbols (first 5)
        const commonSymbols = this.SYMBOLS.slice(0, 5);
        const winSymbol = commonSymbols[Math.floor(Math.random() * commonSymbols.length)];
        
        this.updateReels([winSymbol, winSymbol, winSymbol]);
        
        return {
            symbols: [winSymbol, winSymbol, winSymbol],
            win_amount: Math.floor(Math.random() * 21) + 60, // 60-80 cents
            is_win: true,
            is_big_win: false,
            is_near_miss: false
        };
    }
    
    /**
     * Generate a near miss result
     */
    generateNearMiss() {
        // Pick a random symbol for the near miss
        const nearMissSymbol = this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
        
        // Create a result with 2 matching symbols
        let resultSymbols = [nearMissSymbol, nearMissSymbol, ''];
        
        // Randomly decide if the near miss is at the beginning or end
        if (Math.random() > 0.5) {
            resultSymbols = ['', nearMissSymbol, nearMissSymbol];
        }
        
        // Fill the remaining position with a different symbol
        let otherSymbol;
        do {
            otherSymbol = this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
        } while (otherSymbol === nearMissSymbol);
        
        // Replace the empty position
        for (let i = 0; i < resultSymbols.length; i++) {
            if (resultSymbols[i] === '') {
                resultSymbols[i] = otherSymbol;
                break;
            }
        }
        
        this.updateReels(resultSymbols);
        
        return {
            symbols: resultSymbols,
            win_amount: 0,
            is_win: false,
            is_big_win: false,
            is_near_miss: true
        };
    }
    
    /**
     * Generate a loss result
     */
    generateLoss() {
        let resultSymbols;
        
        // Fill with random symbols, ensuring they don't all match
        do {
            resultSymbols = Array(3).fill().map(() => 
                this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)]
            );
        } while (
            resultSymbols[0] === resultSymbols[1] && 
            resultSymbols[1] === resultSymbols[2]
        );
        
        this.updateReels(resultSymbols);
        
        return {
            symbols: resultSymbols,
            win_amount: 0,
            is_win: false,
            is_big_win: false,
            is_near_miss: false
        };
    }
    
    /**
     * Update the reels with the given symbols
     */
    updateReels(symbols) {
        this.reels.forEach((reel, index) => {
            if (index < symbols.length) {
                reel.textContent = symbols[index];
            }
        });
    }
    
    /**
     * Display a near miss indicator
     */
    displayNearMiss() {
        const nearMiss = document.createElement('div');
        nearMiss.className = 'near-miss';
        nearMiss.textContent = '!';
        
        this.slotDisplay.appendChild(nearMiss);
        
        // Add subtle animation on mobile
        if (this.isMobile) {
            nearMiss.style.animation = 'subtle-vibration 0.1s 3';
        }
        
        // Remove after 2 seconds
        setTimeout(() => {
            nearMiss.style.opacity = '0';
            setTimeout(() => nearMiss.remove(), 300);
        }, 2000);
    }
    
    /**
     * Show a win message
     */
    showWinMessage(amount, isBigWin) {
        // Remove any existing win message
        this.removeElement('.win-message');
        
        // Create new win message
        const winMessage = document.createElement('div');
        winMessage.className = 'win-message' + (isBigWin ? ' big-win' : '');
        winMessage.textContent = 'WIN! +' + amount + ' coins';
        
        // Add to the slot display
        this.slotDisplay.appendChild(winMessage);
        
        // Add animation
        winMessage.style.opacity = '0';
        winMessage.style.transform = 'translate(-50%, -50%) scale(0.5)';
        
        setTimeout(() => {
            winMessage.style.transition = 'all 0.5s ease-out';
            winMessage.style.opacity = '1';
            winMessage.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
        
        // Remove after 3 seconds
        setTimeout(() => {
            winMessage.style.opacity = '0';
            setTimeout(() => winMessage.remove(), 500);
        }, 3000);
    }
    
    /**
     * Show out of coins message
     */
    showOutOfCoinsMessage() {
        // Remove any existing message
        this.removeElement('.message');
        this.removeElement('.buy-more-btn');
        
        // Create message
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = "You're out of coins. Would you like to buy more?";
        
        // Create button
        const button = document.createElement('button');
        button.className = 'buy-more-btn';
        button.textContent = 'Buy More Coins';
        
        // Add to slot display
        this.slotDisplay.appendChild(message);
        this.slotDisplay.appendChild(button);
        
        // Set up button click handler
        button.addEventListener('click', () => this.buyMoreCoins());
    }
    
    /**
     * Buy more coins
     */
    buyMoreCoins() {
        // Add more coins
        this.coinCount += 500; // $5.00 more
        this.playerData.coinsLeft = this.coinCount / 100;
        
        // Vibrate on mobile for feedback
        if (this.isMobile) {
            this.vibrate([10, 20, 40]);
        }
        
        // Record the balance change with purchase event type
        sessionManager.recordBalanceChange(this.currentPlayer, this.playerData.coinsLeft, 'purchase');
        
        sessionManager.updatePlayerData(this.currentPlayer, {
            coinsLeft: this.playerData.coinsLeft
        });
        
        this.updateCreditDisplay();
        
        // Hide modal if exists
        if (this.buyMoreModal) {
            this.buyMoreModal.style.display = 'none';
        }
        
        // Remove out of coins message
        this.removeElement('.message');
        this.removeElement('.buy-more-btn');
    }
    
    /**
     * Remove an element by selector
     */
    removeElement(selector) {
        const element = document.querySelector(selector);
        if (element) element.remove();
    }
    
    /**
     * Play a sound effect
     */
    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => {
                console.warn('Sound playback error:', err);
            });
        }
    }
    
    /**
     * Save final player statistics
     */
    savePlayerStats() {
        // Calculate play duration
        const playDuration = (Date.now() - this.startTime) / 1000; // in seconds
        
        // Update player data
        sessionManager.updatePlayerData(this.currentPlayer, {
            coinsLeft: this.coinCount / 100,
            spins: this.spinCount
        });
        
        // Record final balance and end the player session
        sessionManager.recordBalanceChange(this.currentPlayer, this.coinCount / 100, 'end');
        sessionManager.endPlayerSession(this.currentPlayer);
    }
    
    /**
     * End the game and save stats
     */
    endGame() {
        // Save final stats
        this.savePlayerStats();
        
        // Hide modals if they exist
        if (this.buyMoreModal) {
            this.buyMoreModal.style.display = 'none';
        }
        
        // Show thank you message
        const messageEl = document.createElement('div');
        messageEl.className = 'message end-message';
        messageEl.textContent = 'Thank you for playing!';
        this.slotDisplay.appendChild(messageEl);
        
        // Disable controls
        this.spinButton.disabled = true;
        
        // Remove other messages
        this.removeElement('.buy-more-btn');
    }
}

// Initialize the slot machine when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create placeholder sounds to avoid missing file errors
    // These would be replaced with real sound files in production
    const createEmptyAudio = () => {
        const audio = new Audio();
        audio.volume = 0.5;
        return audio;
    };
    
    // Make sure the Audio object is available (for environments without audio support)
    if (typeof Audio !== 'undefined') {
        // Create placeholder sounds until real ones are available
        const sounds = document.createElement('div');
        sounds.style.display = 'none';
        sounds.innerHTML = `
            <audio id="spin-sound" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="></audio>
            <audio id="win-sound" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="></audio>
            <audio id="lose-sound" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="></audio>
            <audio id="near-miss-sound" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="></audio>
        `;
        document.body.appendChild(sounds);
    }
    
    // Initialize the slot machine
    const slotMachine = new SlotMachine();
}); 