import Joi from 'joi';

/**
 * Validates registration data
 */
export const validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
            .required()
            .messages({
                'string.pattern.base': 'Password must contain 1 uppercase, 1 lowercase, 1 number and 1 special character (!@#$%^&*)'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            message: error.details[0].message 
        });
    }
    next();
};

/**
 * Validates monitor data
 */
export const validateMonitor = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        url: Joi.string().uri().required(),
        projectId: Joi.string().optional(),
        frequency: Joi.number().optional(),
        successKeyword: Joi.string().allow(null, "").optional(),
        githubRepo: Joi.object({
            owner: Joi.string().allow(null, "").optional(),
            repo: Joi.string().allow(null, "").optional(),
            branch: Joi.string().allow(null, "").optional()
        }).optional()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            message: `Configuration Error: ${error.details[0].message}` 
        });
    }
    next();
};
