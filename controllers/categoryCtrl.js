const Category = require("../models/categoryModel");
const Products = require("../models/productModel");

const categoryCtrl = {
  // hương thức này được sử dụng để lấy danh sách các danh mục sản phẩm từ cơ sở dữ liệu và trả về trong phản hồi.
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  // Phương thức này được sử dụng để tạo mới một danh mục sản phẩm trong cơ sở dữ liệu
  createCategory: async (req, res) => {
    try {
      //nếu user role == 1 thì là admin
      // khi là admin thì có thể thêm sửa xóa danh mục
      const { name } = req.body;
      const category = await Category.findOne({ name });
      if (category)
        return res.status(400).json({ msg: "Danh mục đã tồn tại." });

      const newCategory = await Category({ name });

      await newCategory.save();
      res.json({ msg: "Tạo danh mục thành công" });
    } catch (error) {
      return res.status(500).json({ msg: err.message });
    }
  },
  // Phương thức này được sử dụng để xóa một danh mục sản phẩm khỏi cơ sở dữ liệu
  deleteCategory: async (req, res) => {
    try {
      const products = await Products.findOne({ category: req.params.id });
      if (products)
        return res
          .status(400)
          .json({ msg: "Vui lòng xóa các sản phẩm có liên quan." });
      await Category.findByIdAndDelete(req.params.id);
      res.json({ msg: "Xóa thành công." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  // Phương thức này được sử dụng để cập nhật thông tin của một danh mục sản phẩm trong cơ sở dữ liệu
  updateCategory: async (req, res) => {
    try {
      const { name } = req.body;

      await Category.findByIdAndUpdate({ _id: req.params.id }, { name });

      res.json({ msg: "Cập nhật thành công." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = categoryCtrl;
