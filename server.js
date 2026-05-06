require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming request origin:", origin);
    const allowedOrigins = (process.env.CORS_ORIGIN || "http://10.160.4.33:5173").split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Origin not allowed:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// database
const db = require("./app/models");
const Role = db.role;

db.sequelize.sync({ alter: true });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
  res.header('acc')
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
require('./app/routes/history.routes')(app);
require('./app/routes/ticketCombined.routes')(app);
require('./app/routes/log.routes')(app);
require('./app/routes/stats.routes')(app);
require('./app/routes/productionExport.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

