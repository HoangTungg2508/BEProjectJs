const { response } = require("express");
const Users = require("../models/userModel");
const Payments = require("../models/paymentModal");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const user = await Users.findOne({ email });

      if (user) return res.status(400).json({ msg: "Email đã được đăng ký" });

      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Mật khẩu không được ít hơn 6 ký tự." });

      // Mã hóa mật khẩu
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new Users({
        name,
        email,
        password: passwordHash,
      });
      await newUser.save();

      //Tạo token để xác thực
      const accesstoken = createAccessToken({ id: newUser._id });
      const refreshtoken = createRefreshToken({ id: newUser._id });

      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
      });

      res.json(accesstoken);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  // xác thực người dùng bằng cách kiểm tra email và mật khẩu
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email });

      if (!user)
        return res.status(400).json({ msg: "Người dùng không tồn tại." });

      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Sai mật khẩu." });

      const accesstoken = createAccessToken({ id: user._id });
      const refreshtoken = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
      });

      res.json(accesstoken);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  // xóa cookie chứa refresh token và trả về thông báo đăng xuấ
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" });
      return res.json({ msg: "Đăng xuất" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  //  lấy refresh token từ cookie và kiểm tra tính hợp lệ
  refreshToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({ msg: "Hãy đăng nhập hoặc đăng ký" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
          return res.status(400).json({ msg: "Hãy đăng nhập hoặc đăng ký" });
        const accesstoken = createAccessToken({ id: user.id });

        res.json({ accesstoken });
      });

      res.json({ rf_token });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  //  trả về thông tin người dùng trừ mật khẩu
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("-password");
      if (!user)
        return res.status(404).json({ msg: "Người dùng không tồn tại." });

      res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  // cập nhật giỏ hàng của người dùng và trả về thông báo xác nhận.
  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user)
        return res.status(400).json({ msg: "Người dùng không tồn tại." });

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          cart: req.body.cart,
        }
      );

      return res.json({ msg: "Đã thêm sản phẩm" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  // trả về lịch sử thanh toán của người dùng
  history: async (req, res) => {
    try {
      const history = await Payments.find({ user_id: req.user.id });
      res.json(history);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};
// dùng để tạo các JSON Web Tokens
const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

module.exports = userCtrl;
