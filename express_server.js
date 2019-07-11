const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080
const { userExists } = require("./helpers");

const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['randomWord'],
  maxAge: 24 * 60 * 60 * 1000
}))

app.set("view engine", "ejs");


//STORED DATA
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

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
}



//MY URLS INDEX PAGE (Displays the URLs that have been converted)
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };

  if (users[req.session.user_id]) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/register')
  }
});

app.post("/urls", (req, res) => {

  let randomString = generateRandomString();
  urlDatabase[randomString] = { longURL: req.body.longURL, userID: req.session.user_id };;
  res.redirect(`/urls/${randomString}`);
});


//URL CONVERTER INPUT
app.get("/urls/new", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect('/login')
  } else {
    res.render("urls_new", { user: users[req.session["user_id"]] });
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session["user_id"]] };

  if (users[req.session.user_id]) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect('/register')
  }
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  if (req.session.user_id) {
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.statusCode = 403;
    res.send('Invalid Username or Password')
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls/`);
  } else {
    res.statusCode = 403;
    res.send('Invalid Username or Password')
  }
});



//USER REGISTRATION PAGE
app.get("/register", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session["user_id"]] };
  res.render("user_reg", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email == undefined || req.body.password === undefined) {
    
    res.statusCode = 400;
    return res.send('Invalid Username or Password')

  } else {

    if (userExists(users, req.body.email)) {
      res.redirect(`/login`);

    } else {

      let information = { email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) }
      information.id = generateRandomString();
      users[information.id] = information;
      //res.cookie("user_id", information.id);
      req.session.user_id = information.id;

      res.redirect(`/urls`);
    }
  }
});


//USER REGISTRATION && LOGIN PAGE
app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  req.session.user_id = null;
  res.redirect(`/urls`);
});

app.get("/login", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  res.render("user_log", templateVars);
});

app.post("/login", (req, res) => {
  const user = verifyUser(req.body.email, req.body.password);
  if (user) {
    //res.cookie("user_id", verify);
    req.session.user_id = user;
    res.redirect(`/urls`);

  } else {
    res.statusCode = 403;
    res.send('Invalid Username or Password')
  }
});



//HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
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
  for (let user in users) {
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
      return user;
    }
  }
  return false;
}

//DOES THE USER EXIST
// let userExists = function (email) {
//   for (let verify in users) {
//     if (users[verify].email === email) {
//       return true;
//     }
//   }
//   return false;
// }

//VERIFY USERS TO SHORTEN URL
let urlsForUser = function (id) {
  let obj = {}
  for (let verify in urlDatabase) {
    if (urlDatabase[verify].userID === id) {
      obj[verify] = urlDatabase[verify]
    }
  }
  return obj;
}