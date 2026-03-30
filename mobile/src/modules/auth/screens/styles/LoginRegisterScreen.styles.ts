import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  linkWrapper: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});