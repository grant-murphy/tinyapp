const userExists = function (users, email) {
  for (let verify in users) {
    if (users[verify].email === email) {
      return true;
    }
  }
  return false;
}

module.exports = { userExists };
