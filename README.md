# Gambling Addiction Psychology Demonstration

This application simulates a slot machine experience to demonstrate how gambling manipulates brain chemistry, reward systems, and leads to addictive behavior. It's designed for educational purposes and collects behavioral data for analysis during presentations.

## Features

### Slot Machine Game
- Players start with 1000 coins
- Each spin costs 40 coins
- Higher win chance (40%) on the first 5 spins, then 12% chance afterward
- Includes both small wins (60-80 coins) and rare big wins (300+ coins)
- Features "near miss" visuals to simulate casino tactics
- Animated slot machine reels

### Data Collection
- Tracks comprehensive player statistics
- Records time series data
- Generates summary statistics across all players

### Visualizations
- Wins vs Losses per Player
- Coins Left Distribution
- Average Time Between Spins
- Net Profit/Loss per Player
- Individual and Average Coin Balance Over Time
- Time Until Can't Gamble and Wanted to Buy More

### Admin Features
- Secure admin dashboard (login: admin/admin)
- Create and manage multiple instances (sessions)
- View real-time statistics and visualizations
- Run simulations to test the application

## How to Use

### For Presenters/Admins

1. Open `index.html` in a modern web browser
2. Log in with the default credentials:
   - Username: `admin`
   - Password: `admin`
3. From the admin dashboard, click "Create New Instance" to create a new session
4. Click "View Dashboard" on an instance to see its details
5. Click "Start Session" to activate the instance
6. Copy the player link and share it with participants
7. View real-time statistics and visualizations as players interact with the game
8. Click "End Session" when you want to stop collecting data

### For Players/Participants

1. Open the link provided by the presenter
2. The slot machine will appear automatically
3. Click "Spin" to play (each spin costs 40 coins)
4. When you run out of coins, you'll be asked if you want to buy more
5. All your actions and timing are recorded for analysis

## Deployment

This application is designed to be lightweight and can be hosted on:
- GitHub Pages
- Netlify
- Any static web host

Simply upload all the files to your hosting service of choice.

## Local Development

To run this application locally:

1. Clone or download the repository
2. Open `index.html` in a web browser
3. No server or build process is required!

## Testing and Simulation

For testing without real players:

1. Log in as admin
2. Create a new instance
3. View the instance dashboard
4. In the browser console, run:
   ```javascript
   runSimulation(appData.currentInstanceId, 10, 30);
   ```
   This will create 10 simulated players with 30 spins each.

## Technologies Used

- Plain HTML, CSS, and JavaScript (Vanilla JS)
- Chart.js for data visualization
- No backend required - all data is stored in-memory

## Notes

- This is an educational tool to demonstrate gambling psychology
- No real money is involved
- Data is not persistent across page refreshes (unless you implement storage)

# Gambling Simulation Psychology Demo

A web-based simulation for demonstrating psychological aspects of gambling addiction.

## Features

- Admin dashboard for monitoring player behavior
- Multiple gambling instances
- Data persistence with localStorage
- Real-time notifications
- Visualization of player data
- Automated tests

## Testing Locally

### Option 1: Using Node.js (Recommended)

1. Make sure you have Node.js installed (download from [nodejs.org](https://nodejs.org/))
2. Open a terminal/command prompt in the project directory
3. Run the local server:
   ```
   node server.js
   ```
4. Open your browser and navigate to `http://localhost:3000`

### Option 2: Using Python

If you have Python installed, you can use its built-in HTTP server:

For Python 3:
```
python -m http.server 3000
```

For Python 2:
```
python -m SimpleHTTPServer 3000
```

Then open your browser and navigate to `http://localhost:3000`

### Option 3: Using Visual Studio Code

If you're using Visual Studio Code, you can use the "Live Server" extension:

1. Install the "Live Server" extension
2. Right-click on index.html
3. Select "Open with Live Server"

## Running Tests

The application comes with built-in tests to verify functionality:

### Option 1: Using the Button in the Main App

1. Start the local server using one of the methods above
2. Open the application in your browser
3. Look for the "Run Tests" button in the bottom-right corner of the screen
4. Click the button to run all tests
5. Check the browser console (F12) to see the test results

### Option 2: Using the Dedicated Test Page (Recommended)

For more comprehensive testing with visual feedback:

1. Start the local server
2. Navigate to `http://localhost:3000/test.html`
3. Use the "Run All Tests" button to run the test suite
4. View test results directly on the page
5. Use "Clean LocalStorage" button to reset storage between test runs

This dedicated test page provides a cleaner environment for running tests and displays results directly on the page instead of just in the console.

## Test Cases

The test suite includes tests for:

1. **Local Storage Persistence**: Verifies that data is properly saved to and loaded from localStorage
2. **Player Joining**: Tests that new players can join and notifications are created
3. **Data Persistence**: Tests that changes to player data are properly saved
4. **Admin Notifications**: Verifies that notifications are displayed to the admin

## Manual Testing

To manually test the persistence features:

1. Login as admin (username: admin, password: admin)
2. Create a new instance
3. Start a session and copy the player link
4. Open the player link in a new tab or browser
5. Play several rounds
6. Return to the admin view and check that player data is visible
7. Refresh the admin page and verify that all data is still there
8. Close and reopen the browser, then log in again to verify persistence

## Browser Compatibility

The application has been tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+ 