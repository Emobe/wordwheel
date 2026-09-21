import { Rng } from '@wordscapes/core';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Phase 1 M2 smoke test: prove Metro resolves packages/core and Rng runs
// under Hermes, before building any real UI on top. Replace once M6+ land.
const smokeTestRng = new Rng('phase-1-m2-smoke-test');
const smokeTestValue = smokeTestRng.int(1000);

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Text>@wordscapes/core loaded on Hermes.</Text>
        <Text>Rng(&apos;phase-1-m2-smoke-test&apos;).int(1000) = {smokeTestValue}</Text>
        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
