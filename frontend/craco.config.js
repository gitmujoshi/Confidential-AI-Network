const path = require('path');

const extraSrc = [
  path.resolve(__dirname, '../training'),
  path.resolve(__dirname, '../inference'),
];

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const scope = (webpackConfig.resolve.plugins || []).find(
        (plugin) => plugin.constructor && plugin.constructor.name === 'ModuleScopePlugin'
      );
      if (scope && Array.isArray(scope.appSrcs)) {
        scope.appSrcs.push(...extraSrc);
      }
      webpackConfig.module.rules.forEach((rule) => {
        if (!rule.oneOf) return;
        rule.oneOf.forEach((one) => {
          if (one.loader && String(one.loader).includes('babel-loader') && one.include) {
            one.include = [].concat(one.include, extraSrc);
          }
        });
      });
      return webpackConfig;
    },
  },
};
