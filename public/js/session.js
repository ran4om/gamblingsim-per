/**
 * Session Management for Gambling Simulation
 * Handles sessions, player data, and data storage
 */

// Session Storage Key
const STORAGE_KEY = 'gambling_sim_data';
const ADMIN_PASSWORD = 'admin123'; // Simple password for demo purposes

// Data structure for storing session data
class SessionManager {
    constructor() {
        this.data = this.loadData();
        
        // Check URL for session parameter
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session');
        
        // If session parameter exists and it's a valid session, use it
        if (sessionParam && this.data.sessions[sessionParam]) {
            this.currentSessionId = sessionParam;
            this.data.currentSessionId = sessionParam;
            this.saveData();
        } else {
            this.currentSessionId = this.getOrCreateCurrentSessionId();
        }
        
        this.playerIdCounter = this.getPlayerIdCounter();
        
        // Display session ID if the element exists
        const sessionIdElement = document.getElementById('session-id');
        if (sessionIdElement) {
            sessionIdElement.textContent = this.currentSessionId;
        }
        
        // Clean up old sessions
        this.cleanupOldSessions();
    }

    /**
     * Load all data from local storage
     */
    loadData() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                return JSON.parse(storedData);
            } catch (e) {
                console.error('Failed to parse stored data:', e);
                return this.getInitialData();
            }
        }
        return this.getInitialData();
    }

    /**
     * Get initial data structure when none exists
     */
    getInitialData() {
        return {
            sessions: {},
            currentSessionId: null,
            playerIdCounter: 1
        };
    }

    /**
     * Get or create a session ID for the current demonstration
     */
    getOrCreateCurrentSessionId() {
        if (this.data.currentSessionId && this.data.sessions[this.data.currentSessionId]) {
            return this.data.currentSessionId;
        }
        
        // Create a new session with timestamp
        const newSessionId = 'session_' + Date.now();
        this.data.sessions[newSessionId] = {
            id: newSessionId,
            startTime: Date.now(),
            players: {},
            totalPlayers: 0
        };
        
        this.data.currentSessionId = newSessionId;
        this.saveData();
        return newSessionId;
    }

    /**
     * Get the current player ID counter
     */
    getPlayerIdCounter() {
        return this.data.playerIdCounter || 1;
    }

    /**
     * Save all data to local storage
     */
    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    /**
     * Get current session data
     */
    getCurrentSessionData() {
        return this.data.sessions[this.currentSessionId];
    }

    /**
     * Create a new player in the current session
     */
    createNewPlayer() {
        const playerId = 'player_' + this.playerIdCounter++;
        const timestamp = Date.now();
        
        const currentSession = this.getCurrentSessionData();
        currentSession.players[playerId] = {
            id: playerId,
            startTime: timestamp,
            endTime: null,
            spins: 0,
            wins: 0,
            losses: 0,
            coinsLeft: 10, // Starting coins
            nearMisses: 0,
            playDuration: 0,
            balanceHistory: [
                {
                    time: 0, // Time in seconds from start
                    balance: 10.00 // Starting balance
                }
            ]
        };
        
        currentSession.totalPlayers++;
        this.data.playerIdCounter = this.playerIdCounter;
        this.saveData();
        
        return playerId;
    }

    /**
     * Get a player by ID from the current session
     */
    getPlayer(playerId) {
        const currentSession = this.getCurrentSessionData();
        return currentSession.players[playerId];
    }

    /**
     * Update a player's data
     */
    updatePlayerData(playerId, updates) {
        const currentSession = this.getCurrentSessionData();
        const player = currentSession.players[playerId];
        
        if (!player) {
            console.error('Player not found:', playerId);
            return false;
        }
        
        // Apply updates
        Object.assign(player, updates);
        this.saveData();
        return true;
    }

    /**
     * Record balance change and update player history
     * @param {string} playerId - The player ID
     * @param {number} newBalance - The new balance in dollars
     * @param {string} [eventType] - Optional event type (spin, win, etc.)
     */
    recordBalanceChange(playerId, newBalance, eventType = 'update') {
        const currentSession = this.getCurrentSessionData();
        const player = currentSession.players[playerId];
        
        if (!player) {
            console.error('Player not found:', playerId);
            return false;
        }
        
        // Calculate time elapsed since player started
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - player.startTime) / 1000;
        
        // Ensure the balanceHistory array exists
        if (!player.balanceHistory) {
            player.balanceHistory = [{
                time: 0,
                balance: 10.00, // Default starting balance
                event: 'start'
            }];
        }
        
        // Add the new balance data point
        player.balanceHistory.push({
            time: elapsedSeconds,
            balance: newBalance,
            event: eventType
        });
        
        // Update the current balance
        player.coinsLeft = newBalance;
        
        this.saveData();
        return true;
    }

    /**
     * Get player balance history for charting
     * @param {string} playerId - The player ID
     * @returns {Array} Balance history array with time and balance values
     */
    getPlayerBalanceHistory(playerId) {
        const currentSession = this.getCurrentSessionData();
        const player = currentSession.players[playerId];
        
        if (!player || !player.balanceHistory) {
            return [];
        }
        
        return player.balanceHistory;
    }

    /**
     * End a player's session and calculate final stats
     */
    endPlayerSession(playerId) {
        const currentSession = this.getCurrentSessionData();
        const player = currentSession.players[playerId];
        
        if (!player) {
            console.error('Player not found:', playerId);
            return false;
        }
        
        // Calculate final stats
        const endTime = Date.now();
        player.endTime = endTime;
        player.playDuration = (endTime - player.startTime) / 1000; // in seconds
        
        // Add final balance history point if not already recorded
        const lastHistory = player.balanceHistory[player.balanceHistory.length - 1];
        if (lastHistory && lastHistory.time < player.playDuration) {
            player.balanceHistory.push({
                time: player.playDuration,
                balance: player.coinsLeft,
                event: 'end'
            });
        }
        
        this.saveData();
        return true;
    }

    /**
     * Create a new session and make it the current one
     */
    createNewSession() {
        const newSessionId = 'session_' + Date.now();
        this.data.sessions[newSessionId] = {
            id: newSessionId,
            startTime: Date.now(),
            players: {},
            totalPlayers: 0,
            status: 'active'
        };
        
        this.data.currentSessionId = newSessionId;
        this.currentSessionId = newSessionId;
        this.saveData();
        return newSessionId;
    }

    /**
     * Get all sessions
     */
    getAllSessions() {
        return Object.values(this.data.sessions);
    }

    /**
     * Switch to a different session
     */
    switchSession(sessionId) {
        if (this.data.sessions[sessionId]) {
            this.data.currentSessionId = sessionId;
            this.currentSessionId = sessionId;
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * Verify admin password
     */
    verifyAdminPassword(password) {
        return password === ADMIN_PASSWORD;
    }

    /**
     * Get session statistics
     */
    getSessionStats(sessionId) {
        const sessionToAnalyze = sessionId ? this.data.sessions[sessionId] : this.getCurrentSessionData();
        
        if (!sessionToAnalyze) {
            return null;
        }
        
        const players = Object.values(sessionToAnalyze.players);
        const totalPlayers = players.length;
        
        if (totalPlayers === 0) {
            return {
                totalPlayers: 0,
                avgSpins: 0,
                avgCoinsLeft: 0,
                winRate: 0,
                avgPlayTime: 0,
                totalNearMisses: 0,
                avgNearMisses: 0
            };
        }
        
        // Calculate statistics
        let totalSpins = 0;
        let totalCoinsLeft = 0;
        let totalWins = 0;
        let totalPlayTime = 0;
        let totalNearMisses = 0;
        
        players.forEach(player => {
            totalSpins += player.spins;
            totalCoinsLeft += player.coinsLeft;
            totalWins += player.wins;
            totalPlayTime += player.playDuration;
            totalNearMisses += player.nearMisses;
        });
        
        return {
            totalPlayers,
            avgSpins: totalPlayers > 0 ? (totalSpins / totalPlayers).toFixed(2) : 0,
            avgCoinsLeft: totalPlayers > 0 ? (totalCoinsLeft / totalPlayers).toFixed(2) : 0,
            winRate: totalSpins > 0 ? ((totalWins / totalSpins) * 100).toFixed(2) : 0,
            avgPlayTime: totalPlayers > 0 ? (totalPlayTime / totalPlayers).toFixed(2) : 0,
            totalNearMisses,
            avgNearMisses: totalPlayers > 0 ? (totalNearMisses / totalPlayers).toFixed(2) : 0
        };
    }

    /**
     * Get a sharable URL for the current session
     */
    getSessionUrl(sessionId) {
        const targetSessionId = sessionId || this.currentSessionId;
        const baseUrl = window.location.href.split('?')[0]; // Remove any existing query parameters
        const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        return `${basePath}index.html?session=${targetSessionId}`;
    }

    /**
     * Clear all data (for testing/reset)
     */
    clearAllData() {
        localStorage.removeItem(STORAGE_KEY);
        this.data = this.getInitialData();
        this.currentSessionId = this.getOrCreateCurrentSessionId();
        this.playerIdCounter = 1;
        this.saveData();
    }

    /**
     * Stop a session - prevents new players from joining but allows current players to continue
     */
    stopSession(sessionId) {
        const session = this.data.sessions[sessionId];
        
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }
        
        // Mark session as stopped
        session.status = 'stopped';
        this.saveData();
        return true;
    }

    /**
     * Terminate a session - ends all player sessions immediately
     */
    terminateSession(sessionId) {
        const session = this.data.sessions[sessionId];
        
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }
        
        // Mark session as terminated
        session.status = 'terminated';
        
        // End all active player sessions
        Object.values(session.players).forEach(player => {
            if (!player.endTime) {
                player.endTime = Date.now();
                player.playDuration = (player.endTime - player.startTime) / 1000;
                
                // Add final balance history point
                if (player.balanceHistory) {
                    player.balanceHistory.push({
                        time: player.playDuration,
                        balance: player.coinsLeft,
                        event: 'terminated'
                    });
                }
            }
        });
        
        this.saveData();
        return true;
    }

    /**
     * Stop a specific player
     */
    stopPlayer(sessionId, playerId) {
        const session = this.data.sessions[sessionId];
        
        if (!session || !session.players[playerId]) {
            console.error('Session or player not found');
            return false;
        }
        
        const player = session.players[playerId];
        
        // Only stop if player is active
        if (!player.endTime) {
            player.endTime = Date.now();
            player.playDuration = (player.endTime - player.startTime) / 1000;
            
            // Add final balance history point
            if (player.balanceHistory) {
                player.balanceHistory.push({
                    time: player.playDuration,
                    balance: player.coinsLeft,
                    event: 'stopped'
                });
            }
            
            this.saveData();
        }
        
        return true;
    }

    /**
     * Check if a session is active (not stopped or terminated)
     */
    isSessionActive(sessionId) {
        const session = this.data.sessions[sessionId];
        
        if (!session) {
            return false;
        }
        
        return session.status !== 'stopped' && session.status !== 'terminated';
    }

    /**
     * Check if a player can join a session
     */
    canJoinSession(sessionId) {
        const session = this.data.sessions[sessionId];
        
        if (!session) {
            return false;
        }
        
        // Players can't join stopped or terminated sessions
        return session.status !== 'stopped' && session.status !== 'terminated';
    }

    /**
     * Delete a session from storage
     */
    deleteSession(sessionId) {
        // Don't allow deleting the current active session if it's being viewed
        if (sessionId === this.currentSessionId) {
            // Create a new session to switch to first
            const newSessionId = this.createNewSession();
            this.currentSessionId = newSessionId;
            this.data.currentSessionId = newSessionId;
        }
        
        // Delete the session from storage
        if (this.data.sessions[sessionId]) {
            delete this.data.sessions[sessionId];
            this.saveData();
            return true;
        }
        
        return false;
    }

    /**
     * Clean up old sessions data to prevent storage issues
     * Keeps only the most recent 5 sessions
     */
    cleanupOldSessions() {
        const sessions = this.getAllSessions();
        
        // Sort sessions by start time (newest first)
        sessions.sort((a, b) => b.startTime - a.startTime);
        
        // Keep only the 5 most recent sessions
        if (sessions.length > 5) {
            const sessionsToKeep = sessions.slice(0, 5).map(s => s.id);
            
            // Remove old sessions
            Object.keys(this.data.sessions).forEach(sessionId => {
                if (!sessionsToKeep.includes(sessionId)) {
                    delete this.data.sessions[sessionId];
                }
            });
            
            this.saveData();
        }
    }
}

// Create the global session manager instance
const sessionManager = new SessionManager(); 