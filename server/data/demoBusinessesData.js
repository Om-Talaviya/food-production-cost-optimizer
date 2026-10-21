/**
 * Canonical Dataset for 4 Complete, Realistic Demo Businesses
 * Food Production Cost Optimizer
 *
 * Businesses:
 * 1. Sunrise Artisan Bakery (user_demo_sunrise_bakery)
 * 2. GreenJar Foods (user_demo_greenjar_foods)
 * 3. CrunchCraft Snacks (user_demo_crunchcraft_snacks)
 * 4. Cream & Culture (user_demo_cream_culture)
 */

const DEMO_BUSINESSES = [
  // =========================================================================
  // USER A: Sunrise Artisan Bakery
  // =========================================================================
  {
    user: {
      id: 'user_demo_sunrise_bakery',
      name: 'Aditi Sharma',
      email: 'sunrise.bakery@example.com',
      password: 'Bakery@Demo2026',
      companyName: 'Sunrise Artisan Bakery',
      category: 'Bakery & Confectionery',
      createdAt: '2025-10-01T08:00:00.000Z'
    },
    batches: [
      {
        id: 'batch_sunrise_01',
        productName: 'Artisan Sourdough Loaf',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 250,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 140,
        packagingCost: 1800,
        labourCost: 4200,
        energyCost: 2600,
        waterUtilitiesCost: 400,
        transportLogisticsCost: 800,
        overheadCost: 2500,
        wastagePercentage: 4.2,
        createdAt: '2025-10-12T08:30:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 140, unit: 'kg', unitPrice: 38 },
          { name: 'Sourdough Starter & Yeast', quantity: 15, unit: 'kg', unitPrice: 90 },
          { name: 'Filtered Water & Salt', quantity: 85, unit: 'kg', unitPrice: 6 }
        ]
      },
      {
        id: 'batch_sunrise_02',
        productName: 'French Butter Croissants',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 400,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 95,
        packagingCost: 3200,
        labourCost: 6000,
        energyCost: 3400,
        waterUtilitiesCost: 350,
        transportLogisticsCost: 1000,
        overheadCost: 3000,
        wastagePercentage: 5.5,
        createdAt: '2025-11-05T09:00:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 120, unit: 'kg', unitPrice: 38 },
          { name: 'Unsalted Butter', quantity: 65, unit: 'kg', unitPrice: 420 },
          { name: 'Whole Cow Milk', quantity: 40, unit: 'L', unitPrice: 45 },
          { name: 'Fine Caster Sugar', quantity: 25, unit: 'kg', unitPrice: 44 },
          { name: 'Yeast & Salt', quantity: 5, unit: 'kg', unitPrice: 110 }
        ]
      },
      {
        id: 'batch_sunrise_03',
        productName: 'Belgian Chocolate Fudge Cake',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 150,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 450,
        packagingCost: 3500,
        labourCost: 5500,
        energyCost: 2800,
        waterUtilitiesCost: 300,
        transportLogisticsCost: 1200,
        overheadCost: 4000,
        wastagePercentage: 6.8,
        createdAt: '2025-12-18T08:00:00.000Z',
        ingredients: [
          { name: 'Dark Chocolate Chips (55%)', quantity: 45, unit: 'kg', unitPrice: 650 },
          { name: 'Unsalted Butter', quantity: 30, unit: 'kg', unitPrice: 430 },
          { name: 'Organic Wheat Flour (Maida)', quantity: 40, unit: 'kg', unitPrice: 38 },
          { name: 'Fine Caster Sugar', quantity: 45, unit: 'kg', unitPrice: 45 },
          { name: 'Fresh Farm Eggs', quantity: 300, unit: 'units', unitPrice: 7 }
        ]
      },
      {
        id: 'batch_sunrise_04',
        productName: 'Brioche Burger Buns',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 600,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 45,
        packagingCost: 3000,
        labourCost: 4500,
        energyCost: 2500,
        waterUtilitiesCost: 350,
        transportLogisticsCost: 800,
        overheadCost: 2400,
        wastagePercentage: 3.8,
        createdAt: '2026-01-14T07:30:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 150, unit: 'kg', unitPrice: 39 },
          { name: 'Unsalted Butter', quantity: 25, unit: 'kg', unitPrice: 430 },
          { name: 'Whole Cow Milk', quantity: 35, unit: 'L', unitPrice: 46 },
          { name: 'Fresh Farm Eggs', quantity: 200, unit: 'units', unitPrice: 7.5 },
          { name: 'Fine Caster Sugar', quantity: 15, unit: 'kg', unitPrice: 45 }
        ]
      },
      {
        id: 'batch_sunrise_05',
        productName: 'Artisan Sourdough Loaf',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 300,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 145,
        packagingCost: 2100,
        labourCost: 4800,
        energyCost: 2700,
        waterUtilitiesCost: 420,
        transportLogisticsCost: 900,
        overheadCost: 2600,
        wastagePercentage: 4.0,
        createdAt: '2026-02-10T09:15:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 170, unit: 'kg', unitPrice: 39 },
          { name: 'Sourdough Starter & Yeast', quantity: 18, unit: 'kg', unitPrice: 92 },
          { name: 'Filtered Water & Salt', quantity: 100, unit: 'kg', unitPrice: 6 }
        ]
      },
      {
        id: 'batch_sunrise_06',
        productName: 'Glazed Cinnamon Rolls',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 350,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 85,
        packagingCost: 2800,
        labourCost: 4800,
        energyCost: 2600,
        waterUtilitiesCost: 300,
        transportLogisticsCost: 900,
        overheadCost: 2500,
        wastagePercentage: 5.2,
        createdAt: '2026-03-08T08:45:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 90, unit: 'kg', unitPrice: 40 },
          { name: 'Unsalted Butter', quantity: 35, unit: 'kg', unitPrice: 435 },
          { name: 'Brown Sugar & Cinnamon', quantity: 25, unit: 'kg', unitPrice: 95 },
          { name: 'Whole Cow Milk', quantity: 30, unit: 'L', unitPrice: 46 },
          { name: 'Cream Cheese Glaze', quantity: 15, unit: 'kg', unitPrice: 280 }
        ]
      },
      {
        id: 'batch_sunrise_07',
        productName: 'French Butter Croissants',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 450,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 95,
        packagingCost: 3600,
        labourCost: 6600,
        energyCost: 3600,
        waterUtilitiesCost: 380,
        transportLogisticsCost: 1100,
        overheadCost: 3200,
        wastagePercentage: 4.8,
        createdAt: '2026-03-24T10:00:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 135, unit: 'kg', unitPrice: 40 },
          { name: 'Unsalted Butter', quantity: 72, unit: 'kg', unitPrice: 435 },
          { name: 'Whole Cow Milk', quantity: 45, unit: 'L', unitPrice: 46 },
          { name: 'Fine Caster Sugar', quantity: 28, unit: 'kg', unitPrice: 45 },
          { name: 'Yeast & Salt', quantity: 6, unit: 'kg', unitPrice: 112 }
        ]
      },
      {
        id: 'batch_sunrise_08',
        productName: 'Multigrain Seeded Bread',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 320,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 130,
        packagingCost: 2400,
        labourCost: 4900,
        energyCost: 2800,
        waterUtilitiesCost: 400,
        transportLogisticsCost: 950,
        overheadCost: 2700,
        wastagePercentage: 4.5,
        createdAt: '2026-04-12T08:15:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 140, unit: 'kg', unitPrice: 40 },
          { name: 'Flax, Pumpkin & Sunflower Seeds', quantity: 30, unit: 'kg', unitPrice: 240 },
          { name: 'Yeast & Molasses', quantity: 12, unit: 'kg', unitPrice: 85 },
          { name: 'Water & Sea Salt', quantity: 90, unit: 'kg', unitPrice: 6 }
        ]
      },
      {
        id: 'batch_sunrise_09',
        productName: 'Belgian Chocolate Fudge Cake (Promotion)',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 180,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 380, // Discounted promotional run - lower margin
        packagingCost: 4200,
        labourCost: 6200,
        energyCost: 3100,
        waterUtilitiesCost: 350,
        transportLogisticsCost: 1300,
        overheadCost: 4200,
        wastagePercentage: 8.2, // Crust baking defect spike
        createdAt: '2026-04-28T09:30:00.000Z',
        ingredients: [
          { name: 'Dark Chocolate Chips (55%)', quantity: 54, unit: 'kg', unitPrice: 660 },
          { name: 'Unsalted Butter', quantity: 36, unit: 'kg', unitPrice: 440 },
          { name: 'Organic Wheat Flour (Maida)', quantity: 48, unit: 'kg', unitPrice: 40 },
          { name: 'Fine Caster Sugar', quantity: 54, unit: 'kg', unitPrice: 46 },
          { name: 'Fresh Farm Eggs', quantity: 360, unit: 'units', unitPrice: 8 }
        ]
      },
      {
        id: 'batch_sunrise_10',
        productName: 'Brioche Burger Buns',
        productCategory: 'Bakery & Confectionery',
        batchQuantity: 700,
        unitOfMeasure: 'units',
        sellingPricePerUnit: 48,
        packagingCost: 3500,
        labourCost: 5000,
        energyCost: 2700,
        waterUtilitiesCost: 380,
        transportLogisticsCost: 900,
        overheadCost: 2500,
        wastagePercentage: 3.5,
        createdAt: '2026-05-15T08:00:00.000Z',
        ingredients: [
          { name: 'Organic Wheat Flour (Maida)', quantity: 175, unit: 'kg', unitPrice: 40 },
          { name: 'Unsalted Butter', quantity: 28, unit: 'kg', unitPrice: 440 },
          { name: 'Whole Cow Milk', quantity: 40, unit: 'L', unitPrice: 47 },
          { name: 'Fresh Farm Eggs', quantity: 240, unit: 'units', unitPrice: 8 },
          { name: 'Fine Caster Sugar', quantity: 18, unit: 'kg', unitPrice: 46 }
        ]
      }
    ],
    suppliers: [
      {
        id: 'sup_bakery_01',
        name: 'Apex Flour Mills',
        materialName: 'Organic Wheat Flour (Maida)',
        unitPrice: 38,
        unitOfMeasure: 'kg',
        leadTimeDays: 3,
        moq: 200,
        transportCostPerUnit: 2.0,
        qualityRating: 4.8,
        reliabilityScorePct: 97
      },
      {
        id: 'sup_bakery_02',
        name: 'Golden Dairy Cooperative',
        materialName: 'Unsalted Butter',
        unitPrice: 420,
        unitOfMeasure: 'kg',
        leadTimeDays: 2,
        moq: 50,
        transportCostPerUnit: 6.5,
        qualityRating: 4.9,
        reliabilityScorePct: 98
      },
      {
        id: 'sup_bakery_03',
        name: 'SweetPure Sugars Ltd',
        materialName: 'Fine Caster Sugar',
        unitPrice: 44,
        unitOfMeasure: 'kg',
        leadTimeDays: 4,
        moq: 150,
        transportCostPerUnit: 1.5,
        qualityRating: 4.6,
        reliabilityScorePct: 94
      },
      {
        id: 'sup_bakery_04',
        name: 'Velvet Cocoa Imports',
        materialName: 'Dark Chocolate Chips (55%)',
        unitPrice: 650,
        unitOfMeasure: 'kg',
        leadTimeDays: 7,
        moq: 25,
        transportCostPerUnit: 12.0,
        qualityRating: 4.9,
        reliabilityScorePct: 92
      }
    ]
  },

  // =========================================================================
  // USER B: GreenJar Foods
  // =========================================================================
  {
    user: {
      id: 'user_demo_greenjar_foods',
      name: 'Rajesh Patel',
      email: 'greenjar.foods@example.com',
      password: 'GreenJar@Demo2026',
      companyName: 'GreenJar Foods',
      category: 'Pickles & Spices',
      createdAt: '2025-11-01T09:00:00.000Z'
    },
    batches: [
      {
        id: 'batch_greenjar_01',
        productName: 'Traditional Raw Mango Pickle',
        productCategory: 'Pickles & Spices',
        batchQuantity: 600,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 210,
        packagingCost: 10500,
        labourCost: 7200,
        energyCost: 2200,
        waterUtilitiesCost: 900,
        transportLogisticsCost: 2800,
        overheadCost: 6000,
        wastagePercentage: 6.5,
        createdAt: '2025-11-10T10:00:00.000Z',
        ingredients: [
          { name: 'Raw Mango (Rajapuri)', quantity: 360, unit: 'kg', unitPrice: 52 },
          { name: 'Cold Pressed Mustard Oil', quantity: 120, unit: 'kg', unitPrice: 165 },
          { name: 'Pickling Salt & Fenugreek', quantity: 75, unit: 'kg', unitPrice: 28 },
          { name: 'Red Chilli & Turmeric Blend', quantity: 45, unit: 'kg', unitPrice: 220 }
        ]
      },
      {
        id: 'batch_greenjar_02',
        productName: 'Spicy Sun-Dried Lemon Pickle',
        productCategory: 'Pickles & Spices',
        batchQuantity: 500,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 195,
        packagingCost: 9000,
        labourCost: 6500,
        energyCost: 1800,
        waterUtilitiesCost: 800,
        transportLogisticsCost: 2200,
        overheadCost: 5500,
        wastagePercentage: 5.8,
        createdAt: '2025-12-05T11:00:00.000Z',
        ingredients: [
          { name: 'Fresh Yellow Lemons', quantity: 320, unit: 'kg', unitPrice: 58 },
          { name: 'Cold Pressed Mustard Oil', quantity: 80, unit: 'kg', unitPrice: 165 },
          { name: 'Rock Salt & Carom Seeds', quantity: 60, unit: 'kg', unitPrice: 32 },
          { name: 'Kashmiri Red Chilli Powder', quantity: 40, unit: 'kg', unitPrice: 240 }
        ]
      },
      {
        id: 'batch_greenjar_03',
        productName: 'Sweet & Sour Tomato Chutney',
        productCategory: 'Preserves & Jams',
        batchQuantity: 800,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 155,
        packagingCost: 13500,
        labourCost: 8500,
        energyCost: 4200,
        waterUtilitiesCost: 1200,
        transportLogisticsCost: 3200,
        overheadCost: 7000,
        wastagePercentage: 7.2,
        createdAt: '2026-01-20T09:30:00.000Z',
        ingredients: [
          { name: 'Ripe Desi Tomatoes', quantity: 520, unit: 'kg', unitPrice: 24 },
          { name: 'Refined Sugar & Jaggery', quantity: 180, unit: 'kg', unitPrice: 44 },
          { name: 'Ginger, Garlic & Vinegar', quantity: 60, unit: 'kg', unitPrice: 85 },
          { name: 'Panch Phoron Spices', quantity: 40, unit: 'kg', unitPrice: 180 }
        ]
      },
      {
        id: 'batch_greenjar_04',
        productName: 'Mixed Winter Vegetable Pickle',
        productCategory: 'Pickles & Spices',
        batchQuantity: 750,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 185,
        packagingCost: 12800,
        labourCost: 8000,
        energyCost: 2400,
        waterUtilitiesCost: 1100,
        transportLogisticsCost: 3000,
        overheadCost: 6500,
        wastagePercentage: 8.5,
        createdAt: '2026-02-18T10:30:00.000Z',
        ingredients: [
          { name: 'Carrots, Turnips & Cauliflower', quantity: 450, unit: 'kg', unitPrice: 30 },
          { name: 'Cold Pressed Mustard Oil', quantity: 150, unit: 'kg', unitPrice: 168 },
          { name: 'Mustard Seed & Spice Blend', quantity: 80, unit: 'kg', unitPrice: 140 },
          { name: 'Salt & Acetic Acid', quantity: 70, unit: 'kg', unitPrice: 25 }
        ]
      },
      {
        id: 'batch_greenjar_05',
        productName: 'Tangy Gooseberry (Amla) Pickle',
        productCategory: 'Pickles & Spices',
        batchQuantity: 450,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 225,
        packagingCost: 8200,
        labourCost: 6200,
        energyCost: 2000,
        waterUtilitiesCost: 850,
        transportLogisticsCost: 2000,
        overheadCost: 5000,
        wastagePercentage: 5.2,
        createdAt: '2026-03-12T09:00:00.000Z',
        ingredients: [
          { name: 'Fresh Desi Amla', quantity: 280, unit: 'kg', unitPrice: 45 },
          { name: 'Cold Pressed Mustard Oil', quantity: 90, unit: 'kg', unitPrice: 170 },
          { name: 'Turmeric, Salt & Asafetida', quantity: 50, unit: 'kg', unitPrice: 80 },
          { name: 'Crushed Red Mustard', quantity: 30, unit: 'kg', unitPrice: 120 }
        ]
      },
      {
        id: 'batch_greenjar_06',
        productName: 'Traditional Raw Mango Pickle (Pre-Season)',
        productCategory: 'Pickles & Spices',
        batchQuantity: 700,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 215,
        packagingCost: 12000,
        labourCost: 8200,
        energyCost: 2400,
        waterUtilitiesCost: 1000,
        transportLogisticsCost: 3100,
        overheadCost: 6800,
        wastagePercentage: 7.0,
        createdAt: '2026-04-05T10:00:00.000Z',
        ingredients: [
          { name: 'Raw Mango (Rajapuri)', quantity: 420, unit: 'kg', unitPrice: 55 },
          { name: 'Cold Pressed Mustard Oil', quantity: 140, unit: 'kg', unitPrice: 170 },
          { name: 'Pickling Salt & Spices', quantity: 90, unit: 'kg', unitPrice: 35 },
          { name: 'Red Chilli & Turmeric Blend', quantity: 50, unit: 'kg', unitPrice: 225 }
        ]
      },
      {
        id: 'batch_greenjar_07',
        productName: 'Spicy Sun-Dried Lemon Pickle',
        productCategory: 'Pickles & Spices',
        batchQuantity: 550,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 200,
        packagingCost: 9800,
        labourCost: 6800,
        energyCost: 1900,
        waterUtilitiesCost: 850,
        transportLogisticsCost: 2400,
        overheadCost: 5800,
        wastagePercentage: 6.0,
        createdAt: '2026-04-25T11:30:00.000Z',
        ingredients: [
          { name: 'Fresh Yellow Lemons', quantity: 350, unit: 'kg', unitPrice: 52 },
          { name: 'Cold Pressed Mustard Oil', quantity: 90, unit: 'kg', unitPrice: 170 },
          { name: 'Rock Salt & Carom Seeds', quantity: 65, unit: 'kg', unitPrice: 34 },
          { name: 'Kashmiri Red Chilli Powder', quantity: 45, unit: 'kg', unitPrice: 245 }
        ]
      },
      {
        id: 'batch_greenjar_08',
        productName: 'Traditional Raw Mango Pickle (Peak Season)',
        productCategory: 'Pickles & Spices',
        batchQuantity: 1000,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 210,
        packagingCost: 16500,
        labourCost: 11000,
        energyCost: 3200,
        waterUtilitiesCost: 1400,
        transportLogisticsCost: 4200,
        overheadCost: 8500,
        wastagePercentage: 5.5,
        createdAt: '2026-05-10T09:00:00.000Z',
        ingredients: [
          { name: 'Raw Mango (Rajapuri)', quantity: 600, unit: 'kg', unitPrice: 44 },
          { name: 'Cold Pressed Mustard Oil', quantity: 200, unit: 'kg', unitPrice: 168 },
          { name: 'Pickling Salt & Fenugreek', quantity: 125, unit: 'kg', unitPrice: 28 },
          { name: 'Red Chilli & Turmeric Blend', quantity: 75, unit: 'kg', unitPrice: 220 }
        ]
      },
      {
        id: 'batch_greenjar_09',
        productName: 'Sweet & Sour Tomato Chutney',
        productCategory: 'Preserves & Jams',
        batchQuantity: 850,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 160,
        packagingCost: 14200,
        labourCost: 8800,
        energyCost: 4400,
        waterUtilitiesCost: 1250,
        transportLogisticsCost: 3400,
        overheadCost: 7200,
        wastagePercentage: 7.0,
        createdAt: '2026-05-28T10:00:00.000Z',
        ingredients: [
          { name: 'Ripe Desi Tomatoes', quantity: 550, unit: 'kg', unitPrice: 22 },
          { name: 'Refined Sugar & Jaggery', quantity: 190, unit: 'kg', unitPrice: 45 },
          { name: 'Ginger, Garlic & Vinegar', quantity: 65, unit: 'kg', unitPrice: 88 },
          { name: 'Panch Phoron Spices', quantity: 45, unit: 'kg', unitPrice: 185 }
        ]
      },
      {
        id: 'batch_greenjar_10',
        productName: 'Traditional Raw Mango Pickle (Late Harvest)',
        productCategory: 'Pickles & Spices',
        batchQuantity: 900,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 210,
        packagingCost: 15000,
        labourCost: 10200,
        energyCost: 3000,
        waterUtilitiesCost: 1300,
        transportLogisticsCost: 3900,
        overheadCost: 8000,
        wastagePercentage: 6.2,
        createdAt: '2026-06-12T09:30:00.000Z',
        ingredients: [
          { name: 'Raw Mango (Rajapuri)', quantity: 540, unit: 'kg', unitPrice: 46 },
          { name: 'Cold Pressed Mustard Oil', quantity: 180, unit: 'kg', unitPrice: 168 },
          { name: 'Pickling Salt & Fenugreek', quantity: 115, unit: 'kg', unitPrice: 29 },
          { name: 'Red Chilli & Turmeric Blend', quantity: 65, unit: 'kg', unitPrice: 220 }
        ]
      }
    ],
    suppliers: [
      {
        id: 'sup_greenjar_01',
        name: 'Saurashtra Mango Groves',
        materialName: 'Raw Mango (Rajapuri)',
        unitPrice: 48,
        unitOfMeasure: 'kg',
        leadTimeDays: 3,
        moq: 500,
        transportCostPerUnit: 3.5,
        qualityRating: 4.8,
        reliabilityScorePct: 95
      },
      {
        id: 'sup_greenjar_02',
        name: 'Kutch Citrus Orchards',
        materialName: 'Fresh Yellow Lemons',
        unitPrice: 55,
        unitOfMeasure: 'kg',
        leadTimeDays: 4,
        moq: 300,
        transportCostPerUnit: 4.0,
        qualityRating: 4.6,
        reliabilityScorePct: 91
      },
      {
        id: 'sup_greenjar_03',
        name: 'Shree Ram Oil Mills',
        materialName: 'Cold Pressed Mustard Oil',
        unitPrice: 165,
        unitOfMeasure: 'kg',
        leadTimeDays: 2,
        moq: 200,
        transportCostPerUnit: 2.5,
        qualityRating: 4.9,
        reliabilityScorePct: 99
      },
      {
        id: 'sup_greenjar_04',
        name: 'Borosil Glass Containers',
        materialName: '500g Glass Jars with Lug Caps',
        unitPrice: 14,
        unitOfMeasure: 'units',
        leadTimeDays: 5,
        moq: 1000,
        transportCostPerUnit: 1.2,
        qualityRating: 4.7,
        reliabilityScorePct: 96
      }
    ]
  },

  // =========================================================================
  // USER C: CrunchCraft Snacks
  // =========================================================================
  {
    user: {
      id: 'user_demo_crunchcraft_snacks',
      name: 'Vikram Singhania',
      email: 'crunchcraft.snacks@example.com',
      password: 'Snacks@Demo2026',
      companyName: 'CrunchCraft Snacks',
      category: 'Snacks & Namkeen',
      createdAt: '2025-09-01T07:00:00.000Z'
    },
    batches: [
      {
        id: 'batch_crunchcraft_01',
        productName: 'Spicy Ratlami Sev',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1200,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 180,
        packagingCost: 12000,
        labourCost: 9500,
        energyCost: 8500,
        waterUtilitiesCost: 1200,
        transportLogisticsCost: 4500,
        overheadCost: 9000,
        wastagePercentage: 4.8,
        createdAt: '2025-09-15T07:00:00.000Z',
        ingredients: [
          { name: 'Premium Gram Flour (Besan)', quantity: 700, unit: 'kg', unitPrice: 72 },
          { name: 'Refined Cottonseed Oil', quantity: 350, unit: 'kg', unitPrice: 120 },
          { name: 'Black Pepper, Clove & Spices', quantity: 90, unit: 'kg', unitPrice: 380 },
          { name: 'Salt & Hing (Asafoetida)', quantity: 60, unit: 'kg', unitPrice: 65 }
        ]
      },
      {
        id: 'batch_crunchcraft_02',
        productName: 'Roasted Spiced Chana',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1000,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 165,
        packagingCost: 9500,
        labourCost: 7500,
        energyCost: 6000,
        waterUtilitiesCost: 900,
        transportLogisticsCost: 3800,
        overheadCost: 8000,
        wastagePercentage: 3.5,
        createdAt: '2025-10-10T08:00:00.000Z',
        ingredients: [
          { name: 'Whole Desi Chickpeas', quantity: 850, unit: 'kg', unitPrice: 68 },
          { name: 'Refined Cottonseed Oil', quantity: 60, unit: 'kg', unitPrice: 120 },
          { name: 'Chaat Masala & Salt', quantity: 50, unit: 'kg', unitPrice: 160 },
          { name: 'Turmeric & Chilli Seasoning', quantity: 40, unit: 'kg', unitPrice: 190 }
        ]
      },
      {
        id: 'batch_crunchcraft_03',
        productName: 'Crispy Salted Potato Wafers',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1500,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 220,
        packagingCost: 18000,
        labourCost: 12500,
        energyCost: 11000,
        waterUtilitiesCost: 1800,
        transportLogisticsCost: 5500,
        overheadCost: 12000,
        wastagePercentage: 6.2,
        createdAt: '2025-11-12T07:30:00.000Z',
        ingredients: [
          { name: 'Processing Grade Potatoes', quantity: 3800, unit: 'kg', unitPrice: 22 },
          { name: 'Refined Cottonseed Oil', quantity: 520, unit: 'kg', unitPrice: 122 },
          { name: 'Fine Iodized Salt', quantity: 40, unit: 'kg', unitPrice: 18 }
        ]
      },
      {
        id: 'batch_crunchcraft_04',
        productName: 'Royal Masala Mixture',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1800,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 195,
        packagingCost: 16500,
        labourCost: 13000,
        energyCost: 10500,
        waterUtilitiesCost: 1500,
        transportLogisticsCost: 5800,
        overheadCost: 13000,
        wastagePercentage: 5.0,
        createdAt: '2025-12-15T08:00:00.000Z',
        ingredients: [
          { name: 'Premium Gram Flour (Besan)', quantity: 700, unit: 'kg', unitPrice: 74 },
          { name: 'Raw Peanuts (Kernels)', quantity: 350, unit: 'kg', unitPrice: 115 },
          { name: 'Pressed Rice (Poha)', quantity: 300, unit: 'kg', unitPrice: 42 },
          { name: 'Refined Cottonseed Oil', quantity: 350, unit: 'kg', unitPrice: 125 },
          { name: 'Curry Leaves, Cashews & Spices', quantity: 100, unit: 'kg', unitPrice: 320 }
        ]
      },
      {
        id: 'batch_crunchcraft_05',
        productName: 'Crispy Salted Potato Wafers (Oil Price Shock)',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1400,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 210, // Fixed price contract while frying oil surged
        packagingCost: 17500,
        labourCost: 12000,
        energyCost: 11000,
        waterUtilitiesCost: 1800,
        transportLogisticsCost: 5400,
        overheadCost: 12000,
        wastagePercentage: 6.8,
        createdAt: '2026-01-18T07:00:00.000Z',
        ingredients: [
          { name: 'Processing Grade Potatoes', quantity: 3600, unit: 'kg', unitPrice: 25 },
          { name: 'Refined Cottonseed Oil', quantity: 500, unit: 'kg', unitPrice: 142 }, // Price spike
          { name: 'Fine Iodized Salt', quantity: 38, unit: 'kg', unitPrice: 18 }
        ]
      },
      {
        id: 'batch_crunchcraft_06',
        productName: 'Spicy Ratlami Sev',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1300,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 185,
        packagingCost: 13000,
        labourCost: 10000,
        energyCost: 9000,
        waterUtilitiesCost: 1300,
        transportLogisticsCost: 4800,
        overheadCost: 9500,
        wastagePercentage: 4.5,
        createdAt: '2026-02-14T08:00:00.000Z',
        ingredients: [
          { name: 'Premium Gram Flour (Besan)', quantity: 760, unit: 'kg', unitPrice: 73 },
          { name: 'Refined Cottonseed Oil', quantity: 370, unit: 'kg', unitPrice: 130 },
          { name: 'Black Pepper, Clove & Spices', quantity: 100, unit: 'kg', unitPrice: 385 },
          { name: 'Salt & Hing (Asafoetida)', quantity: 70, unit: 'kg', unitPrice: 65 }
        ]
      },
      {
        id: 'batch_crunchcraft_07',
        productName: 'Tangy Aloo Bhujia',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1600,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 190,
        packagingCost: 15500,
        labourCost: 12000,
        energyCost: 10200,
        waterUtilitiesCost: 1400,
        transportLogisticsCost: 5200,
        overheadCost: 11500,
        wastagePercentage: 5.2,
        createdAt: '2026-03-05T07:30:00.000Z',
        ingredients: [
          { name: 'Premium Gram Flour (Besan)', quantity: 650, unit: 'kg', unitPrice: 72 },
          { name: 'Boiled Potato Mash Flakes', quantity: 400, unit: 'kg', unitPrice: 48 },
          { name: 'Refined Cottonseed Oil', quantity: 420, unit: 'kg', unitPrice: 126 },
          { name: 'Mint & Amchur Masala', quantity: 130, unit: 'kg', unitPrice: 210 }
        ]
      },
      {
        id: 'batch_crunchcraft_08',
        productName: 'Roasted Spiced Chana',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1100,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 170,
        packagingCost: 10500,
        labourCost: 8000,
        energyCost: 6400,
        waterUtilitiesCost: 950,
        transportLogisticsCost: 4000,
        overheadCost: 8500,
        wastagePercentage: 3.2,
        createdAt: '2026-03-25T08:30:00.000Z',
        ingredients: [
          { name: 'Whole Desi Chickpeas', quantity: 930, unit: 'kg', unitPrice: 66 },
          { name: 'Refined Cottonseed Oil', quantity: 65, unit: 'kg', unitPrice: 125 },
          { name: 'Chaat Masala & Salt', quantity: 55, unit: 'kg', unitPrice: 165 },
          { name: 'Turmeric & Chilli Seasoning', quantity: 45, unit: 'kg', unitPrice: 195 }
        ]
      },
      {
        id: 'batch_crunchcraft_09',
        productName: 'Crispy Salted Potato Wafers',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 1600,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 225,
        packagingCost: 19000,
        labourCost: 13000,
        energyCost: 11500,
        waterUtilitiesCost: 1900,
        transportLogisticsCost: 5800,
        overheadCost: 12500,
        wastagePercentage: 5.5,
        createdAt: '2026-04-10T07:00:00.000Z',
        ingredients: [
          { name: 'Processing Grade Potatoes', quantity: 4000, unit: 'kg', unitPrice: 23 },
          { name: 'Refined Cottonseed Oil', quantity: 540, unit: 'kg', unitPrice: 125 },
          { name: 'Fine Iodized Salt', quantity: 42, unit: 'kg', unitPrice: 18 }
        ]
      },
      {
        id: 'batch_crunchcraft_10',
        productName: 'Royal Masala Mixture',
        productCategory: 'Snacks & Namkeen',
        batchQuantity: 2000,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 200,
        packagingCost: 18000,
        labourCost: 14000,
        energyCost: 11500,
        waterUtilitiesCost: 1600,
        transportLogisticsCost: 6200,
        overheadCost: 14000,
        wastagePercentage: 4.6,
        createdAt: '2026-04-26T08:00:00.000Z',
        ingredients: [
          { name: 'Premium Gram Flour (Besan)', quantity: 780, unit: 'kg', unitPrice: 72 },
          { name: 'Raw Peanuts (Kernels)', quantity: 390, unit: 'kg', unitPrice: 112 },
          { name: 'Pressed Rice (Poha)', quantity: 330, unit: 'kg', unitPrice: 40 },
          { name: 'Refined Cottonseed Oil', quantity: 390, unit: 'kg', unitPrice: 124 },
          { name: 'Curry Leaves, Cashews & Spices', quantity: 110, unit: 'kg', unitPrice: 315 }
        ]
      }
    ],
    suppliers: [
      {
        id: 'sup_snacks_01',
        name: 'Bikaner Agro Pulses',
        materialName: 'Premium Gram Flour (Besan)',
        unitPrice: 72,
        unitOfMeasure: 'kg',
        leadTimeDays: 4,
        moq: 500,
        transportCostPerUnit: 3.0,
        qualityRating: 4.8,
        reliabilityScorePct: 96
      },
      {
        id: 'sup_snacks_02',
        name: 'Malwa Edible Oils Corp',
        materialName: 'Refined Cottonseed Oil',
        unitPrice: 125,
        unitOfMeasure: 'kg',
        leadTimeDays: 3,
        moq: 1000,
        transportCostPerUnit: 4.5,
        qualityRating: 4.7,
        reliabilityScorePct: 94
      },
      {
        id: 'sup_snacks_03',
        name: 'Deesa Cold Storage Farms',
        materialName: 'Processing Grade Potatoes',
        unitPrice: 22,
        unitOfMeasure: 'kg',
        leadTimeDays: 2,
        moq: 2000,
        transportCostPerUnit: 2.2,
        qualityRating: 4.9,
        reliabilityScorePct: 98
      },
      {
        id: 'sup_snacks_04',
        name: 'PolyFlex Pack India',
        materialName: 'Multi-Layer Nitrogen Pouches',
        unitPrice: 2.8,
        unitOfMeasure: 'units',
        leadTimeDays: 6,
        moq: 5000,
        transportCostPerUnit: 0.15,
        qualityRating: 4.8,
        reliabilityScorePct: 97
      }
    ]
  },

  // =========================================================================
  // USER D: Cream & Culture
  // =========================================================================
  {
    user: {
      id: 'user_demo_cream_culture',
      name: 'Neha Kulkarni',
      email: 'cream.culture@example.com',
      password: 'Dairy@Demo2026',
      companyName: 'Cream & Culture',
      category: 'Dairy & Desserts',
      createdAt: '2025-10-01T06:00:00.000Z'
    },
    batches: [
      {
        id: 'batch_cream_01',
        productName: 'Fresh Malai Paneer',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 400,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 360,
        packagingCost: 5500,
        labourCost: 6000,
        energyCost: 4500,
        waterUtilitiesCost: 1800,
        transportLogisticsCost: 2200,
        overheadCost: 5500,
        wastagePercentage: 4.5,
        createdAt: '2025-10-18T06:00:00.000Z',
        ingredients: [
          { name: 'Raw Whole Buffalo Milk (6.5% Fat)', quantity: 1600, unit: 'L', unitPrice: 58 },
          { name: 'Food Grade Citric Acid', quantity: 5, unit: 'kg', unitPrice: 180 }
        ]
      },
      {
        id: 'batch_cream_02',
        productName: 'Artisanal Greek Set Yogurt',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 600,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 220,
        packagingCost: 9000,
        labourCost: 6500,
        energyCost: 5200,
        waterUtilitiesCost: 1600,
        transportLogisticsCost: 2600,
        overheadCost: 6000,
        wastagePercentage: 5.0,
        createdAt: '2025-11-15T06:30:00.000Z',
        ingredients: [
          { name: 'Raw Whole Cow Milk', quantity: 1300, unit: 'L', unitPrice: 44 },
          { name: 'Fresh Dairy Cream (40% Fat)', quantity: 150, unit: 'kg', unitPrice: 280 },
          { name: 'Live Greek Starter Cultures', quantity: 3, unit: 'kg', unitPrice: 1500 }
        ]
      },
      {
        id: 'batch_cream_03',
        productName: 'Rich Kesar Badam Milk',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 400,
        unitOfMeasure: 'L',
        sellingPricePerUnit: 240,
        packagingCost: 6000,
        labourCost: 4500,
        energyCost: 3500,
        waterUtilitiesCost: 800,
        transportLogisticsCost: 1500,
        overheadCost: 4000,
        wastagePercentage: 3.5,
        createdAt: '2025-12-12T07:00:00.000Z',
        ingredients: [
          { name: 'Raw Whole Cow Milk', quantity: 380, unit: 'L', unitPrice: 48 },
          { name: 'Californian Almonds & Kesar', quantity: 30, unit: 'kg', unitPrice: 850 },
          { name: 'Refined Sugar & Cardamom', quantity: 40, unit: 'kg', unitPrice: 55 }
        ]
      },
      {
        id: 'batch_cream_04',
        productName: 'Fresh Malai Paneer',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 450,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 365,
        packagingCost: 6000,
        labourCost: 6500,
        energyCost: 4800,
        waterUtilitiesCost: 1900,
        transportLogisticsCost: 2400,
        overheadCost: 6000,
        wastagePercentage: 4.2,
        createdAt: '2026-01-16T06:00:00.000Z',
        ingredients: [
          { name: 'Raw Whole Buffalo Milk (6.5% Fat)', quantity: 1800, unit: 'L', unitPrice: 59 },
          { name: 'Food Grade Citric Acid', quantity: 6, unit: 'kg', unitPrice: 180 }
        ]
      },
      {
        id: 'batch_cream_05',
        productName: 'Royal Gulab Jamun (Mawa)',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 350,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 290,
        packagingCost: 6800,
        labourCost: 6200,
        energyCost: 4600,
        waterUtilitiesCost: 1400,
        transportLogisticsCost: 2200,
        overheadCost: 5800,
        wastagePercentage: 4.8,
        createdAt: '2026-02-12T07:30:00.000Z',
        ingredients: [
          { name: 'Fresh Mawa (Khoya)', quantity: 160, unit: 'kg', unitPrice: 260 },
          { name: 'Refined Flour & Semolina', quantity: 40, unit: 'kg', unitPrice: 45 },
          { name: 'Refined Sugar Syrup', quantity: 170, unit: 'kg', unitPrice: 44 },
          { name: 'Pure Desi Ghee', quantity: 60, unit: 'kg', unitPrice: 520 }
        ]
      },
      {
        id: 'batch_cream_06',
        productName: 'Cardamom Kesar Shrikhand',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 500,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 260,
        packagingCost: 8500,
        labourCost: 6500,
        energyCost: 4800,
        waterUtilitiesCost: 1500,
        transportLogisticsCost: 2500,
        overheadCost: 6200,
        wastagePercentage: 6.5,
        createdAt: '2026-03-10T06:30:00.000Z',
        ingredients: [
          { name: 'Hung Curd (Chakka)', quantity: 360, unit: 'kg', unitPrice: 160 },
          { name: 'Fine Powdered Sugar', quantity: 160, unit: 'kg', unitPrice: 46 },
          { name: 'Cardamom & Saffron Nut Mix', quantity: 15, unit: 'kg', unitPrice: 880 }
        ]
      },
      {
        id: 'batch_cream_07',
        productName: 'Artisanal Greek Set Yogurt',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 700,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 225,
        packagingCost: 10500,
        labourCost: 7200,
        energyCost: 5600,
        waterUtilitiesCost: 1750,
        transportLogisticsCost: 2900,
        overheadCost: 6500,
        wastagePercentage: 4.8,
        createdAt: '2026-03-28T07:00:00.000Z',
        ingredients: [
          { name: 'Raw Whole Cow Milk', quantity: 1500, unit: 'L', unitPrice: 45 },
          { name: 'Fresh Dairy Cream (40% Fat)', quantity: 175, unit: 'kg', unitPrice: 285 },
          { name: 'Live Greek Starter Cultures', quantity: 3.5, unit: 'kg', unitPrice: 1500 }
        ]
      },
      {
        id: 'batch_cream_08',
        productName: 'Fresh Malai Paneer (Warm Weather Risk)',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 500,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 370,
        packagingCost: 6800,
        labourCost: 7000,
        energyCost: 5200,
        waterUtilitiesCost: 2000,
        transportLogisticsCost: 2600,
        overheadCost: 6500,
        wastagePercentage: 7.8, // Summer curdling yield drop & drainage loss
        createdAt: '2026-04-14T06:00:00.000Z',
        ingredients: [
          { name: 'Raw Whole Buffalo Milk (6.5% Fat)', quantity: 1950, unit: 'L', unitPrice: 60 },
          { name: 'Food Grade Citric Acid', quantity: 7, unit: 'kg', unitPrice: 185 }
        ]
      },
      {
        id: 'batch_cream_09',
        productName: 'Rich Kesar Badam Milk',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 450,
        unitOfMeasure: 'L',
        sellingPricePerUnit: 245,
        packagingCost: 6500,
        labourCost: 4800,
        energyCost: 3600,
        waterUtilitiesCost: 850,
        transportLogisticsCost: 1600,
        overheadCost: 4200,
        wastagePercentage: 3.6,
        createdAt: '2026-04-30T07:30:00.000Z',
        ingredients: [
          { name: 'Raw Whole Cow Milk', quantity: 420, unit: 'L', unitPrice: 49 },
          { name: 'Californian Almonds & Kesar', quantity: 35, unit: 'kg', unitPrice: 860 },
          { name: 'Refined Sugar & Cardamom', quantity: 45, unit: 'kg', unitPrice: 56 }
        ]
      },
      {
        id: 'batch_cream_10',
        productName: 'Fresh Malai Paneer',
        productCategory: 'Dairy & Desserts',
        batchQuantity: 550,
        unitOfMeasure: 'kg',
        sellingPricePerUnit: 375,
        packagingCost: 7400,
        labourCost: 7500,
        energyCost: 5500,
        waterUtilitiesCost: 2100,
        transportLogisticsCost: 2800,
        overheadCost: 7000,
        wastagePercentage: 4.0,
        createdAt: '2026-05-18T06:30:00.000Z',
        ingredients: [
          { name: 'Raw Whole Buffalo Milk (6.5% Fat)', quantity: 2100, unit: 'L', unitPrice: 60 },
          { name: 'Food Grade Citric Acid', quantity: 7.5, unit: 'kg', unitPrice: 185 }
        ]
      }
    ],
    suppliers: [
      {
        id: 'sup_dairy_01',
        name: 'Sahyadri Dairy Federation',
        materialName: 'Raw Whole Buffalo Milk (6.5% Fat)',
        unitPrice: 58,
        unitOfMeasure: 'L',
        leadTimeDays: 1,
        moq: 1000,
        transportCostPerUnit: 2.0,
        qualityRating: 4.9,
        reliabilityScorePct: 98
      },
      {
        id: 'sup_dairy_02',
        name: 'Baramati Milk Products',
        materialName: 'Fresh Dairy Cream (40% Fat)',
        unitPrice: 280,
        unitOfMeasure: 'kg',
        leadTimeDays: 2,
        moq: 100,
        transportCostPerUnit: 5.0,
        qualityRating: 4.8,
        reliabilityScorePct: 95
      },
      {
        id: 'sup_dairy_03',
        name: 'Kashmir Nut Emporium',
        materialName: 'Californian Almonds & Kesar',
        unitPrice: 850,
        unitOfMeasure: 'kg',
        leadTimeDays: 5,
        moq: 20,
        transportCostPerUnit: 15.0,
        qualityRating: 4.9,
        reliabilityScorePct: 93
      },
      {
        id: 'sup_dairy_04',
        name: 'DairySeal Sterile Packs',
        materialName: '500ml Food-Grade Poly Bottles',
        unitPrice: 4.5,
        unitOfMeasure: 'units',
        leadTimeDays: 4,
        moq: 2000,
        transportCostPerUnit: 0.3,
        qualityRating: 4.7,
        reliabilityScorePct: 96
      }
    ]
  }
];

module.exports = { DEMO_BUSINESSES };
