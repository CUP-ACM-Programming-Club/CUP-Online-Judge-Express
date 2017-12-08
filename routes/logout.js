const express = require("express");
const router = express.Router();
router.get('/', function (req, res, next) {
    req.session.destroy();
    res.json({
        status: "OK"
    });
});

module.exports = router;