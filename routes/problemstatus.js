const express = require("express");
const router = express.Router();

router.get("/:id", (req, res, next) => {
    const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
    if (id && id < 1000) {

    }
    else {

    }
})

router.get("/:source/:id", (req, res, next) => {
    const source = req.params.source === "local";
    const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
    if (id && id < 1000) {

    }
    else {

    }
})

module.exports = ["/problemstatus", auth, router];