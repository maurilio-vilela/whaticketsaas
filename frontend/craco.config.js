const path = require('path');

module.exports = {
  style: {
    postcss: {
      plugins: [require("@tailwindcss/postcss"), require("autoprefixer")],
    },
  },
  webpack: {
    configure: (webpackConfig, { env }) => {
      // Configurações de resolução (seu código atual)
      webpackConfig.resolve.fallback = {
        path: require.resolve('path-browserify'),
      };

      // Habilitar cache persistente para rebuilds incrementais
      webpackConfig.cache = {
        type: 'filesystem', // Usa o sistema de arquivos para cache
        cacheDirectory: path.resolve(__dirname, '.webpack_cache'), // Diretório para armazenar o cache
        buildDependencies: {
          config: [__filename], // Rebuild se o config mudar
        },
      };

      // Ajustes para produção
      if (env === 'production') {
        webpackConfig.mode = 'production';
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true, // Minificar em produção
          splitChunks: {
            chunks: 'all', // Otimizar divisão de chunks
          },
        };
      }
     

      return webpackConfig;
    },
  },
};