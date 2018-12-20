module.exports = function (ip) {
	const ip_list = ip.split(".");
	if (ip_list.length !== 4) {
		return null;
	}
	if (ip_list[0] !== "10" || ip_list[1] !== "200") {
		return null;
	}
	const ip_pattern1 = parseInt(ip_list[2]);
	const ip_pattern2 = parseInt(ip_list[3]);
	if (isNaN(ip_pattern1) || isNaN(ip_pattern2)) {
		return null;
	}
	if (ip_pattern1 === 25) {
		if (ip_pattern2 >= 101 && ip_pattern2 <= 200) {
			return 403;
		} else {
			return null;
		}
	} else if (ip_pattern1 === 26) {
		if (ip_pattern2 <= 100) {
			return 404;
		} else if (ip_pattern2 >= 101 && ip_pattern2 <= 200) {
			return 405;
		}
	} else if (ip_pattern1 === 28) {
		if (ip_pattern2 <= 80) {
			return 502;
		} else if (ip_pattern2 >= 101 && ip_pattern2 <= 172) {
			return 503;
		}
	}
};