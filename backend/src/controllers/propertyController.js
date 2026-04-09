const Property = require("../models/propertyModel");

// CREATE PROPERTY
const createProperty = async (req, res) => {
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);
  try {
    const data = req.body;

    // ✅ parse location from JSON string
    let location = {};
    if (data.location) {
      try {
        location = JSON.parse(data.location);
      } catch (err) {
        location = data.location; // already an object
      }
    }

    // ✅ handle amenities
    let amenities = data["amenities[]"] || data.amenities || [];
    if (!Array.isArray(amenities)) amenities = [amenities];

    // ✅ handle houseRules
    let houseRules = data["houseRules[]"] || data.houseRules || [];
    if (!Array.isArray(houseRules)) houseRules = [houseRules];

    // ✅ handle images
    const images = req.files
      ? req.files.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }))
      : [];

    const property = await Property.create({
      title:           data.title,
      description:     data.description,
      propertyType:    data.propertyType,
      status:          data.status || "active",
      pricePerNight:   Number(data.pricePerNight),
      securityDeposit: Number(data.securityDeposit) || 0,
      minStay:         Number(data.minStay) || 1,
      maxStay:         Number(data.maxStay) || 30,
      maxGuests:       Number(data.maxGuests) || 1,
      bedrooms:        Number(data.bedrooms) || 1,
      beds:            Number(data.beds) || 1,
      bathrooms:       Number(data.bathrooms) || 1,
      location,
      images,
      amenities,
      houseRules,
      host: req.user._id || req.user.id, // ✅ FIXED: was req.user._id
    });

    res.status(201).json({
      message: "Property created successfully",
      data: property,
    });

  } catch (error) {
    console.log("ERROR NAME:", error.name);       // ✅ FIXED
    console.log("ERROR MESSAGE:", error.message); // ✅ FIXED
    res.status(500).json({ message: error.message }); // ✅ FIXED
  }
};

// ✅ Fixed — only fetch ACTIVE properties
const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: "active" }); // ← add this filter
    res.status(200).json({
      message: "Properties fetched",
      data: properties,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET ONE
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("host", "_id name email profilePic");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    console.log("PROPERTY:", property);
    console.log("HOST:", property?.host);

    res.status(200).json({
      success: true,
      data: property,
    });

  } catch (error) {
    console.log("GET PROPERTY ERROR:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// UPDATE
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {  returnDocument: "after"  }
    );

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    res.status(200).json({
      message: "Property updated",
      data: property,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    res.status(200).json({
      message: "Property deleted",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProperties,
  createProperty,
  getPropertyById,
  deleteProperty,
  updateProperty,
};
