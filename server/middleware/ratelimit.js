import  rateLimit from 'express-rate-limit';
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 3, // Limit each IP to 3requests per windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
});
export default limiter;