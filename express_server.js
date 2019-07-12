const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080
const { emailPresent } = require("./helpers");

const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['randomWord'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.set("view engine", "ejs");

//-------------------------------STORED URLS-------------------------------//
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

//-------------------------------STORED USERS-------------------------------//
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "1"
  }
};

//-------------------------------URLS INDEX PAGE-------------------------------//
//Displays the URLs that have been converted//
app.get("/urls", (req, res) => {

  if (users[req.session.user_id]) {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    if (users[req.session.user_id]) {
      res.render("urls_index", templateVars);
    } else {
      let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
      res.render("login_redirect", templateVars);
    }
  } else {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render("login_redirect", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = { longURL: req.body.longURL, userID: req.session.user_id };
  if (users[req.session.user_id]) {
    res.redirect(`/urls/${randomString}`);
  } else {
    res.redirect(`/login`);
  }
});

//-------------------------------CREATE TINYAPP URL INPUT FORM-------------------------------//
app.get("/urls/new", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect('/login');
  } else {
    res.render("urls_new", { user: users[req.session["user_id"]] });
  }
});

//-------------------------------SHORT URLS-------------------------------//
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send('Invalid Short URL');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session["user_id"]] };
    if (users[req.session.user_id] && urlDatabase[req.params.shortURL]) {
      res.render("urls_show", templateVars);
    } else {
      let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
      res.render("login_redirect", templateVars);
    }
  } else {
    const templateVars = { shortURL: req.params.shortURL, user: users[req.session["user_id"]] };
    res.render("invalid_short", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] && urlDatabase[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (req.session.user_id) {
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.statusCode = 403;
    res.send('Invalid Username or Password');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.send('Invalid Username or Password');
  }
});

//-------------------------------USER REGISTER PAGE-------------------------------//
app.get("/register", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session["user_id"]] };
  if (req.session.user_id && users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.render("user_reg", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render('invalid_registration_pass', templateVars);
  } else if (req.session.user_id && users[req.session.user_id]) {
    res.redirect(`/login`);
  } else {
    if (emailPresent(req.body.email, users)) {
      let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
      res.render("invalid_registration_user", templateVars);
    } else {
      let information = { email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
      information.id = generateRandomString();
      users[information.id] = information;
      req.session.user_id = information.id;

      res.redirect(`/urls`);
    }
  }
});

//-------------------------------USER LOGIN && LOGOUT PAGES-------------------------------//
app.get("/login", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  if (req.session.user_id && users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.render("user_log", templateVars);
  }
});

app.post("/login", (req, res) => {
  const user = emailPresent(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect(`/urls`);
    } else {
      let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
      res.render('invalid_pass', templateVars);
    }
  } else {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render('invalid_username', templateVars);
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect(`/urls`);
});

//-------------------------------HOME PAGE-------------------------------//
app.get("/", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//-------------------------------URLS JSON FILE-------------------------------//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//-------------------------------PORT-------------------------------//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//-------------------------------FUNCTIONS-------------------------------//

//RANDOM STRING GENERATOR
let generateRandomString = function() {
  let anySize = 6; //the size of string
  let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"; //from where to create
  let result = "";
  for (let i = 0; i < anySize; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
};

generateRandomString();

//VERIFY USERS TO SHORTEN URL
let urlsForUser = function(id) {
  let obj = {};
  for (let verify in urlDatabase) {
    if (urlDatabase[verify].userID === id) {
      obj[verify] = urlDatabase[verify];
    }
  }
  return obj;
};