function validateFields(requiredFields) {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        errors.push({ field, message: `${field} is required.` });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

module.exports = validateFields;
