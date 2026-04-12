import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#0f0f0f',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 6,
    fontSize: 12,
  },
});
