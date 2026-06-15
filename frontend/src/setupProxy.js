const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Only proxy API calls — React dev server serves /salon-app UI itself
  app.use(
    "/salon-app/api",
    createProxyMiddleware({
      target: "http://localhost:8081",
      changeOrigin: true,
    })
  );
};
