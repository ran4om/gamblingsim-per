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