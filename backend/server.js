import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import mysql from "mysql";

const app = express();
const PORT = 7000;

const secret = "!Backend123";
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "robin",
  password: "robin",
  database: "swedbank",
});

function generateAccsessToken(userId) {
  return jwt.sign(userId, secret);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err, userId) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.userId = userId;

    next();
  });
}

app.get("/", (req, res) => {
  const id = 1;
  connection.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    console.log(results);

    res.send(results[0].username);
  });
});

app.post("/users", (req, res) => {
  const user = req.body;
  console.log(user);

  const { userName, password,  } = user;

  console.log(userName);

  connection.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [userName, password, ],
    (err, results) => {
      console.log(err);

      console.log("results", results);

      if (err) {
        res.sendStatus(500);
      } else {
        const userId = results.insertId;

        connection.query(
          "INSERT INTO accounts (user_id) VALUES (?)",
          [userId],
          (err, results) => {
            if (err) {
              res.sendStatus(500);
            } else {
              res.send("ok");
            }
          }
        );
      }
    }
  );
});

// skapa token från user, skicka token till användaren för att de sedan skickas
// tillbacka i nästa request.

app.post("/sessions", (req, res) => {
  const user = req.body;
  //console.log(user);
  const { userName } = user;

  connection.query(
    "SELECT * FROM users WHERE userName= ?",
    [userName],
    (err, results) => {
      if (userName != null && results[0].password) {
        const token = generateAccsessToken(results[0].id);
        console.log(token);
        res.json({ token });
      } else {
        res.status = 401;
        res.json();
      }
    }
  );
});

app.get("/me/accounts", authenticateToken, (req, res) => {
  const userId = req.userId;
  console.log("userId: ", req.userId);

  connection.query(
    "SELECT * FROM accounts WHERE user_id= ?",
    [userId],
    (err, results) => {
      if (err) console.log("wrong", err);
      console.log("result", results[0]);
      const account = results[0];

      res.json(account);
    }
  );
});

app.listen(PORT, () => {
  console.log("server starts listening on port " + PORT);
});