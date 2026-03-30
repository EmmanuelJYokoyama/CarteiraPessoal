import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBack: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#0f0f0f',
    marginBottom: 24,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  pinDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  pinDotError: {
    borderColor: '#e74c3c',
    backgroundColor: '#330000',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockoutText: {
    color: '#ff9500',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 24,
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  keyPressed: {
    backgroundColor: '#333',
  },
  keyDisabled: {
    opacity: 0.5,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  keyTextDisabled: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#fff',
  },
  buttonPrimaryPressed: {
    backgroundColor: '#ddd',
  },
  buttonSecondary: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonSecondaryPressed: {
    backgroundColor: '#333',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
