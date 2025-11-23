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
      matricule: req.body.matricule,
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

    const cookieOptionsToken = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400 * 1000, path: "/" };
    const cookieOptionsRefresh = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
    res.cookie("accessToken", accessToken, cookieOptionsToken);
    res.cookie("refreshToken", refreshToken, cookieOptionsRefresh);

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      matricule: user.matricule,
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

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    refreshTokens.push(newRefreshToken);
    const cookieOptionsToken = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400 * 1000, path: "/" };
    const cookieOptionsRefresh = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
    res.cookie("accessToken", newAccessToken, cookieOptionsToken);
    res.cookie("refreshToken", newRefreshToken, cookieOptionsRefresh);
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
  const cookieHeader = req.headers["cookie"];
  let token = null;
  if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => {
      const i = c.indexOf("=");
      const k = c.slice(0, i).trim();
      const v = decodeURIComponent(c.slice(i + 1).trim());
      return [k, v];
    }));
    token = cookies.accessToken || null;
  }
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

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
        matricule: user.matricule,
        roles,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  });
};

exports.session = async (req, res) => {
  const cookieHeader = req.headers["cookie"];
  let accessToken = null;
  let refreshToken = null;
  if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => {
      const i = c.indexOf("=");
      const k = c.slice(0, i).trim();
      const v = decodeURIComponent(c.slice(i + 1).trim());
      return [k, v];
    }));
    accessToken = cookies.accessToken || null;
    refreshToken = cookies.refreshToken || null;
  }
  if (!accessToken) {
    const authHeader = req.headers["authorization"];
    accessToken = authHeader && authHeader.split(" ")[1];
  }
  if (!accessToken) {
    return res.status(401).send({ message: "Access token required!" });
  }
  jwt.verify(accessToken, config.secret, async (err, decoded) => {
    if (!err) {
      try {
        const user = await User.findByPk(decoded.id, { include: Role });
        if (!user) return res.status(404).send({ message: "User not found!" });
        const roles = user.roles.map((r) => "ROLE_" + r.name.toUpperCase());
        return res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          matricule: user.matricule,
          roles,
        });
      } catch (error) {
        return res.status(500).send({ message: error.message });
      }
    }
    if (err && err.name === "TokenExpiredError") {
      if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(401).send({ message: "Session has expired" });
      }
      jwt.verify(refreshToken, config.secret, async (err2, decoded2) => {
        if (err2) {
          return res.status(401).send({ message: "Session has expired" });
        }
        const newAccessToken = jwt.sign({ id: decoded2.id }, config.secret, {
          algorithm: "HS256",
          expiresIn: 86400,
        });
        const newRefreshToken = jwt.sign({ id: decoded2.id }, config.secret, {
          algorithm: "HS256",
          expiresIn: 7 * 24 * 60 * 60,
        });
        refreshTokens = refreshTokens.filter((t) => t !== refreshToken);
        refreshTokens.push(newRefreshToken);
        const cookieOptionsToken = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400 * 1000, path: "/" };
        const cookieOptionsRefresh = { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
        res.cookie("accessToken", newAccessToken, cookieOptionsToken);
        res.cookie("refreshToken", newRefreshToken, cookieOptionsRefresh);
        try {
          const user = await User.findByPk(decoded2.id, { include: Role });
          if (!user) return res.status(404).send({ message: "User not found!" });
          const roles = user.roles.map((r) => "ROLE_" + r.name.toUpperCase());
          return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            matricule: user.matricule,
            roles,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        } catch (error) {
          return res.status(500).send({ message: error.message });
        }
      });
    } else {
      return res.status(403).send({ message: "Invalid token" });
    }
  });
};
