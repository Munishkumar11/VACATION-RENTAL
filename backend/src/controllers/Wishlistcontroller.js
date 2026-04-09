const Wishlist = require("../models/Wishlistmodel");
 
// ─────────────────────────────────────────────
// GET /wishlist
// Get logged-in user's wishlist
// ─────────────────────────────────────────────
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: "properties",
        populate: { path: "host", select: "name avatar" },
      });
 
    if (!wishlist) {
      return res.status(200).json({ success: true, data: [] });
    }
 
    res.status(200).json({ success: true, data: wishlist.properties });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─────────────────────────────────────────────
// POST /wishlist/:propertyId
// Toggle property in wishlist (add or remove)
// ─────────────────────────────────────────────
const toggleWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
 
    // Create wishlist if doesn't exist yet
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        properties: [propertyId],
      });
      return res.status(200).json({
        success: true,
        message: "Added to wishlist",
        wishlisted: true,
        data: wishlist,
      });
    }
 
 
 
    const isWishlisted = wishlist.properties
      .map((id) => id.toString())
      .includes(propertyId);
 
    if (isWishlisted) {
      // Remove from wishlist
      wishlist.properties = wishlist.properties.filter(
        (id) => id.toString() !== propertyId
      );
      await wishlist.save();
      return res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        wishlisted: false,
        data: wishlist,
      });
    } else {
      // Add to wishlist
      wishlist.properties.push(propertyId);
      await wishlist.save();
      return res.status(200).json({
        success: true,
        message: "Added to wishlist",
        wishlisted: true,
        data: wishlist,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};
 
// ─────────────────────────────────────────────
// GET /wishlist/check/:propertyId
// Check if a property is in wishlist
// ─────────────────────────────────────────────
const checkWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;
 
    const wishlist = await Wishlist.findOne({ user: req.user.id });
 
    if (!wishlist) {
      return res.status(200).json({ success: true, wishlisted: false });
    }
 
    const isWishlisted = wishlist.properties
      .map((id) => id.toString())
      .includes(propertyId);
 
    res.status(200).json({ success: true, wishlisted: isWishlisted });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};
 
module.exports = { getWishlist, toggleWishlist, checkWishlist };