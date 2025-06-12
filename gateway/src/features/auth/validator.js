class AuthValidator {
    validateRegister({ username, password }) {
        const errors = [];

        if (!username) {
            errors.push({ field: 'username', message: 'Username cannot be empty.' });
        }

        if (!password) {
            errors.push({ field: 'password', message: 'Password is required.' });
        } else if (password.length < 8) {
            errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
        }

        return errors;
    }

    validateLogin({ username, password }) {
        const errors = [];

        if (!username) {
            errors.push({ field: 'username', message: 'Username is required.' });
        }

        if (!password) {
            errors.push({ field: 'password', message: 'Password is required.' });
        }

        return errors;
    }
}

export const authValidator = new AuthValidator();
