const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").map((v) => v.split("=")).reduce((acc, parts) => {
    const k = parts[0] ? parts[0].trim() : "";
    const v = decodeURIComponent((parts[1] || "").trim());
    if (k) acc[k] = v;
    return acc;
  }, {});
};

verifyToken = (req, res, next) => {
  const cookies = parseCookies(req.headers["cookie"]);
  let token = cookies.accessToken || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token,
            config.secret,
            (err, decoded) => {
              if (err) {
                return res.status(401).send({
                  message: "Unauthorized!",
                });
              }
              req.userId = decoded.id;
              next();
            });
};

isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if (user.role === "admin" || user.role === "manager") {
      next();
      return;
    }

    res.status(403).send({
      message: "Require Admin Role!"
    });
    return;
  });
};

isModerator = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if (user.role === "superviseur") {
      next();
      return;
    }

    res.status(403).send({
      message: "Require Superviseur Role!"
    });
  });
};

isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if (user.role === "superviseur" || user.role === "admin" || user.role === "manager") {
      next();
      return;
    }

    res.status(403).send({
      message: "Require Superviseur or Admin Role!"
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin
};
module.exports = authJwt;
