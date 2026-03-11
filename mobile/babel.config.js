module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@modules':    './src/modules',
          '@components': './src/components',
          '@navigation': './src/navigation',
          '@hooks':      './src/hooks',
          '@services':   './src/services',
          '@store':      './src/store',
          '@utils':      './src/utils',
          '@types':      './src/types',
          '@assets':     './src/assets',
        },
      },
    ],
  ],
};