// react-native-gesture-handler must be imported first, before anything else
// touches native modules or navigation.
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
