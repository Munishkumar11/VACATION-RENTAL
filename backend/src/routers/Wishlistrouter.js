const express = require("express");
const router  = express.Router();
 
const { getWishlist, toggleWishlist, checkWishlist } = require("../controllers/Wishlistcontroller");
const { authMiddleware } = require("../middlewares/authMiddleware");
 
// all wishlist routes need auth
router.get("/",                        authMiddleware, getWishlist);      // GET  /wishlist
router.post("/:propertyId",            authMiddleware, toggleWishlist);   // POST /wishlist/:propertyId
router.get("/check/:propertyId",       authMiddleware, checkWishlist);    // GET  /wishlist/check/:propertyId
 
module.exports = router;
 