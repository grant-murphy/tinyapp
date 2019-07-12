const { assert } = require('chai');

const { emailPresent } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('emailPresent', function() {
  it('should return a user with valid email', function() {
    const user = emailPresent("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert.equal(user, expectedOutput);
  });
  it('should return a user with valid email', function() {
    const user = emailPresent("", testUsers)
    const expectedOutput = false;
    // Write your assert statement here
    assert.equal(user, expectedOutput);
  })
});