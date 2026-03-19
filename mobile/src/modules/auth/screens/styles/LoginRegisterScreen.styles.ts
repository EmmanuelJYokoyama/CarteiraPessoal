import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#1d3a6e', // navy da logo
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 13,
    color: '#a5b4c8',
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 20,
  },
  linkWrapper: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#2a9d8f', // teal da logo
    fontSize: 14,
    fontWeight: '600',
  },
});