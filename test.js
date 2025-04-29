// Simple Test Framework for GamblingSim
console.log('Starting Gambling Simulation Tests...');

// Test Runner
const TestRunner = {
  tests: [],
  successCount: 0,
  failureCount: 0,
  
  addTest: function(name, testFn) {
    this.tests.push({ name, testFn });
  },
  
  runTests: async function() {
    // Reset counters each time tests are run
    this.successCount = 0;
    this.failureCount = 0;
    
    console.log(`Running ${this.tests.length} tests...\n`);
    
    for (const test of this.tests) {
      try {
        console.log(`Test: ${test.name}`);
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}`);
        this.successCount++;
      } catch (error) {
        console.error(`❌ FAILED: ${test.name}`);
        console.error(`   Error: ${error.message}`);
        this.failureCount++;
      }
      console.log(''); // Empty line between tests
    }
    
    this.reportResults();
  },
  
  reportResults: function() {
    console.log('--- Test Results ---');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`Passed: ${this.successCount}`);
    console.log(`Failed: ${this.failureCount}`);
    
    if (this.failureCount === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${this.failureCount} test(s) failed.`);
    }
  }
};

// Test Utilities
const TestUtils = {
  // Clean up localStorage before/after tests
  cleanupStorage: function() {
    localStorage.removeItem('gamblingSim');
  },
  
  // Reset app data for clean test environment
  resetAppData: function() {
    appData.instances = {};
    appData.notifications = [];
    appData.currentInstanceId = null;
    appData.isAdmin = false;
  },
  
  // Create a mock app state for testing
  createMockState: function() {
    const instanceId = `test_instance_${Date.now()}`;
    const playerId = `test_player_${Date.now()}`;
    
    const mockState = {
      instances: {},
      currentInstanceId: instanceId,
      notifications: []
    };
    
    mockState.instances[instanceId] = {
      id: instanceId,
      players: {},
      active: true,
      createdAt: Date.now()
    };
    
    mockState.instances[instanceId].players[playerId] = {
      id: playerId,
      coins: 1000,
      spins: 5,
      wins: 2,
      losses: 3,
      coinBalanceHistory: [{time: 0, balance: 1000}],
      spinTimes: [],
      winLossEvents: [],
      lastSpinTime: Date.now()
    };
    
    return { mockState, instanceId, playerId };
  },
  
  // Verify that two objects are deep equal
  assertDeepEqual: function(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
      throw new Error(`${message || 'Objects are not equal'}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
  },
  
  // Simulates player joining
  simulatePlayerJoin: function(instanceId) {
    // Call the actual addPlayer method from our app
    if (!appData.instances[instanceId]) {
      appData.instances[instanceId] = new Instance(instanceId);
    }
    
    return appData.instances[instanceId].addPlayer();
  }
};

// Tests
// 1. Test local storage persistence
TestRunner.addTest('Local Storage Persistence', async function() {
  // Clean up first
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
  
  // Create mock state
  const { mockState, instanceId, playerId } = TestUtils.createMockState();
  
  // Save mock state to localStorage
  localStorage.setItem('gamblingSim', JSON.stringify(mockState));
  
  // Load app state should return true if data was found
  const loaded = loadAppState();
  if (!loaded) {
    throw new Error('Failed to load app state from localStorage');
  }
  
  // Verify instance exists
  if (!appData.instances[instanceId]) {
    throw new Error('Instance not loaded from localStorage');
  }
  
  // Verify player exists
  if (!appData.instances[instanceId].players[playerId]) {
    throw new Error('Player not loaded from localStorage');
  }
  
  // Clean up
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
});

// 2. Test adding a new player
TestRunner.addTest('Add New Player and Create Notification', async function() {
  // Clean up first
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
  
  // Create a test instance
  const instanceId = `test_instance_${Date.now()}`;
  appData.instances[instanceId] = new Instance(instanceId);
  
  // Add a player
  const playerId = TestUtils.simulatePlayerJoin(instanceId);
  
  // Verify player was added
  if (!appData.instances[instanceId].players[playerId]) {
    throw new Error('Player was not added to instance');
  }
  
  // Verify notification was created
  if (appData.notifications.length === 0) {
    throw new Error('Notification was not created when player joined');
  }
  
  // Check notification content
  const notification = appData.notifications[0];
  if (notification.type !== 'new_player' || notification.instanceId !== instanceId) {
    throw new Error('Notification has incorrect data');
  }
  
  // Clean up
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
});

// 3. Test that data is saved when changes are made
TestRunner.addTest('Data Persistence When Changes Are Made', async function() {
  // Clean up first
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
  
  // Create a test instance
  const instanceId = `test_instance_${Date.now()}`;
  appData.instances[instanceId] = new Instance(instanceId);
  
  // Add a player
  const playerId = TestUtils.simulatePlayerJoin(instanceId);
  
  // Modify player data
  const player = appData.instances[instanceId].players[playerId];
  player.coins = 500; // Change coins
  player.spins = 10; // Add spins
  
  // Force save
  saveAppState();
  
  // Clear app data
  appData.instances = {};
  
  // Load from storage
  loadAppState();
  
  // Verify data was restored
  if (!appData.instances[instanceId]) {
    throw new Error('Instance not found after reload');
  }
  
  if (!appData.instances[instanceId].players[playerId]) {
    throw new Error('Player not found after reload');
  }
  
  if (appData.instances[instanceId].players[playerId].coins !== 500) {
    throw new Error('Player coins not persisted');
  }
  
  if (appData.instances[instanceId].players[playerId].spins !== 10) {
    throw new Error('Player spins not persisted');
  }
  
  // Clean up
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
});

// 4. Test displaying notifications for admin
TestRunner.addTest('Display Notifications for Admin', async function() {
  // Clean up first
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
  
  // Create mock state with notifications
  const instanceId = `test_instance_${Date.now()}`;
  
  appData.instances[instanceId] = new Instance(instanceId);
  
  // Add a few players to create notifications
  TestUtils.simulatePlayerJoin(instanceId);
  TestUtils.simulatePlayerJoin(instanceId);
  
  // Verify notifications were created
  if (appData.notifications.length !== 2) {
    throw new Error(`Expected 2 notifications, but got ${appData.notifications.length}`);
  }
  
  // Mark all as unread
  appData.notifications.forEach(n => n.read = false);
  
  // Save state
  saveAppState();
  
  // Clear app data
  TestUtils.resetAppData();
  
  // Load state (as if app is restarting)
  loadAppState();
  
  // Set as admin
  appData.isAdmin = true;
  
  // Verify notifications were loaded
  if (appData.notifications.length !== 2) {
    throw new Error(`Expected 2 notifications after reload, but got ${appData.notifications.length}`);
  }
  
  // Simulate displaying notifications
  let displayedCount = 0;
  
  // Mock the showNotification function for testing
  const originalShowNotification = window.showNotification;
  window.showNotification = function() {
    displayedCount++;
  };
  
  // Call the display function
  displayUnreadNotifications();
  
  // Restore original function
  window.showNotification = originalShowNotification;
  
  // Verify correct number of notifications were displayed
  if (displayedCount !== 2) {
    throw new Error(`Expected 2 notifications to be displayed, but got ${displayedCount}`);
  }
  
  // Verify notifications were marked as read
  if (appData.notifications.some(n => !n.read)) {
    throw new Error('Not all notifications were marked as read');
  }
  
  // Clean up
  TestUtils.cleanupStorage();
  TestUtils.resetAppData();
});

// Function to initialize and run tests
function runTests() {
  // Create a notification element for these tests if it doesn't exist
  if (!document.getElementById('notification-container')) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Run all tests
  TestRunner.runTests();
}

// Add a button to start tests
function addTestButton() {
  const testContainer = document.createElement('div');
  testContainer.style.position = 'fixed';
  testContainer.style.bottom = '20px';
  testContainer.style.right = '20px';
  testContainer.style.zIndex = '9999';
  
  const testButton = document.createElement('button');
  testButton.textContent = 'Run Tests';
  testButton.style.backgroundColor = '#3498db';
  testButton.style.color = 'white';
  testButton.style.padding = '10px 20px';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '5px';
  testButton.style.cursor = 'pointer';
  
  testButton.addEventListener('click', function() {
    runTests();
  });
  
  testContainer.appendChild(testButton);
  document.body.appendChild(testContainer);
}

// Initialize tests when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add the test button
  addTestButton();
}); 