/**
 * @format
 */
import '@react-native-firebase/app';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import { backgroundNotificationTask } from './src/services/backgroundTasks';

// Registra a tarefa de segundo plano (Headless JS)
AppRegistry.registerHeadlessTask('BackgroundNotification', () => backgroundNotificationTask);

AppRegistry.registerComponent(appName, () => App);