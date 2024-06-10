const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Payments = require("../models/paymentModal");
const Users = require("../models/userModel");
const Products = require("../models/productModel");

const paymentCtrl = {
  // Tạo một phiên thanh toán sử dụng Stripe Checkout API dựa trên các thông tin
  // sản phẩm và chuyển hướng người dùng đến trang thanh toán của Stripe khi hoàn thành hoặc hủy bỏ thanh toán.
  createPayment: async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: req.body.lineItems,
        mode: "payment",
        payment_method_types: ["card"],
        success_url: `http://localhost:3000/success/{CHECKOUT_SESSION_ID}`,
        cancel_url: "http://localhost:3000",
      });

      return res.status(201).json(session);
    } catch (error) {
      return res.status(500).json(error);
    }
  },
  // Lấy thông tin của một phiên thanh toán dựa trên ID phiên được cung cấp.
  retrieveSession: async (req, res) => {
    try {
      const sessionId = req.params.id;
      const retrievedSession = await stripe.checkout.sessions.retrieve(
        sessionId
      );

      return res.status(200).json(retrievedSession);
    } catch (error) {
      return res.status(500).json(error);
    }
  },
  // Lấy danh sách các thanh toán từ cơ sở dữ liệu.
  getPayments: async (req, res) => {
    try {
      const payments = await Payments.find();
      res.json(payments);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  // Cập nhật cơ sở dữ liệu sau khi thanh toán thành công. Nó cập nhật thông tin về người dùng, giỏ hàng, mã thanh toán, địa chỉ và trạng thái thanh toán.
  updateIfSuccess: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("name email");
      if (!user) return res.status(400).json({ msg: "User does not exist." });

      const { cart, paymentID, address, status } = req.body;

      const { _id, name, email } = user;

      const newPayment = new Payments({
        user_id: _id,
        name,
        email,
        cart,
        paymentID,
        address,
        status,
      });

      cart.filter((item) => {
        return sold(item._id, item.quantity, item.sold);
      });

      await newPayment.save();
      res.json({ msg: "Payment Success!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};
// cập nhật số lượng sản phẩm đã bán trong cơ sở dữ liệu sau mỗi giao dịch thành công
const sold = async (id, quantity, oldSold) => {
  await Products.findOneAndUpdate(
    { _id: id },
    {
      sold: quantity + oldSold,
    }
  );
};
module.exports = paymentCtrl;
