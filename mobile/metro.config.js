const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	resolver: {
		extraNodeModules: {
			'react-native-gesture-handler': path.resolve(
				__dirname,
				'node_modules/react-native-gesture-handler/lib/commonjs',
			),
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
