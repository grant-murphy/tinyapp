let emailPresent = function(email, users) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
};

module.exports = { emailPresent };
