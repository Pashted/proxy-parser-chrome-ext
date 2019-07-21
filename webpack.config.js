const path = require('path'),
    webpack = require('webpack'),
    Copy = require('copy-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

let plugins = [
        new Copy([
            { from: '../src/html', to: './' },
            { from: '../src/png/icon.png', to: './' },
            { from: '../src/json/manifest.json', to: './' },
        ]),

        new webpack.ProvidePlugin({
            UIkit:          'uikit',
            "window.UIkit": 'uikit'
        }),

        new webpack.ProvidePlugin({
            $:               'jquery',
            jQuery:          'jquery',
            "window.jQuery": 'jquery'
        }),

        new ExtractTextPlugin('template.css'),
    ],
    dev = true;

process.argv.forEach(param => {
    // если webpack запущен с командой --mode production
    if (param === 'production')
        dev = false;
});


module.exports = {
    mode:    dev ? 'development' : 'production',
    // devtool: dev ? 'source-map' : false,

    context: path.resolve('./bundle'),
    entry:   {
        main:  '../src/js/main.js',
        popup: '../src/js/popup.js'
    },
    output:  {
        path:     path.resolve('./bundle'),
        filename: 'scripts/[name].js',
    },
    // resolve:      {
    // alias: {
    //     "./dependencyLibs/inputmask.dependencyLib": "./dependencyLibs/inputmask.dependencyLib.jquery"
    // }
    // },
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             vendors: {
    //                 test:   /[\\/]node_modules[\\/]/,
    //                 name:   'vendors',
    //                 chunks: 'all',
    //             }
    //         }
    //     }
    // },

    plugins,

    module: {
        rules: [
            {
                test:    /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use:     {
                    loader:  "babel-loader",
                    options: {
                        presets: [ "@babel/preset-env" ]
                    }
                }
            },
            {
                test: /\.less$/,
                use:  ExtractTextPlugin.extract({
                    fallback:   'style-loader',
                    publicPath: '/',
                    use:        [
                        { loader: 'css-loader', options: { sourceMap: true } },
                        { loader: 'postcss-loader' },
                        { loader: 'less-loader', options: { sourceMap: true } }
                    ],
                })
            },
            {
                test:    /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader:  "url-loader",
                options: {
                    outputPath: "fonts",
                    name:       "[name].[ext]",
                    mimetype:   "application/font-woff",
                    limit:      8192
                }
            },
            {
                test:    /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader:  "file-loader",
                options: {
                    outputPath: 'fonts',
                    name:       "[name].[ext]",
                    limit:      8192
                }
            },
            {
                test:    /\.(jpe?g|png)$/i,
                loader:  'url-loader',
                options: {
                    outputPath: 'images',
                    name:       "[name].[ext]",
                    limit:      8192
                }

            }
        ]
    }
};
