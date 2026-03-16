import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#ecfeff',
  },
  card: {
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 20,
    lineHeight: 20,
  },
  linkWrapper: {
    marginTop: 18,
    alignSelf: 'center',
  },
  linkText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
  },
});