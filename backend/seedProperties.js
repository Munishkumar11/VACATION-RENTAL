require("dotenv").config();
const mongoose = require("mongoose");
const Property = require("./src/models/propertyModel");
const User = require("./src/models/userModel");

const MONGO_URI = process.env.MONGO_URI;

const imageMap = {
  villa: [
    {
      url: "https://images.unsplash.com/photo-1613977257363-707ba9348227",
      public_id: "villa_1",
    },
    {
      url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
      public_id: "villa_2",
    },
    {
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      public_id: "villa_3",
    },
  ],
  apartment: [
    {
      url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
      public_id: "apartment_1",
    },
    {
      url: "https://images.unsplash.com/photo-1494526585095-c41746248156",
      public_id: "apartment_2",
    },
    {
      url: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      public_id: "apartment_3",
    },
  ],
  house: [
    {
      url: "https://images.unsplash.com/photo-1449844908441-8829872d2607",
      public_id: "house_1",
    },
    {
      url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233",
      public_id: "house_2",
    },
    {
      url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
      public_id: "house_3",
    },
  ],
  studio: [
    {
      url: "https://images.unsplash.com/photo-1502672023488-70e25813eb80",
      public_id: "studio_1",
    },
    {
      url: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      public_id: "studio_2",
    },
    {
      url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
      public_id: "studio_3",
    },
  ],
};

const baseListings = [
  ["Luxury Beach Villa", "Goa", "villa", 7500, "Candolim Beach Road"],
  ["Modern City Apartment", "Mumbai", "apartment", 4200, "Bandra West"],
  ["Cozy Hill Cottage", "Manali", "house", 3500, "Old Manali Road"],
  ["Luxury Penthouse", "Bangalore", "apartment", 9500, "Indiranagar"],
  ["Lake View Cabin", "Nainital", "house", 3800, "Mall Road"],
  ["Desert Luxury Camp", "Jaisalmer", "villa", 5000, "Sam Sand Dunes"],
  ["Heritage Haveli Stay", "Udaipur", "villa", 6200, "Lake Pichola"],
  ["Minimalist Studio", "Pune", "studio", 2200, "Koregaon Park"],
  ["Luxury Farmhouse", "Ahmedabad", "house", 8000, "Sanand Road"],
  ["Cliffside Ocean Villa", "Varkala", "villa", 8800, "Varkala Cliff"],
  ["Royal Desert Villa", "Jodhpur", "villa", 4600, "Blue City Road"],
  ["Seaside Studio", "Chennai", "studio", 2500, "Marina Beach Road"],
  ["Mountain Escape House", "Shimla", "house", 4100, "Mall Road"],
  ["City Lights Apartment", "Delhi", "apartment", 5200, "Connaught Place"],
  ["Palm Retreat Villa", "Goa", "villa", 7100, "Calangute Road"],
  ["Peaceful Garden House", "Jaipur", "house", 3900, "Civil Lines"],
  ["Urban Nest Studio", "Hyderabad", "studio", 2300, "Banjara Hills"],
  ["Lakefront Villa", "Udaipur", "villa", 7600, "Fateh Sagar"],
  ["Skyline Apartment", "Noida", "apartment", 4300, "Sector 18"],
  ["Rustic Cottage Stay", "Mussoorie", "house", 3600, "Camel Back Road"],
  ["Sunset View Villa", "Pondicherry", "villa", 6800, "Beach Road"],
  ["Comfort Studio Home", "Surat", "studio", 2100, "Vesu"],
  ["Elegant City Apartment", "Kolkata", "apartment", 4700, "Park Street"],
  ["Forest Edge House", "Munnar", "house", 4400, "Tea Estate Road"],
  ["Blue Lagoon Villa", "Alleppey", "villa", 7900, "Backwater Road"],
  ["Compact Studio Living", "Nagpur", "studio", 2000, "Dharampeth"],
  ["Premium Heights Apartment", "Gurgaon", "apartment", 5400, "DLF Phase 3"],
  ["Valley Breeze House", "Dehradun", "house", 3800, "Rajpur Road"],
  ["Island Breeze Villa", "Andaman", "villa", 8600, "Havelock Beach"],
  ["Traveller Studio", "Indore", "studio", 2400, "Vijay Nagar"],
  ["Metro Comfort Apartment", "Lucknow", "apartment", 4100, "Gomti Nagar"],
  ["Countryside House", "Coorg", "house", 4500, "Madikeri Road"],
  ["Ocean Pearl Villa", "Kovalam", "villa", 8200, "Lighthouse Beach"],
  ["Budget Smart Studio", "Vadodara", "studio", 1900, "Alkapuri"],
  ["Central Park Apartment", "Pune", "apartment", 4000, "Kalyani Nagar"],
  ["Hillside Family House", "Darjeeling", "house", 4300, "Chowrasta Road"],
  ["Golden Sands Villa", "Goa", "villa", 7700, "Baga Beach"],
  ["Workation Studio", "Bangalore", "studio", 2600, "HSR Layout"],
  ["Elite Residency Apartment", "Ahmedabad", "apartment", 4800, "SG Highway"],
  ["Woodland House", "Ooty", "house", 3950, "Fern Hill"],
  ["Coral Bay Villa", "Daman", "villa", 7300, "Devka Beach"],
  ["Modern Solo Studio", "Mumbai", "studio", 2800, "Andheri West"],
  ["Executive Apartment", "Chandigarh", "apartment", 4600, "Sector 17"],
  ["Family Holiday House", "Rishikesh", "house", 4200, "Tapovan"],
  ["Sea Breeze Villa", "Goa", "villa", 8100, "Anjuna Beach"],
];

const listings = baseListings.map((item, index) => {
  const [title, city, propertyType, pricePerNight, address] = item;

  return {
    title,
    description: `${title} with premium stay experience, modern amenities, and a beautiful location in ${city}.`,
    propertyType,
    pricePerNight,
    location: {
      city,
      country: "India",
      address,
    },
    maxGuests:
      propertyType === "studio" ? 2 : propertyType === "apartment" ? 4 : 6,
    bedrooms:
      propertyType === "studio" ? 1 : propertyType === "apartment" ? 2 : 3,
    bathrooms: propertyType === "studio" ? 1 : 2,
    beds: propertyType === "studio" ? 1 : propertyType === "apartment" ? 2 : 3,
    amenities:
      propertyType === "villa"
        ? ["wifi", "pool", "parking", "kitchen", "air conditioning", "balcony"]
        : propertyType === "apartment"
        ? ["wifi", "parking", "kitchen", "air conditioning", "washing machine"]
        : propertyType === "house"
        ? ["wifi", "parking", "garden", "kitchen", "heating"]
        : ["wifi", "kitchen", "air conditioning"],
    images: [imageMap[propertyType][index % imageMap[propertyType].length]],
    rating: 4.2 + ((index % 8) * 0.1),
    reviewCount: 20 + index,
  };
});

async function seedProperties() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected ✅");

    let hostUser = await User.findOne({ role: "host" });

    if (!hostUser) {
      hostUser = await User.create({
        name: "Seed Host",
        email: "seedhost@example.com",
        password: "seedhost123",
        role: "host",
      });
      console.log("Seed host created âœ…");
    }

    const listingsWithHost = listings.map((listing) => ({
      ...listing,
      host: hostUser._id,
    }));

    await Property.deleteMany();
    console.log("Old properties deleted ✅");

    await Property.insertMany(listingsWithHost);
    console.log(`${listings.length} properties inserted ✅`);

    process.exit(0);
  } catch (error) {
    console.log("SEED ERROR:", error);
    process.exit(1);
  }
}

seedProperties();
