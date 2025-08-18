module.exports = {
	extends: ["@commitlint/config-conventional"],
	ignores: [() => true], // TEMP: ignore all commits for initial release
};