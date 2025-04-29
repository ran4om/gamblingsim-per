# Gambling Psychology Demonstration App

A web-based educational tool for demonstrating gambling psychology and addiction to teenage audiences. This application simulates a slot machine that highlights how gambling can manipulate brain chemistry, reward systems, and lead to addictive behavior.

## Purpose

This application was designed to serve as a live demonstration tool for educational presentations about gambling addiction psychology. It provides:

- A realistic slot machine experience that demonstrates the "early win trap"
- Real-time data collection of player behavior
- An admin dashboard to analyze player interactions
- Support for multiple independent sessions for different groups

## Features

### Slot Machine Game

- Players start with 10 coins
- Each spin costs 1 coin
- Higher win chance (30%) on first 3-4 spins, then lowers to ~10%
- Wins award 1-3 coins
- "Near miss" visuals to demonstrate psychological hooks
- Animated reels with flashy visuals
- Option to "buy more" coins when out (no real purchases)

### Data Collection

The app tracks for each player:
- Total number of spins
- Number of wins and losses
- Coins left at end
- Total play duration
- Number of "near misses"

### Admin Dashboard

A password-protected admin area provides:
- Total number of players
- Average coins left
- Average number of spins
- Win rate vs loss rate
- Average play duration
- Session management for multiple groups
- Detailed player-by-player statistics

## How to Use

### Running the Application

1. Open `index.html` in a web browser to start the application
2. No server needed - works entirely in the browser using local storage
3. The slot machine is immediately playable

### Accessing the Admin Dashboard

1. Click the "Admin Dashboard" link at the bottom of the main page
2. Enter the password: `admin123`
3. View real-time statistics and manage sessions

### Session Management

For presenting to multiple groups:
1. Login to the admin dashboard
2. Click "Start New Session" to create a new instance
3. Select the session from the dropdown menu
4. Click "Copy URL" to copy the session-specific URL to your clipboard
5. Share this URL with participants to ensure they all join the same session
6. When participants open the shared URL, they'll automatically join the specific session
7. Switch between sessions in the dashboard to view data from different groups

## Implementation Details

- Built with vanilla HTML, CSS, and JavaScript - no frameworks or dependencies
- All data is stored in the browser's local storage
- Lightweight enough to be hosted on GitHub Pages, Netlify, or any static hosting
- Fully client-side with no server requirements
- Session-specific URLs make it easy to direct participants to the correct instance

## Educational Note

This application is designed strictly for educational purposes. It simulates gambling mechanics to demonstrate their psychological impacts, but does not involve any real money or gambling. 