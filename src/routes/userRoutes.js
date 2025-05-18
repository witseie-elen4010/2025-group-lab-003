const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
//router.post('/logout', userController.logout);

/*router.get('/profile', userController.authenticateJWT, (req, res) => {
  res.json({ message: 'Protected profile', user: req.user });
});*/

module.exports = router;
