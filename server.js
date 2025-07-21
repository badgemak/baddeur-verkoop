require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // ✅ serveert je frontend

const upload = multer({ storage: multer.memoryStorage() });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST route voor offerteformulier
app.post('/submit-offerte', upload.single('foto'), async (req, res) => {
  const { naam, email, telefoon, bericht } = req.body;
  const foto = req.file;

  const mailToYou = {
    from: `"Offerte via website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Nieuwe offerteaanvraag van ${naam}`,
    html: `
      <h3>Nieuwe aanvraag via Badgemak.nl</h3>
      <p><strong>Naam:</strong> ${naam}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Telefoon:</strong> ${telefoon}</p>
      <p><strong>Bericht:</strong><br>${bericht}</p>
    `,
    attachments: foto ? [{
      filename: foto.originalname,
      content: foto.buffer
    }] : []
  };

  const mailToClient = {
    from: `"Badgemak" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bedankt voor je aanvraag bij Badgemak',
    html: `
      <p>Beste ${naam},</p>
      <p>Fijn dat je contact met ons hebt opgenomen. We hebben je bericht goed ontvangen en nemen <strong>binnen 24 uur</strong> contact met je op.</p>
      <p>Met vriendelijke groet,<br>Team Badgemak</p>
    `
  };

  try {
    await transporter.sendMail(mailToYou);
    await transporter.sendMail(mailToClient);
    res.status(200).json({ message: 'Offerte verzonden!' });
  } catch (err) {
    console.error('❌ Mailfout:', err);
    res.status(500).json({ error: 'Fout bij verzenden van e-mails.' });
  }
});

// Fallback: als iemand / of iets anders opent, geef index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server draait op poort ${PORT}`);
});

