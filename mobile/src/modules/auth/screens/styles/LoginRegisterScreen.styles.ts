import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#F3F3F4',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#666666',
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