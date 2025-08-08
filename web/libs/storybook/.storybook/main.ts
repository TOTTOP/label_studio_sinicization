import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  core: { builder: "@storybook/builder-webpack5" },

  stories: ["../../../libs/**/*.@(mdx|stories.@(js|jsx|ts|tsx))", "../../../apps/**/*.@(mdx|stories.@(js|jsx|ts|tsx))"],

  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@nx/react/plugins/storybook",
    "@chromatic-com/storybook",
    "../addons/theme-toggle/register",
  ],

  webpackFinal(config) {
    const rules = config.module?.rules ?? [];

    for (const rule of rules) {
      if (!rule || typeof rule === "string") continue;

      const testString = rule.test?.toString() ?? "";
      const isCss = testString.includes("\\.css");

      if (isCss) {
        rule.exclude = /tailwind\.css/;
      }
    }
    return {
      ...config,
      module: {
        ...(config.module ?? {}),
        rules: [
          {
            test: /tailwind\.css/,
            exclude: /node_modules/,
            use: [
              "style-loader",
              {
                loader: "css-loader",
                options: {
                  importLoaders: 1,
                },
              },
              "postcss-loader",
            ],
          },

          ...(config.module?.rules ?? []),
        ],
      },
    };
  },

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {},

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs
