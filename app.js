const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ussd.db');

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Drinks menu
const drinks = {
  1: { name: "Fanta", price: 500 },
  2: { name: "Juice", price: 800 },
  3: { name: "Tea", price: 300 }
};

app.post("/ussd", (req, res) => {
  const { sessionId = "", phoneNumber = "", text = "" } = req.body;


  db.run(
    `INSERT INTO ussd_sessions (session_id, phone_number, user_input)
     VALUES (?, ?, ?)`,
    [sessionId, phoneNumber, text],
    (err) => {
      if (err) console.error("DB insert error:", err.message);
    }
  );

  const textArray = text.split("*");
  const level = textArray.length;
  let response = "";

  // Start session - language choice
  if (text === "") {
    response = "CON Welcome / Murakaza neza:\n1. English\n2. Kinyarwanda";
  }

  // English Flow
  else if (textArray[0] === "1") {
    if (level === 1) {
      response = "CON Choose your drink:\n";
      for (const [key, val] of Object.entries(drinks)) {
        response += `${key}. ${val.name} - Rwf ${val.price}\n`;
      }
      response += "0. Back";
    } else if (level === 2) {
      if (textArray[1] === "0") {
        response = "CON Welcome / Murakaza neza:\n1. English\n2. Kinyarwanda";
      } else if (!drinks[textArray[1]]) {
        response = "END Invalid drink selection.";
      } else {
        const drink = drinks[textArray[1]];
        response = `CON Enter quantity for ${drink.name}:\n0. Back`;
      }
    } else if (level === 3) {
      if (textArray[2] === "0") {
        response = "CON Choose your drink:\n";
        for (const [key, val] of Object.entries(drinks)) {
          response += `${key}. ${val.name} - Rwf ${val.price}\n`;
        }
        response += "0. Back";
      } else {
        const drinkId = textArray[1];
        const quantity = parseInt(textArray[2]);
        const drink = drinks[drinkId];
        if (!drink || isNaN(quantity) || quantity <= 0) {
          response = "END Invalid quantity.";
        } else {
          const total = drink.price * quantity;
          db.run(
            `INSERT INTO orders (session_id, phone_number, drink_name, quantity, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [sessionId, phoneNumber, drink.name, quantity, total],
            (err) => {
              if (err) console.error("Order insert error:", err.message);
            }
          );
          response = `END Order confirmed:\n${quantity} x ${drink.name}\nTotal: Rwf ${total}`;
        }
      }
    }
  }

  // Kinyarwanda Flow
  else if (textArray[0] === "2") {
    if (level === 1) {
      response = "CON Hitamo icyo kunywa:\n";
      for (const [key, val] of Object.entries(drinks)) {
        response += `${key}. ${val.name} - Rwf ${val.price}\n`;
      }
      response += "0. Subira inyuma";
    } else if (level === 2) {
      if (textArray[1] === "0") {
        response = "CON Welcome / Murakaza neza:\n1. English\n2. Kinyarwanda";
      } else if (!drinks[textArray[1]]) {
        response = "END Icyo kunywa ntikibaho.";
      } else {
        const drink = drinks[textArray[1]];
        response = `CON Andika umubare wa ${drink.name} ushaka:\n0. Subira inyuma`;
      }
    } else if (level === 3) {
      if (textArray[2] === "0") {
        response = "CON Hitamo icyo kunywa:\n";
        for (const [key, val] of Object.entries(drinks)) {
          response += `${key}. ${val.name} - Rwf ${val.price}\n`;
        }
        response += "0. Subira inyuma";
      } else {
        const drinkId = textArray[1];
        const quantity = parseInt(textArray[2]);
        const drink = drinks[drinkId];
        if (!drink || isNaN(quantity) || quantity <= 0) {
          response = "END Umubare wanditse siwo.";
        } else {
          const total = drink.price * quantity;
          db.run(
            `INSERT INTO orders (session_id, phone_number, drink_name, quantity, total_price)
             VALUES (?, ?, ?, ?, ?)`,
            [sessionId, phoneNumber, drink.name, quantity, total],
            (err) => {
              if (err) console.error("Order insert error:", err.message);
            }
          );
          response = `END Warangije kugura:\n${quantity} x ${drink.name}\nIgiteranyo: Rwf ${total}`;
        }
      }
    }
  }

  else {
    response = "END Invalid input. Try again.";
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`USSD app running on port ${PORT}`);
});
