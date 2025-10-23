// scripts/seedDemoData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Provider from "../models/Provider.js";
import Offer from "../models/Offer.js";

dotenv.config();

export default async function seedDemoData() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("Missing MongoDB connection string.");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  }

  // Demo images
  const PROVIDER_IMG =
    "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/provider.png?alt=media&token=49a7169f-c8fb-4393-a2ad-50d49a5176ca";

  const OFFER_IMG =
    "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/offer.png?alt=media&token=aa78ae95-7815-425a-8b57-b72fbdaf8646";

  const categories = [
    "Fashion",
    "Beauty",
    "Electronics",
    "Sports",
    "Furniture",
    "Digital",
    "Cafe",
    "Restaurant",
    "Travel",
    "Health",
  ];

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  await Provider.deleteMany({});
  await Offer.deleteMany({});
  console.log("🧹 Cleared old Providers and Offers");

  const providers = [];
  for (let i = 0; i < 10; i++) {
    const name = `${rand(["Luxe", "Star", "Elite", "Smart", "Urban", "Next", "Nova", "Golden", "Prime", "Fresh"])} ${rand([
      "Boutique",
      "Mart",
      "Salon",
      "Tech",
      "Sports",
      "Home",
      "Cafe",
      "Fitness",
      "Studio",
      "World",
    ])}`;

    const provider = new Provider({
      name,
      category: rand(categories),
      logoUrl: PROVIDER_IMG,
      description: `Discover exclusive offers and premium services at ${name}.`,
    });

    await provider.save();
    providers.push(provider);
  }

  console.log(`✅ Created ${providers.length} providers`);

  // Create offers
  let featuredCount = 0;
  for (const provider of providers) {
    const numOffers = Math.floor(Math.random() * 2) + 2; // 2–3 offers each
    for (let j = 0; j < numOffers; j++) {
      const discount = [10, 15, 20, 25, 30, 40, 50][Math.floor(Math.random() * 7)];
      const isFeatured = featuredCount < 8 && Math.random() > 0.5; // 8 featured offers max
      if (isFeatured) featuredCount++;

      const offer = new Offer({
        name: `${discount}% Off ${rand(["Collection", "Sale", "Special", "Discount", "Deal"])}`,
        category: provider.category,
        description: `Enjoy ${discount}% off at ${provider.name}. Hurry, limited time offer!`,
        imageUrl: OFFER_IMG,
        discountPercent: discount,
        providerId: provider._id,
        isFeatured,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // +7 days
      });

      await offer.save();
    }
  }

  console.log("🎉 Demo offers created successfully");
}
