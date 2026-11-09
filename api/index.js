// Vercel serverless entry. Uses the compiled output (apps/api/dist) so the
// @studybuddy/shared package and Prisma Client resolve normally via node_modules.
const app = require("../apps/api/dist/app").default;
module.exports = app;
