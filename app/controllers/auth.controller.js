const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = db.Sequelize;

// Store refresh tokens (in-memory or in DB; here we use in-memory for simplicity)
let refreshTokens = [];

/**
 * 🔐 Sign Up
 */
exports.signup = async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    if (req.body.roles) {
      const roles = await Role.findAll({
        where: { name: { [Op.or]: req.body.roles } },
      });
      await user.setRoles(roles);
    } else {
      await user.setRoles([1]); // default role = user
    }

    res.send({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * 🔑 Sign In (returns access + refresh tokens)
 */
exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: req.body.username },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
    }

    // Access Token (valid for 1 day)
    const accessToken = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      expiresIn: 86400, // 24h
    });

    // Refresh Token (valid for 7 days)
    const refreshToken = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });

    refreshTokens.push(refreshToken);

    const roles = await user.getRoles();
    const authorities = roles.map((role) => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * 🔁 Refresh Token
 * - Takes refresh token
 * - Verifies it
 * - Returns new access + refresh tokens
 */
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).send({ message: "Refresh token is required!" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).send({ message: "Invalid refresh token!" });
  }

  jwt.verify(refreshToken, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized or expired refresh token!" });
    }

    const newAccessToken = jwt.sign({ id: decoded.id }, config.secret, {
      algorithm: "HS256",
      expiresIn: 86400, // 1 day
    });

    const newRefreshToken = jwt.sign({ id: decoded.id }, config.secret, {
      algorithm: "HS256",
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });

    // Replace old refresh token
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    refreshTokens.push(newRefreshToken);

    res.status(200).send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
};

/**
 * 👤 Get user info by access token
 */
exports.userInfo = (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "Access token required!" });
  }

  jwt.verify(token, config.secret, async (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Invalid or expired token!" });
    }

    try {
      const user = await User.findByPk(decoded.id, { include: Role });
      if (!user) return res.status(404).send({ message: "User not found!" });

      const roles = user.roles.map((r) => "ROLE_" + r.name.toUpperCase());
      res.send({
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  });
};
