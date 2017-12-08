module.exports = (req, res, next) => {
    if (false && !req.session.auth) {
        return res.json({
            status: "error",
            statement: "not login"
        })
    }
    else
        return next();
};