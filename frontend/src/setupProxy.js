const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/salon-app",
    createProxyMiddleware({
      target: "http://localhost:8081",
      changeOrigin: true,
    })
  );
};
