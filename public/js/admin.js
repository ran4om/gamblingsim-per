/**
 * Admin Dashboard for Gambling Simulation
 * Handles auth, data visualization, and session management
 */

document.addEventListener('DOMContentLoaded', () => {
    const sessionManager = new SessionManager();
    const ADMIN_PASSWORD = 'admin123'; // Simple password for demo purposes
    
    // DOM Elements
    const loginPanel = document.getElementById('login-panel');
    const dashboard = document.getElementById('dashboard');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const newSessionButton = document.getElementById('new-session-button');
    const sessionSelect = document.getElementById('session-select');
    const copyUrlButton = document.getElementById('copy-url-button');
    const copyNotification = document.getElementById('copy-notification');
    
    // Session control elements
    const stopSessionButton = document.getElementById('stop-session-button');
    const terminateSessionButton = document.getElementById('terminate-session-button');
    const deleteSessionButton = document.getElementById('delete-session-button');
    const stopConfirmModal = document.getElementById('stop-confirm-modal');
    const terminateConfirmModal = document.getElementById('terminate-confirm-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const stopConfirmYesButton = document.getElementById('stop-confirm-yes');
    const stopConfirmNoButton = document.getElementById('stop-confirm-no');
    const terminateConfirmYesButton = document.getElementById('terminate-confirm-yes');
    const terminateConfirmNoButton = document.getElementById('terminate-confirm-no');
    const deleteConfirmYesButton = document.getElementById('delete-confirm-yes');
    const deleteConfirmNoButton = document.getElementById('delete-confirm-no');
    
    // Reset All Data modal elements
    const resetAllDataButton = document.getElementById('reset-all-data-button');
    const resetAllConfirmModal = document.getElementById('reset-all-data-modal');
    const resetAllConfirmYesButton = document.getElementById('reset-all-confirm-yes');
    const resetAllConfirmNoButton = document.getElementById('reset-all-confirm-no');
    
    // Dashboard stats elements
    const totalPlayersEl = document.getElementById('total-players');
    const avgSpinsEl = document.getElementById('avg-spins');
    const avgCoinsEl = document.getElementById('avg-coins');
    const winRateEl = document.getElementById('win-rate');
    const avgTimeEl = document.getElementById('avg-time');
    const nearMissesEl = document.getElementById('near-misses');
    const playerDataBody = document.getElementById('player-data-body');
    
    // Chart canvas elements
    const playerBalanceChartEl = document.getElementById('player-balance-chart');
    const avgBalanceChartEl = document.getElementById('avg-balance-chart');
    const timeUntilBrokeChartEl = document.getElementById('time-until-broke-chart');
    
    // Chart instances
    let playerBalanceChart = null;
    let avgBalanceChart = null;
    let timeUntilBrokeChart = null;
    
    // Current selected session
    let currentDisplayedSession = null;
    
    // Authentication state
    let isAuthenticated = false;
    
    // Chart colors 
    const chartColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(40, 159, 64, 0.7)',
        'rgba(210, 102, 150, 0.7)'
    ];
    
    // Elements
    const adminLogin = document.getElementById('admin-login');
    const adminDashboard = document.getElementById('admin-dashboard');
    const sessionUrlInput = document.getElementById('session-url');
    const themeToggle = document.getElementById('theme-toggle');
    
    let currentSessionId = null;
    let confirmCallback = null;
    
    /**
     * Initialize the dashboard
     */
    function init() {
        // Add event listeners
        loginButton.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        logoutButton.addEventListener('click', handleLogout);
        newSessionButton.addEventListener('click', createNewSession);
        sessionSelect.addEventListener('change', handleSessionChange);
        copyUrlButton.addEventListener('click', copySessionUrl);
        
        // Session control listeners
        stopSessionButton.addEventListener('click', showStopConfirmModal);
        terminateSessionButton.addEventListener('click', showTerminateConfirmModal);
        deleteSessionButton.addEventListener('click', showDeleteConfirmModal);
        stopConfirmYesButton.addEventListener('click', stopSession);
        stopConfirmNoButton.addEventListener('click', () => hideModal(stopConfirmModal));
        terminateConfirmYesButton.addEventListener('click', terminateSession);
        terminateConfirmNoButton.addEventListener('click', () => hideModal(terminateConfirmModal));
        deleteConfirmYesButton.addEventListener('click', deleteSession);
        deleteConfirmNoButton.addEventListener('click', () => hideModal(deleteConfirmModal));
        
        // Reset all data button
        resetAllDataButton.addEventListener('click', () => {
            showResetAllConfirmModal();
        });
        
        // Reset confirm buttons
        resetAllConfirmYesButton.addEventListener('click', () => {
            sessionManager.clearAllData();
            loadSessions();
            clearDashboard();
            hideModal(resetAllConfirmModal);
            showNotification('All data has been reset successfully');
        });
        
        resetAllConfirmNoButton.addEventListener('click', () => {
            hideModal(resetAllConfirmModal);
        });
        
        // URL sharing
        copyUrlButton.addEventListener('click', () => {
            sessionUrlInput.select();
            document.execCommand('copy');
            copyUrlButton.textContent = 'Copied!';
            setTimeout(() => {
                copyUrlButton.textContent = 'Copy URL';
            }, 2000);
        });
        
        // Theme toggle
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
        });
        
        // Check for existing auth
        checkAuth();
    }
    
    /**
     * Check if user is already authenticated
     */
    function checkAuth() {
        const authState = localStorage.getItem('admin_auth');
        if (authState === 'true') {
            isAuthenticated = true;
            showDashboard();
        }
    }
    
    /**
     * Handle login attempt
     */
    function handleLogin() {
        if (passwordInput.value === ADMIN_PASSWORD) {
            isAuthenticated = true;
            localStorage.setItem('admin_auth', 'true');
            showDashboard();
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Invalid password. Please try again.';
            passwordInput.value = '';
        }
    }
    
    /**
     * Handle logout
     */
    function handleLogout() {
        isAuthenticated = false;
        localStorage.removeItem('admin_auth');
        hideDashboard();
    }
    
    /**
     * Show the dashboard and load data
     */
    function showDashboard() {
        loginPanel.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Load sessions and data
        loadSessions();
        refreshDashboard();
        
        // Set up auto refresh every 5 seconds
        startAutoRefresh();
    }
    
    /**
     * Hide the dashboard
     */
    function hideDashboard() {
        dashboard.classList.add('hidden');
        loginPanel.classList.remove('hidden');
        stopAutoRefresh();
    }
    
    /**
     * Load available sessions into the dropdown
     */
    function loadSessions() {
        const sessions = sessionManager.getAllSessions();
        
        // Clear the select options
        sessionSelect.innerHTML = '';
        
        // Add all sessions to the dropdown
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            
            // Format the date
            const date = new Date(session.startTime);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            let statusLabel = '';
            if (session.status === 'stopped') {
                statusLabel = ' (STOPPED)';
            } else if (session.status === 'terminated') {
                statusLabel = ' (TERMINATED)';
            }
            
            option.textContent = `Session ${session.id.split('_')[1]} (${formattedDate})${statusLabel}`;
            sessionSelect.appendChild(option);
        });
        
        // Select the current session
        sessionSelect.value = sessionManager.currentSessionId;
        currentDisplayedSession = sessionManager.currentSessionId;
        
        // Update button states based on session status
        updateSessionControlButtons();
    }
    
    /**
     * Update control buttons based on session status
     */
    function updateSessionControlButtons() {
        const session = sessionManager.data.sessions[currentDisplayedSession];
        
        if (!session) return;
        
        // Disable stop button if session is already stopped or terminated
        stopSessionButton.disabled = (session.status === 'stopped' || session.status === 'terminated');
        
        // Disable terminate button if session is already terminated
        terminateSessionButton.disabled = (session.status === 'terminated');
        
        // Delete button is always enabled
        deleteSessionButton.disabled = false;
    }
    
    /**
     * Handle session selection change
     */
    function handleSessionChange() {
        currentDisplayedSession = sessionSelect.value;
        refreshDashboard();
        updateSessionControlButtons();
    }
    
    /**
     * Create a new session
     */
    function createNewSession() {
        const newSessionId = sessionManager.createNewSession();
        loadSessions();
        currentDisplayedSession = newSessionId;
        sessionSelect.value = newSessionId;
        refreshDashboard();
    }
    
    /**
     * Show stop session confirmation modal
     */
    function showStopConfirmModal() {
        stopConfirmModal.classList.add('active');
    }
    
    /**
     * Show terminate session confirmation modal
     */
    function showTerminateConfirmModal() {
        terminateConfirmModal.classList.add('active');
    }
    
    /**
     * Show delete session confirmation modal
     */
    function showDeleteConfirmModal() {
        deleteConfirmModal.classList.add('active');
    }
    
    /**
     * Hide a modal
     */
    function hideModal(modal) {
        modal.classList.remove('active');
    }
    
    /**
     * Stop the current session
     */
    function stopSession() {
        // Mark session as stopped in session manager
        sessionManager.stopSession(currentDisplayedSession);
        
        // Hide modal
        hideModal(stopConfirmModal);
        
        // Refresh the session list and dashboard
        loadSessions();
        refreshDashboard();
        
        // Show notification
        showNotification('Session stopped successfully');
    }
    
    /**
     * Terminate the current session
     */
    function terminateSession() {
        // Mark session as terminated and disconnect all players
        sessionManager.terminateSession(currentDisplayedSession);
        
        // Hide modal
        hideModal(terminateConfirmModal);
        
        // Refresh the session list and dashboard
        loadSessions();
        refreshDashboard();
        
        // Show notification
        showNotification('Session terminated successfully');
    }
    
    /**
     * Delete the current session
     */
    function deleteSession() {
        // Delete the session
        const wasDeleted = sessionManager.deleteSession(currentDisplayedSession);
        
        // Hide modal
        hideModal(deleteConfirmModal);
        
        if (wasDeleted) {
            // Refresh the session list and dashboard
            loadSessions();
            refreshDashboard();
            
            // Show notification
            showNotification('Session deleted successfully');
        }
    }
    
    /**
     * Stop a specific player
     */
    function stopPlayer(playerId) {
        sessionManager.stopPlayer(currentDisplayedSession, playerId);
        refreshDashboard();
        showNotification(`Player ${playerId} stopped`);
    }
    
    /**
     * Show a notification message
     */
    function showNotification(message) {
        // Use the existing copy notification element for simplicity
        copyNotification.textContent = message;
        copyNotification.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            copyNotification.classList.remove('visible');
        }, 3000);
    }
    
    /**
     * Copy the current session URL to clipboard
     */
    function copySessionUrl() {
        const sessionUrl = sessionManager.getSessionUrl(currentDisplayedSession);
        
        // Use the Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sessionUrl)
                .then(() => showNotification('URL copied to clipboard!'))
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    fallbackCopyToClipboard(sessionUrl);
                });
        } else {
            fallbackCopyToClipboard(sessionUrl);
        }
    }
    
    /**
     * Fallback method for copying to clipboard on browsers without Clipboard API
     */
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            console.error('Fallback: Could not copy text', err);
        }
        
        document.body.removeChild(textArea);
        
        if (success) {
            showNotification('URL copied to clipboard!');
        }
    }
    
    /**
     * Refresh the dashboard data
     */
    function refreshDashboard() {
        const stats = sessionManager.getSessionStats(currentDisplayedSession);
        
        if (!stats) return;
        
        // Update stat cards
        totalPlayersEl.textContent = stats.totalPlayers;
        avgSpinsEl.textContent = stats.avgSpins;
        avgCoinsEl.textContent = stats.avgCoinsLeft;
        winRateEl.textContent = `${stats.winRate}%`;
        avgTimeEl.textContent = `${stats.avgPlayTime}s`;
        nearMissesEl.textContent = stats.totalNearMisses;
        
        // Update player table
        updatePlayerTable();
        
        // Update charts
        updatePlayerBalanceChart();
        updateAverageBalanceChart();
        updateTimeUntilBrokeChart();
    }
    
    /**
     * Update the player data table
     */
    function updatePlayerTable() {
        const session = sessionManager.data.sessions[currentDisplayedSession];
        
        if (!session) return;
        
        // Clear the table
        playerDataBody.innerHTML = '';
        
        // Add player rows
        Object.values(session.players).forEach(player => {
            const row = document.createElement('tr');
            
            // Calculate play time display
            let playTimeDisplay = player.playDuration ? `${player.playDuration.toFixed(1)}s` : '...';
            
            // Player status
            const isActive = !player.endTime;
            const statusClass = isActive ? 'active-player' : 'inactive-player';
            
            // Add cells
            row.innerHTML = `
                <td class="${statusClass}">${player.id}</td>
                <td>${player.spins}</td>
                <td>${player.wins || 0}</td>
                <td>${player.losses || 0}</td>
                <td>${player.coinsLeft.toFixed(2)}</td>
                <td>${playTimeDisplay}</td>
                <td>${player.nearMisses || 0}</td>
                <td>
                    ${isActive ? `<button class="stop-player-btn" data-player="${player.id}">Stop</button>` : 'Inactive'}
                </td>
            `;
            
            playerDataBody.appendChild(row);
        });
        
        // Add event listeners to stop player buttons
        document.querySelectorAll('.stop-player-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.getAttribute('data-player');
                stopPlayer(playerId);
            });
        });
    }
    
    /**
     * Create or update the player balance chart
     * Shows how each player's balance changes over time
     */
    function updatePlayerBalanceChart() {
        const session = sessionManager.data.sessions[currentDisplayedSession];
        
        if (!session) return;
        
        // Create data for coin balance over time using actual player history
        const datasets = [];
        
        Object.values(session.players).forEach((player, index) => {
            // Skip players with no spins
            if (!player.spins) return;
            
            // Get the actual balance history for this player
            const balanceHistory = sessionManager.getPlayerBalanceHistory(player.id);
            
            if (!balanceHistory || balanceHistory.length === 0) return;
            
            // Extract times and balances for chart data
            const times = balanceHistory.map(point => point.time);
            const balances = balanceHistory.map(point => point.balance);
            
            // Determine player color (cycle through available colors)
            const color = chartColors[index % chartColors.length];
            
            datasets.push({
                label: `Player ${player.id.split('_')[1]}`,
                data: balances.map((balance, i) => ({
                    x: times[i],
                    y: balance
                })),
                borderColor: color,
                backgroundColor: color.replace('0.7', '0.1'),
                tension: 0.4
            });
        });
        
        // Set up chart data with actual time points from the data
        const data = {
            datasets: datasets
        };
        
        // Create or update chart
        if (playerBalanceChart) {
            playerBalanceChart.data = data;
            playerBalanceChart.update();
        } else if (playerBalanceChartEl) {
            playerBalanceChart = new Chart(playerBalanceChartEl, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Time (seconds)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Coins'
                            },
                            min: 0
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw.y.toFixed(2)} coins`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Create or update the average balance chart
     * Shows the average balance of all players over time
     */
    function updateAverageBalanceChart() {
        const session = sessionManager.data.sessions[currentDisplayedSession];
        
        if (!session) return;
        
        const players = Object.values(session.players);
        
        // Skip if no players with spins
        if (!players.some(p => p.spins > 0)) return;
        
        // Get all unique time points across all players
        const allTimePoints = new Set();
        
        players.forEach(player => {
            if (player.spins > 0) {
                const history = sessionManager.getPlayerBalanceHistory(player.id);
                if (history && history.length > 0) {
                    history.forEach(point => allTimePoints.add(point.time));
                }
            }
        });
        
        // Convert to sorted array
        const timePoints = Array.from(allTimePoints).sort((a, b) => a - b);
        
        // Calculate average balance at each time point
        const avgBalances = [];
        
        timePoints.forEach(timePoint => {
            let totalBalance = 0;
            let playerCount = 0;
            
            players.forEach(player => {
                if (player.spins > 0) {
                    const history = sessionManager.getPlayerBalanceHistory(player.id);
                    if (history && history.length > 0) {
                        // Find the balance at this time point or interpolate
                        const balance = getInterpolatedBalance(history, timePoint);
                        if (balance !== null) {
                            totalBalance += balance;
                            playerCount++;
                        }
                    }
                }
            });
            
            avgBalances.push({
                x: timePoint,
                y: playerCount > 0 ? totalBalance / playerCount : null
            });
        });
        
        // Filter out null values
        const filteredAvgBalances = avgBalances.filter(point => point.y !== null);
        
        // Set up chart data
        const data = {
            datasets: [{
                label: 'Average Coin Balance',
                data: filteredAvgBalances,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        };
        
        // Create or update chart
        if (avgBalanceChart) {
            avgBalanceChart.data = data;
            avgBalanceChart.update();
        } else if (avgBalanceChartEl) {
            avgBalanceChart = new Chart(avgBalanceChartEl, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Time (seconds)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Average Coins'
                            },
                            min: 0
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Average: ${context.raw.y.toFixed(2)} coins`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Create or update the time until broke chart
     * Shows the distribution of when players first can't afford to spin
     */
    function updateTimeUntilBrokeChart() {
        const session = sessionManager.data.sessions[currentDisplayedSession];
        
        if (!session) return;
        
        const players = Object.values(session.players);
        
        // Calculate time until broke for each player using actual history
        const timesUntilBroke = [];
        const spinCost = 0.40; // Cost per spin
        
        players.forEach(player => {
            if (player.spins > 0) {
                const history = sessionManager.getPlayerBalanceHistory(player.id);
                if (history && history.length > 0) {
                    // Find the first time the balance drops below spin cost
                    for (let i = 0; i < history.length; i++) {
                        if (history[i].balance < spinCost) {
                            timesUntilBroke.push(history[i].time);
                            break;
                        }
                    }
                }
            }
        });
        
        // Create histogram data - group by time buckets
        const bucketSize = 30; // 30 second buckets
        const maxTime = Math.max(...timesUntilBroke, 300); // Default to 5 minutes if no data
        const buckets = Array.from({length: Math.ceil(maxTime / bucketSize)}, () => 0);
        
        timesUntilBroke.forEach(time => {
            const bucketIndex = Math.floor(time / bucketSize);
            if (bucketIndex < buckets.length) {
                buckets[bucketIndex]++;
            }
        });
        
        // Create labels (time ranges)
        const labels = buckets.map((_, i) => {
            const start = i * bucketSize;
            const end = (i + 1) * bucketSize;
            return `${start}-${end}s`;
        });
        
        // Set up chart data
        const data = {
            labels: labels,
            datasets: [{
                label: 'Number of Players',
                data: buckets,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };
        
        // Create or update chart
        if (timeUntilBrokeChart) {
            timeUntilBrokeChart.data = data;
            timeUntilBrokeChart.update();
        } else if (timeUntilBrokeChartEl) {
            timeUntilBrokeChart = new Chart(timeUntilBrokeChartEl, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                                text: 'Number of Players'
                            },
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return `Time: ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `Players: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Get interpolated balance at a specific time point
     * @param {Array} history - Balance history array with time and balance
     * @param {number} timePoint - The time point to get balance for
     * @returns {number|null} Interpolated balance or null if outside range
     */
    function getInterpolatedBalance(history, timePoint) {
        // If history is empty, return null
        if (!history || history.length === 0) return null;
        
        // If timePoint is before the first time, return the initial balance
        if (timePoint <= history[0].time) {
            return history[0].balance;
        }
        
        // If timePoint is after the last time, return the final balance
        if (timePoint >= history[history.length - 1].time) {
            return history[history.length - 1].balance;
        }
        
        // Find the two points the timePoint falls between
        for (let i = 0; i < history.length - 1; i++) {
            if (timePoint >= history[i].time && timePoint <= history[i + 1].time) {
                // Interpolate between the two points
                const timeRatio = (timePoint - history[i].time) / (history[i + 1].time - history[i].time);
                return history[i].balance + timeRatio * (history[i + 1].balance - history[i].balance);
            }
        }
        
        return null;
    }
    
    // Auto-refresh interval
    let refreshInterval = null;
    
    /**
     * Start auto-refreshing the dashboard
     */
    function startAutoRefresh() {
        stopAutoRefresh(); // Clear any existing interval first
        
        refreshInterval = setInterval(() => {
            refreshDashboard();
        }, 5000); // Refresh every 5 seconds
    }
    
    /**
     * Stop auto-refreshing
     */
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }
    
    /**
     * Show reset all data confirmation modal
     */
    function showResetAllConfirmModal() {
        resetAllConfirmModal.classList.add('active');
    }
    
    /**
     * Clear dashboard data
     */
    function clearDashboard() {
        // Clear stat cards
        totalPlayersEl.textContent = '0';
        avgSpinsEl.textContent = '0';
        avgCoinsEl.textContent = '0';
        winRateEl.textContent = '0%';
        avgTimeEl.textContent = '0s';
        nearMissesEl.textContent = '0';
        
        // Clear player table
        playerDataBody.innerHTML = '';
        
        // Reset charts
        if (playerBalanceChart) {
            playerBalanceChart.data.datasets = [];
            playerBalanceChart.update();
        }
        
        if (avgBalanceChart) {
            avgBalanceChart.data.datasets[0].data = [];
            avgBalanceChart.update();
        }
        
        if (timeUntilBrokeChart) {
            timeUntilBrokeChart.data.datasets[0].data = [];
            timeUntilBrokeChart.update();
        }
    }
    
    // Initialize the dashboard
    init();
}); 