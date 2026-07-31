import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { theme } from '../theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `Error: ${error?.toString()}\n\nComponent Stack:\n${errorInfo?.componentStack}\n\nStack:\n${error?.stack}`;
    
    // For native, we'll use Alert to show the error since Clipboard might not work
    if (typeof errorText === 'string') {
      console.log('Error details:', errorText);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>The app encountered an error</Text>
              
              <View style={styles.errorSection}>
                <Text style={styles.sectionTitle}>Error Message:</Text>
                <Text style={styles.errorText}>{error?.toString()}</Text>
              </View>

              {errorInfo && (
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Component Stack:</Text>
                  <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
                </View>
              )}

              {error?.stack && (
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Stack Trace:</Text>
                  <Text style={styles.stackText}>{error.stack}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.copyButton}
                onPress={this.handleCopyError}
              >
                <Text style={styles.copyButtonText}>Copy Error (Check Console)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reloadButton}
                onPress={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
              >
                <Text style={styles.reloadButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.lg,
  },
  errorSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.alert,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stackText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  copyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reloadButton: {
    backgroundColor: theme.colors.gray[200],
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
