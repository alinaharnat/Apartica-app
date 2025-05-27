const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Amenity = require('./models/amenity');
const PropertyType = require('./models/propertyType');
const HouseRuleCategory = require('./models/houseRuleCategory');
const HouseRuleOption = require('./models/houseRuleOption');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Current directory:', __dirname);
console.log('Looking for .env in:', path.join(__dirname, '.env'));
console.log('Environment loaded:', {
  MONGO_URI: process.env.MONGO_URI ? 'Defined' : 'Not defined',
  MONGODB_URI: process.env.MONGODB_URI ? 'Defined' : 'Not defined',
  DATABASE_URL: process.env.DATABASE_URL ? 'Defined' : 'Not defined',
  JWT_SECRET: process.env.JWT_SECRET ? 'Defined' : 'Not defined',
});

const connectDB = async () => {
  try {
    // Try different possible variable names
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in .env file. Checked: MONGO_URI, MONGODB_URI, DATABASE_URL');
    }
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Amenity.deleteMany({});
    await PropertyType.deleteMany({});
    await HouseRuleCategory.deleteMany({});
    await HouseRuleOption.deleteMany({});

    // Seed Amenities
    const amenities = [
      { name: 'Air conditioning', icon: 'air' },
      { name: 'Basic soaps', icon: 'soap' },
      { name: 'Clothes dryer', icon: 'dryer' },
      { name: 'Coin laundry', icon: 'laundry' },
      { name: 'Fitness room', icon: 'fitness' },
      { name: 'Hair dryer', icon: 'hairdryer' },
      { name: 'Heating', icon: 'heating' },
      { name: 'Iron & board', icon: 'iron' },
      { name: 'Linens', icon: 'linens' },
      { name: 'Toilet paper', icon: 'paper' },
      { name: 'Towels', icon: 'towels' },
      { name: 'Washing machine', icon: 'washer' },
      { name: 'Wireless internet', icon: 'wifi' },
      { name: 'Kitchen', icon: 'kitchen' },
      { name: 'Parking', icon: 'parking' },
      { name: 'Pool', icon: 'pool' },
      { name: 'TV', icon: 'tv' },
      { name: 'Elevator', icon: 'elevator' }
    ];
    await Amenity.insertMany(amenities);
    console.log('Amenities seeded');

    // Seed Property Types
    const propertyTypes = [
      { name: 'Apartment' },
      { name: 'House' },
      { name: 'Hostel' },
      { name: 'Hotel' },
    ];
    await PropertyType.insertMany(propertyTypes);
    console.log('Property types seeded');

    // Seed House Rule Categories and Options
    // 1. Check-in/Check-out category
    const checkInOutCategory = await HouseRuleCategory.create({ name: 'Check-in/Check-out' });
    
    // 2. Guest Policies
    const guestPoliciesCategory = await HouseRuleCategory.create({ name: 'Guest Policies' });
    await HouseRuleOption.insertMany([
      { categoryId: guestPoliciesCategory._id, value: 'Children allowed' },
      { categoryId: guestPoliciesCategory._id, value: 'Infants allowed' },
      { categoryId: guestPoliciesCategory._id, value: 'Pets allowed' },
      { categoryId: guestPoliciesCategory._id, value: 'Smoking allowed' },
      { categoryId: guestPoliciesCategory._id, value: 'Events allowed' }
    ]);

    // 3. Additional Rules
    const additionalRulesCategory = await HouseRuleCategory.create({ name: 'Additional Rules' });
    await HouseRuleOption.insertMany([
      { categoryId: additionalRulesCategory._id, value: 'No parties' },
      { categoryId: additionalRulesCategory._id, value: 'Quiet hours (10 PM - 8 AM)' },
      { categoryId: additionalRulesCategory._id, value: 'No unregistered guests' },
      { categoryId: additionalRulesCategory._id, value: 'Must clean before checkout' }
    ]);

    // 4. Payment Methods
    const paymentMethodsCategory = await HouseRuleCategory.create({ name: 'Payment Methods' });
    await HouseRuleOption.insertMany([
      { categoryId: paymentMethodsCategory._id, value: 'MasterCard' },
      { categoryId: paymentMethodsCategory._id, value: 'Visa' }
    ]);

    console.log('House rules seeded');
    console.log('Seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();