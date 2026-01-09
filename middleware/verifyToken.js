const jwt = require("jsonwebtoken");
const secretKey = "dreamcare";
const User = require("../models/user");

// const verifyTokenMiddleware = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Token not provided" });
//   }

//   const [bearer, token] = authHeader.split(" ");

//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Token not provided" });
//   }

//   jwt.verify(token, secretKey, (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ success: false, message: "Invalid token" });
//     }

//     // req.user = decoded; // Attach the user data to the request object
//     next();
//   });
// };

const verifyTokenMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  const [bearer, token] = authHeader.split(" ");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  // Handle local development tokens
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const signature = Buffer.from(parts[2], 'base64').toString();
      if (signature === 'local-dev-signature') {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        // Check for expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return res.status(401).json({ success: false, message: "Token expired" });
        }

        const currentUser = await User.findOne({ email: payload.email });
        if (!currentUser) {
          return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user = payload;
        return next();
      }
    }
  } catch (e) {
    // Ignore error and proceed to standard JWT check
  }

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(401).json({ success: false, message });
    }

    try {
      const currentUser = await User.findOne({ email: decoded.email });
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "The user belonging to this token does no longer exist.",
        });
      }

      // Check if the token is blacklisted
      if (currentUser.blacklistedTokens.includes(token)) {
        return res.status(401).json({
          success: false,
          message: "Token has been invalidated. Please log in again.",
        });
      }

      // Check if this token is in the active tokens array (support multiple sessions)
      const activeSession = currentUser.activeTokens?.find(session => session.token === token);
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          message: "Session not found or expired. Please log in again.",
        });
      }

      // Check if the password has changed after the token was issued
      if (currentUser.passwordChangedAt) {
        const changedTimestamp = parseInt(
          currentUser.passwordChangedAt.getTime() / 1000,
          10
        );
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: "Password recently changed. Please log in again.",
          });
        }
      }

      req.user = decoded; // Attach the user data to the request object
      next();
    } catch (error) {
      //   console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
};

module.exports = verifyTokenMiddleware;
