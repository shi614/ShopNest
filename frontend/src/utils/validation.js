// Same rules as backend/utils/validators.js (the backend checks again, this is for instant feedback)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;
const NAME_MIN = 2;
const NAME_MAX = 50;

export const validateEmail = (value) => {
    const email = value.trim();
    if (!email) return 'Email is required.';
    if (email.length > 254 || !EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
    return '';
};

export const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
    return '';
};

export const validateName = (value) => {
    const name = value.trim();
    if (!name) return 'Name is required.';
    if (name.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
    if (name.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
    return '';
};
