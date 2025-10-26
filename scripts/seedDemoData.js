// scripts/seedDemoData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Provider from "../models/Provider.js";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js"; // ✅ new model

dotenv.config();

export default async function seedDemoData() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("Missing MongoDB connection string.");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  }

  // 🖼️ Demo image links
  const PROVIDER_IMG =
    "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/provider.png?alt=media&token=49a7169f-c8fb-4393-a2ad-50d49a5176ca";
  const OFFER_IMG =
    "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/offer.png?alt=media&token=aa78ae95-7815-425a-8b57-b72fbdaf8646";
  const PRODUCT_IMG =
    "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/product.png?alt=media&token=14eb187b-9109-4c30-885d-af2a974f0924";

  const categories = [
    "Fashion",
    "Beauty",
    "Electronics",
    "Sports",
    "Furniture",
    "Cafe",
    "Restaurant",
    "Travel",
    "Health",
  ];

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randBetween = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // 🧹 Clear old data
  await Provider.deleteMany({});
  await Offer.deleteMany({});
  await Product.deleteMany({});
  console.log("🧹 Cleared old Providers, Offers, and Products");

  // 🏢 Create Providers
  const providers = [];
  for (let i = 0; i < 8; i++) {
    const name = `${rand([
      "Luxe",
      "Star",
      "Elite",
      "Urban",
      "Next",
      "Nova",
      "Golden",
      "Fresh",
    ])} ${rand(["Mart", "Salon", "Cafe", "Tech", "Home", "Studio"])}`;

    const provider = new Provider({
      name,
      category: rand(categories),
      logoUrl: PROVIDER_IMG,
      description: `Discover exclusive deals and premium services at ${name}.`,
    });

    await provider.save();
    providers.push(provider);
  }

  console.log(`✅ Created ${providers.length} demo providers`);

  // 🎁 Create Offers
  let featuredCount = 0;
  for (const provider of providers) {
    const numOffers = randBetween(2, 3);
    for (let j = 0; j < numOffers; j++) {
      const discount = [10, 15, 20, 25, 30, 40, 50][
        Math.floor(Math.random() * 7)
      ];
      const isFeatured = featuredCount < 8 && Math.random() > 0.5;
      if (isFeatured) featuredCount++;

      const offer = new Offer({
        name: `${discount}% Off ${rand([
          "Collection",
          "Deal",
          "Special",
          "Discount",
        ])}`,
        category: provider.category,
        description: `Enjoy ${discount}% off at ${provider.name}. Limited time only!`,
        imageUrl: OFFER_IMG,
        discountPercent: discount,
        providerId: provider._id,
        isFeatured,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      await offer.save();
    }
  }

  console.log("🎉 Offers created successfully");

  // 🛍️ Create Products
  for (const provider of providers) {
    const numProducts = randBetween(3, 5);
    for (let k = 0; k < numProducts; k++) {
      const oldPrice = randBetween(100, 500);
      const newPrice = Math.round(oldPrice * (0.7 + Math.random() * 0.2));

      const product = new Product({
        name: `${rand(["Premium", "Classic", "Modern", "Smart", "Eco"])} ${rand(
          ["Bag", "Watch", "Shoe", "Lamp", "Headphones", "Chair", "Cup"]
        )}`,
        imageUrl: PRODUCT_IMG,
        oldPrice,
        newPrice,
        providerId: provider._id,
      });

      await product.save();
    }
  }

  console.log("🛒 Products created successfully for each provider");

  console.log("✅ Demo data seeding complete!");
}
