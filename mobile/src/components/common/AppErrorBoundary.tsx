import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {recordError} from '@services/telemetry/firebaseTelemetry';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {hasError: false};

  static getDerivedStateFromError(): State {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    void recordError(error, {
      source: 'error_boundary',
      componentStack: errorInfo.componentStack?.slice(0, 200) ?? '',
    }, true);
  }

  handleRetry = (): void => {
    this.setState({hasError: false});
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0a0a0a'}}>
          <Text style={{color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12}}>
            Something went wrong
          </Text>
          <Text style={{color: '#cbd5e1', fontSize: 15, textAlign: 'center', marginBottom: 20}}>
            The error was captured and sent to telemetry if consent is enabled.
          </Text>
          <Pressable onPress={this.handleRetry} style={{backgroundColor: '#0f766e', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14}}>
            <Text style={{color: '#fff', fontWeight: '700'}}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
