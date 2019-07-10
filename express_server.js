const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
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
}

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", { user: users[req.cookies["user_id"]] });
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("user_reg", templateVars);
});




app.get("/login", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };

  res.render("user_log", templateVars);
});






app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/`);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    return res.send('Invalid Username or Password')

  } else {

    if (userExists(req.body.email)) {
      res.redirect(`/login`);

    } else {

      let information = { email: req.body.email, password: req.body.password }
      information.id = generateRandomString();
      users[information.id] = information;
      res.cookie("user_id", information.id);
      res.redirect(`/urls`);

    }
  }
});

app.post("/login", (req, res) => {

  let verify = (verifyUser(req.body.email, req.body.password))
  console.log(verify)
  console.log(req.body)

  if (verify) {
    res.cookie("user_id", verify);
    res.redirect(`/urls`);

  } else {
    res.statusCode = 403;
    res.send('Invalid Username or Password')
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//RANDOM STRING GENERATOR
let generateRandomString = function () {
  let anySize = 6; //the size of string
  let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"; //from where to create
  result = "";
  for (let i = 0; i < anySize; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
};

generateRandomString();

//VERIFY USER

let verifyUser = function (email, password) {
  for (let verify in users) {
    if (users[verify].email === email || users[verify].password === password) {
      return verify;
    }
  }
  return false;
}

//verifyUser();

//VERIFY USER

let userExists = function (email) {
  for (let verify in users) {
    if (users[verify].email === email) {
      return true;
    }
  }
  return false;
}

// verifyUser();