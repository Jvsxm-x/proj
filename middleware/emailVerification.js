const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email password
    }
});

exports.sendVerificationEmail = async (user) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Vérification de votre compte",
        html: `<p>Bonjour ${user.nom},</p>
               <p>Veuillez vérifier votre adresse e-mail en cliquant sur le lien ci-dessous :</p>
               <a href="${verificationLink}">Vérifier mon e-mail</a>`
    };

    await transporter.sendMail(mailOptions);
};
