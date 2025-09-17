const axios = require("axios");

exports.verifyCaptcha = async (req, res) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: "CAPTCHA missing" });
  }

  try {
    const googleVerifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
    const { data } = await axios.post(googleVerifyURL);

    if (!data.success || data.score < 0.5) {
      return res.status(403).json({ success: false, message: "CAPTCHA verification failed" });
    }

    return res.json({ success: true, message: "CAPTCHA verified" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error verifying CAPTCHA" });
  }
};
