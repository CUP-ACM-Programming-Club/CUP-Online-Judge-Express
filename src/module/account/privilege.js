function isAdministrator (req) {
	return req && req.session && !!req.session.isadmin;
}

module.exports = {
	isAdministrator
};
