/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [
			"www-temp.sf.gov",
			"housing.sfgov.org",
			"sfmohcd.org",
			"media-housing-prod.dev.sf.gov",
			"media.api.sf.gov"
		],
	},
};

module.exports = nextConfig;
