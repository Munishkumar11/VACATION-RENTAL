const Property = require("../models/propertyModel");
const Booking = require("../models/bookingModel");


// 🏡 1. Create Property
exports.createProperty = async (req, res) => {
  try {
    const data = req.body;

    let location = {};
    if (data.location) {
      try {
        location = JSON.parse(data.location);
      } catch (err) {
        location = data.location;
      }
    }

    let amenities = data["amenities[]"] || data.amenities || [];
    if (!Array.isArray(amenities)) amenities = [amenities];

    let houseRules = data["houseRules[]"] || data.houseRules || [];
    if (!Array.isArray(houseRules)) houseRules = [houseRules];

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
      maxGuests:       Number(data.maxGuests),
      bedrooms:        Number(data.bedrooms) || 1,
      beds:            Number(data.beds) || 1,
      bathrooms:       Number(data.bathrooms) || 1,
      location,
      images,
      amenities,
      houseRules,
      host: req.user._id,
    });

    res.status(201).json({ message: "Property created successfully", data: property });
  } catch (error) {
    console.log("CREATE PROPERTY ERROR:", error);
    res.status(500).json({ message: error.message || "Error creating property" });
  }
};

// 📋 2. Get My Properties
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      owner: req.user._id,
    });

    res.status(200).json({
      message: "My properties fetched",
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching properties",
    });
  }
};


// ✏️ 3. Update Property
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id, // ensure host owns it
      },
      req.body,
      {  returnDocument: "after" }
    );

    if (!property) {
      return res.status(404).json({
        message: "Property not found or not yours",
      });
    }

    res.status(200).json({
      message: "Property updated",
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating property",
    });
  }
};


// ❌ 4. Delete Property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or not yours",
      });
    }

    res.status(200).json({
      message: "Property deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting property",
    });
  }
};


// 📅 5. Get Host Bookings
exports.getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "property",
        match: { owner: req.user._id },
      })
      .populate("user");

    // filter null properties
    const filteredBookings = bookings.filter(
      (b) => b.property !== null
    );

    res.status(200).json({
      message: "Host bookings fetched",
      data: filteredBookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bookings",
    });
  }
};


// 🔄 6. Update Booking Status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // check if property belongs to host
    if (booking.property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      message: "Booking status updated",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating booking",
    });
  }
};