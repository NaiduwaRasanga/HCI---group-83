module.exports = function override(config, env) {
  // Disable source map warnings
  config.ignoreWarnings = [
    {
      module: /@mediapipe\/tasks-vision/,
      message: /Failed to parse source map/,
    },
  ];

  // Update webpack dev server configuration
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        return middlewares;
      },
    };
  }

  return config;
}; 