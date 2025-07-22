const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.tsx",
    background: "./src/background.ts",
    options: "./src/options.tsx",
    sidepanel: "./src/sidepanel.tsx",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: { noEmit: false },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        exclude: /node_modules/,
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "../manifest.json" },
        { from: "public", to: "../public" },
      ],
    }),
    new HTMLPlugin({
      title: "Aave Monitor",
      filename: "index.html",
      chunks: ["index"],
    }),
    new HTMLPlugin({
      title: "Aave Monitor Options",
      filename: "options.html",
      chunks: ["options"],
    }),
    new HTMLPlugin({
      title: "Aave Monitor Side Panel",
      filename: "sidepanel.html",
      template: "./public/sidepanel.html",
      chunks: ["sidepanel"],
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path:
      process.env.NODE_ENV === "firefox"
        ? path.join(__dirname, "firefox_dist/js")
        : path.join(__dirname, "dist/js"),
    filename: "[name].js",
  },
};
