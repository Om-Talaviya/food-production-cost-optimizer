const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    companyName: Joi.string().max(100).optional().allow('')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  batch: Joi.object({
    productName: Joi.string().min(1).max(100).required(),
    productCategory: Joi.string().max(100).optional().allow(''),
    batchQuantity: Joi.number().positive().required(),
    unitOfMeasure: Joi.string().valid('kg', 'g', 'L', 'units', 'packs').required(),
    sellingPricePerUnit: Joi.number().min(0).required(),
    packagingCost: Joi.number().min(0).optional(),
    labourCost: Joi.number().min(0).optional(),
    energyCost: Joi.number().min(0).optional(),
    waterUtilitiesCost: Joi.number().min(0).optional(),
    transportLogisticsCost: Joi.number().min(0).optional(),
    overheadCost: Joi.number().min(0).optional(),
    wastagePercentage: Joi.number().min(0).max(99.9).optional(),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(100).required(),
      quantity: Joi.number().min(0).required(),
      unit: Joi.string().max(20).optional(),
      unitPrice: Joi.number().min(0).required()
    })).min(1).optional()
  }),

  whatIf: Joi.object({
    baseline: Joi.object().required(),
    modifications: Joi.object({
      ingredientPriceChangePct: Joi.number().min(-100).max(1000).optional(),
      wastageDeltaPct: Joi.number().min(-100).max(100).optional(),
      batchSizeScalePct: Joi.number().min(-100).max(1000).optional(),
      packagingCostChangePct: Joi.number().min(-100).max(1000).optional(),
      labourCostChangePct: Joi.number().min(-100).max(1000).optional(),
      energyCostChangePct: Joi.number().min(-100).max(1000).optional(),
      sellingPriceChangePct: Joi.number().min(-100).max(1000).optional()
    }).optional()
  }),

  optimizer: Joi.object({
    batchQuantity: Joi.number().positive(),
    unitOfMeasure: Joi.string(),
    sellingPricePerUnit: Joi.number().min(0),
    packagingCost: Joi.number().min(0),
    labourCost: Joi.number().min(0),
    energyCost: Joi.number().min(0),
    waterUtilitiesCost: Joi.number().min(0),
    transportLogisticsCost: Joi.number().min(0),
    overheadCost: Joi.number().min(0),
    wastagePercentage: Joi.number().min(0).max(99.9),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string(),
      quantity: Joi.number().min(0),
      unit: Joi.string(),
      unitPrice: Joi.number().min(0),
      totalCost: Joi.number().min(0)
    })),
    economics: Joi.object()
  }).or('batchQuantity', 'unitOfMeasure', 'sellingPricePerUnit', 'packagingCost', 'labourCost', 'energyCost', 'waterUtilitiesCost', 'transportLogisticsCost', 'overheadCost', 'wastagePercentage', 'ingredients', 'economics'),

  calculate: Joi.object({
    batchQuantity: Joi.number().positive().required(),
    unitOfMeasure: Joi.string().valid('kg', 'g', 'L', 'units', 'packs').required(),
    sellingPricePerUnit: Joi.number().min(0).required(),
    packagingCost: Joi.number().min(0).optional(),
    labourCost: Joi.number().min(0).optional(),
    energyCost: Joi.number().min(0).optional(),
    waterUtilitiesCost: Joi.number().min(0).optional(),
    transportLogisticsCost: Joi.number().min(0).optional(),
    overheadCost: Joi.number().min(0).optional(),
    wastagePercentage: Joi.number().min(0).max(99.9).optional(),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string().min(1).max(100).required(),
      quantity: Joi.number().min(0).required(),
      unit: Joi.string().max(20).optional(),
      unitPrice: Joi.number().min(0).required()
    })).min(1).required()
  }),

  aiAdvisor: Joi.object({
    question: Joi.string().min(1).max(2000).required(),
    batchData: Joi.object().optional()
  }),

  supplier: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    materialName: Joi.string().min(1).max(100).required(),
    unitPrice: Joi.number().min(0).required(),
    unitOfMeasure: Joi.string().max(20).optional(),
    leadTimeDays: Joi.number().integer().min(0).optional(),
    moq: Joi.number().min(0).optional(),
    transportCostPerUnit: Joi.number().min(0).optional(),
    qualityRating: Joi.number().min(0).max(5).optional(),
    reliabilityScorePct: Joi.number().min(0).max(100).optional()
  })
};

// Validation middleware factory
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message).join('; ');
      return res.status(400).json({ error: 'Validation failed: ' + details });
    }
    next();
  };
}

module.exports = { validate, schemas };