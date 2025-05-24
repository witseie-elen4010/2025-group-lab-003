// __mocks__/logAction.js
module.exports = jest.fn((actionType, details) => {
  // Simulate a logging action (no return needed for this example)
  return true;
});
