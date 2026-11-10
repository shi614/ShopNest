// Shared validation rules for user input (the frontend uses the same limits)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64; // bcrypt ignores anything past 72 bytes
const NAME_MIN = 2;
const NAME_MAX = 50;

// Clean up raw input: trim, lowercase email, ignore non-string values
const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const normalizeName = (name) => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');
const asString = (value) => (typeof value === 'string' ? value : '');

const validateEmail = (email) => {
    if (!email) return 'Email is required.';
    if (email.length > 254 || !EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
    return null;
};

const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
    return null;
};

const validateName = (name) => {
    if (!name) return 'Name is required.';
    if (name.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
    if (name.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
    return null;
};

module.exports = {
    normalizeEmail,
    normalizeName,
    asString,
    validateEmail,
    validatePassword,
    validateName,
};
