import express from 'express';
import crypto from 'crypto';
import User from '../../models/user.js'; // Importez votre modèle User
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer'; // Pour l'envoi d'e-mails
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config(); // Chargez les variables d'environnement

const router = express.Router();

// Configuration pour l'envoi d'e-mails (exemple avec Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465, // Utilisez 465 pour SSL ou 587 pour TLS
    secure: true, // true pour 465, false pour 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    debug: true // Activez le débogage pour des logs détaillés
});

// Middleware de validation pour /request-otp
const validateRequestOTP = [
    body('email').isEmail().withMessage('Email must be valid') // Seul l'e-mail est requis
];

// Middleware de validation pour /verify-otp
const validateVerifyOTP = [
    body('email').isEmail().withMessage('Email must be valid'), // Seul l'e-mail est requis
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Middleware de validation pour /reset-password
const validateResetPassword = [
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 8 characters long'),
    body('passwordConfirmation')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        })
        .withMessage('Password confirmation does not match new password')
];

// Route pour générer et envoyer l'OTP par e-mail
router.post('/request-otp', validateRequestOTP, async (req, res) => {
    try {
        const { email } = req.body;

        // Vérifiez si l'utilisateur existe par e-mail
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'No user found with the provided email.' });
        }

        // Générer un OTP (6 chiffres)
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = Date.now() + 600000; // 10 minutes

        // Enregistrer l'OTP et sa date d'expiration dans la base de données
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = otpExpiry;
        await user.save();

        // Envoyer l'OTP par e-mail
        try {
            const mailOptions = {
                to: email,
                from: process.env.EMAIL_USER,
                subject: 'Password Reset Code',
                text: `Your password reset code is: ${otp}. This code expires in 10 minutes.`
            };
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully.');
        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send email.' });
        }

        res.status(200).json({ message: 'A password reset code has been sent to your email.' });
    } catch (error) {
        console.error('Error during OTP request:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route pour vérifier l'OTP
router.post('/verify-otp', validateVerifyOTP, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, otp } = req.body;

        // Vérifiez si l'utilisateur existe avec l'OTP fourni
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() } // Vérifiez que l'OTP n'a pas expiré
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        // Générer un token temporaire pour la réinitialisation du mot de passe
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpires = Date.now() + 3600000; // 1 heure d'expiration
        await user.save();

        // Retournez le token au client
        res.status(200).json({
            message: 'Reset code is valid.',
            resetToken // Envoyez ce token au client
        });
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', validateResetPassword, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array()); // Log validation errors
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { resetToken, newPassword } = req.body;

        // Vérifiez si le token est valide et non expiré
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        // Hachez le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Effacez le token et sa date d'expiration
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpires = undefined;

        // Sauvegardez l'utilisateur
        await user.save();

        res.status(200).json({ message: 'Your password has been reset successfully.' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;