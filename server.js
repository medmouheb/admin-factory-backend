const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:5173", // your frontend origin
  credentials: true,                // 🔥 allow cookies
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// database
const db = require("./app/models");
const Role = db.role;

db.sequelize.sync({ alter: true });
// force: true will drop the table if it already exists
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Database with { force: true }');
//   initial();
// });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/material.routes')(app);
require('./app/routes/part.routes')(app);
require('./app/routes/ticket.routes')(app);
require('./app/routes/ticketCode.routes')(app);
require('./app/routes/client.routes')(app);
require('./app/routes/retouching.routes')(app);
require('./app/routes/qualityInspection.routes')(app);
require('./app/routes/packet.routes')(app);
require('./app/routes/piece.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.create({
    id: 1,
    name: "operateur"
  });

  Role.create({
    id: 2,
    name: "superviseur"
  });

  Role.create({
    id: 3,
    name: "admin"
  });
}