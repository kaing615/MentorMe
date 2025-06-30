import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import responseHandler from "../handlers/response.handler";
import User from "../models/user.model";
import mailgun from "mailgun-js";
import dotenv from "dotenv";

dotenv.config();

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

export const sendVerificationEmail = async (email, verifyKey, userName) => {
  const verifyLink = `https://mentorme.com/verify?email=${encodeURIComponent(
    email
  )}&verifyKey=${verifyKey}`;

  const data = {
    from: "MentorMe <no-reply@yourdomain.com>",
    to: email,
    subject: "MentorMe Account Verification",
    html: `
      <h3>Hello ${userName || ""}!</h3>
      <p>You have just registered a MentorMe account. Please click the link below to verify your email:</p>
      <a href="${verifyLink}">${verifyLink}</a>
      <br /><br />
      <p>If you did not register this account, please ignore this email.</p>
    `,
  };

  return mg.messages().send(data);
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, verifyKey } = req.body;
    const user = await User.findOne({ email, verifyKey, isVerified: false });
    if (!user)
      return responseHandler.badRequest(
        res,
        "The verification link is invalid or has already been used."
      );
    user.isVerified = true;
    user.verifyKey = "";
    await user.save();
    return responseHandler.ok(res, {
      message: "Email verification successful!",
    });
  } catch (err) {
    responseHandler.error(res);
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isVerified: false });
    if (!user)
      return responseHandler.badRequest(
        res,
        "User has already been verified or does not exist."
      );
    await sendVerificationEmail(user.email, user.verifyKey, user.userName);
    return responseHandler.ok(res, {
      message: "Resend verification email successful!",
    });
  } catch (err) {
    responseHandler.error(res);
  }
};

export const signUp = async (req, res) => {
  try {
    const {
      userName,
      firstName,
      lastName,
      email,
      password,
      role,
      googleId,
      avatar,
    } = req.body;

    const checkUser = await User.findOne({ email });
    if (checkUser)
      return responseHandler.badRequest(res, "User already exists");

    let hashedPassword = "";
    let salt = "";
    let verifyKey = "";

    if (!googleId) {
      if (!password)
        return responseHandler.badRequest(res, "Password cannot be empty.");
      salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      verifyKey = Math.random().toString(36).substring(2, 15);
    }

    const user = new User({
      email,
      userName,
      firstName,
      lastName,
      password: hashedPassword,
      salt,
      role: Array.isArray(role) ? role : [role],
      isVerified: !!googleId,
      googleId,
      avatar: avatar || "",
      verifyKey: !googleId ? verifyKey : "",
    });

    if (!googleId) {
      await sendVerificationEmail(email, verifyKey, userName);
    }

    await user.save();

    if (user.isVerified) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      const userData = user.toObject();
      delete userData.password;
      delete userData.salt;
      delete userData.verifyKey;
      return responseHandler.created(res, {
        token,
        ...userData,
        id: user._id,
      });
    }

    return responseHandler.created(res, {
      message:
        "Registration successful! Please check your email to verify your account.",
      id: user._id,
    });
  } catch (err) {
    console.error("Sign up error:", err);
    responseHandler.error(res);
  }
};
