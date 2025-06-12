class UrlValidator {
    validateCreate({ longUrl, customShort, expiresInDays }) {
        const errors = [];

        if (!longUrl) {
            errors.push({ field: 'longUrl', message: 'Long URL is required.' });
        } else {
            try {
                new URL(longUrl);
            } catch {
                errors.push({ field: 'longUrl', message: 'Must be a valid URL.' });
            }
        }

        if (!expiresInDays || expiresInDays < 1 || expiresInDays > 30) {
            errors.push({ field: 'expiresInDays', message: 'Expiration must be between 1 and 30 days.' });
        }

        if (customShort && (customShort.length < 3 || customShort.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(customShort))) {
            errors.push({ field: 'customShort', message: 'Custom short code contains invalid characters or is too long.' });
        }

        return errors;
    }
}

export const urlValidator = new UrlValidator();
