import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { uploadImage } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export const sendVerificationEmail = async (email, verifyKey, userName) => {
  const verifyLink = `
    http://localhost:5173/auth/verify-email?verified=1&email=${encodeURIComponent(
    email
  )}&verifyKey=${verifyKey}`;
  const data = {
    from: "MentorMe <no-reply@mentorme.com>",
    to: email,
    subject: "Xác thực tài khoản MentorMe",
    html: `
            <h3>Xin chào ${userName || ""}!</h3>
            <p>Bạn vừa đăng ký tài khoản MentorMe. Vui lòng bấm vào liên kết dưới đây để xác thực email:</p>
            <a href="${verifyLink}">${verifyLink}</a>
            <br /><br />
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        `,
  };
  try {
    let info = await transport.sendMail(data);
    console.log("Email sent: ", info.messageId);
  } catch (err) {
    console.error("Lỗi gửi email xác thực: ", err);
    throw new Error("Không gửi được email xác thực!");
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, verifyKey } = req.query;
    const user = await User.findOne({
      email
    });
    if (!user)
      return responseHandler.badRequest(
        res,
        "Liên kết xác thực không hợp lệ hoặc đã được sử dụng."
      );

    user.isVerified = true;
    user.verifyKey = "";
    user.verifyKeyExpires = undefined;

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;

    return responseHandler.ok(res, {
      message: "Xác thực email thành công!",
      token,
      ...userData,
      id: user._id,
    });
  } catch (err) {
    console.error("Verify email error:", err);
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
        "Người dùng đã xác thực hoặc không tồn tại."
      );

    user.verifyKey = generateToken();
    user.verifyKeyExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    await sendVerificationEmail(user.email, user.verifyKey, user.userName);

    return responseHandler.ok(res, {
      message: "Đã gửi lại email xác thực thành công!",
    });
  } catch (err) {
    responseHandler.error(res);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, userName, firstName, lastName, avatar, role } =
      req.body;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = new User({
        googleId,
        email,
        userName,
        firstName,
        lastName,
        avatar,
        role: Array.isArray(role) ? role : [role],
        isVerified: true,
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;

    return responseHandler.ok(res, {
      token,
      ...userData,
      id: user._id,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    responseHandler.error(res, "Login with Google failed.");
  }
};

export const signUp = async (req, res) => {
  try {
    const { userName, email, password, confirmPassword, firstName, lastName } = req.body;

    if (!email) {
      return responseHandler.badRequest(res, "Email không được bỏ trống.");
    }

    const checkUser = await User.findOne({ email });
    if (checkUser)
      return responseHandler.badRequest(res, "Email đã được sử dụng.");

    if (!firstName) {
      return responseHandler.badRequest(res, "Tên không được để trống.");
    }

    if (!lastName) {
      return responseHandler.badRequest(res, "Họ không được để trống.");
    }

    if (!password || !confirmPassword) {
      return responseHandler.badRequest(res, "Mật khẩu không được để trống.");
    }

    if (password != confirmPassword) {
      return responseHandler.badRequest(res, "Mật khẩu và xác nhận mật khẩu không khớp.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verifyKey = generateToken();
    const verifyKeyExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user = new User({
      email,
      firstName,
      lastName,
      userName,
      password: hashedPassword,
      salt,
      role: "mentee",
      isVerified: false,
      isDeleted: false,
      verifyKey,
      verifyKeyExpires,
    });

    await sendVerificationEmail(user.email, user.verifyKey, user.userName);
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
        user: userData,
      });
    }

    return responseHandler.created(res, {
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
      id: user._id,
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    responseHandler.error(res);
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return responseHandler.badRequest(res, "User không tồn tại");

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    if (!req.file) {
      return responseHandler.badRequest(res, "Chưa có file avatar gửi lên!");
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;
    const result = await uploadImage(base64, {
      public_id: `avatar_${userId}_${Date.now()}`,
      folder: "user_avatars",
      overwrite: true,
    });

    user.avatarUrl = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    return responseHandler.ok(res, {
      message: "Đổi avatar thành công!",
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("Lỗi đổi avatar:", err);
    responseHandler.error(res, "Đổi avatar thất bại!");
  }
};

export const signUpMentor = async (req, res) => {
  try {
    const { userName, email, password, ...rest } = req.body;

    const checkUser = await User.findOne({ email });
    if (checkUser)
      return responseHandler.badRequest(res, "Email đã được sử dụng");

    let avatarUrl = "";
    let avatarPublicId = "";

    if (!req.file) {
      return responseHandler.badRequest(res, "Vui lòng upload ảnh đại diện.");
    }

    if (req.file) {
      const base64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await uploadImage(base64, {
        public_id: `avatar_mentor_${Date.now()}`,
        folder: "user_avatars",
        overwrite: true,
      });
      avatarUrl = uploadResult.secure_url;
      avatarPublicId = uploadResult.public_id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      userName,
      email,
      password: hashedPassword,
      salt,
      avatarUrl,
      avatarPublicId,
      role: ["mentor"],
      isVerified: false,
      // ... các trường còn lại
      ...rest,
    });

    await user.save();

    return responseHandler.created(res, {
      message: "Đăng ký mentor thành công!",
      id: user._id,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("Lỗi signUpMentor:", err);
    responseHandler.error(res, err.message || "Lỗi đăng ký mentor!");
  }
};

export const getPendingMentor = async (req, res) => {
  try {
    const mentors = await User.find({
      role: 'mentor',
      isVerified: false,
    });

    return responseHandler.ok(res, mentors);
  } catch (err) {
    console.log("Lỗi lấy mentor chờ duyệt: ", err)
    return responseHandler.error(res, err.message || "Lỗi lấy mentor chờ duyệt!");
  }
}

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return responseHandler.badRequest(res, "Email và mật khẩu là bắt buộc.");

    const user = await User.findOne({ email });

    const genericErrorMessage = "Email hoặc mật khẩu không đúng.";
    // chống user enumeration

    const DUMMY_HASH =
      "$2a$10$ull7LxLFMg9MvAgkKYlWBuQ3yA57nLCbSAT6BPhEqMacBVDOa2Jby";
    // chống timing attack
    let isValidPassword = false;

    if (user && user.isVerified) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      await bcrypt.compare(password, DUMMY_HASH);
      isValidPassword = false;
    }
    if (!isValidPassword) {
      return responseHandler.unauthorized(res, genericErrorMessage);
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        userName: user.userName,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;
    delete userData.salt;
    delete userData.verifyKey;

    return responseHandler.ok(res, {
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    responseHandler.error(res, err.message || "Unknown error during sign-in.");
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return responseHandler.ok(res, {
        message: "Nếu email này tồn tại, đã gửi liên kết đặt lại mật khẩu.",
      });

    const resetToken = generateToken();
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `${
      process.env.FRONTEND_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await transport.sendMail({
      from: "MentorMe <no-reply@mentorme.com>",
      to: email,
      subject: "Đặt lại mật khẩu MentorMe",
      html: `
                <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu. Liên kết sẽ hết hạn sau 15 phút:</p>
                <a href="${resetLink}">${resetLink}</a>
            `,
    });

    return responseHandler.ok(res, {
      message: "Nếu email này tồn tại, đã gửi liên kết đặt lại mật khẩu.",
    });
  } catch (err) {
    console.error("Lỗi quên mật khẩu:", err);
    responseHandler.error(res);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!user)
      return responseHandler.badRequest(
        res,
        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
      );

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    return responseHandler.ok(res, {
      message: "Đặt lại mật khẩu thành công.",
    });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err);
    responseHandler.error(res);
  }
};

export default {
  signUp,
  signUpMentor,
  signIn,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
