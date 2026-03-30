import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
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
  description: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
    lineHeight: 18,
  },
  codeInputWrapper: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 12,
    fontWeight: '600',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#0f0f0f',
    textAlign: 'center',
  },
  codeInputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 6,
  },
  successText: {
    color: '#27ae60',
    fontSize: 12,
    marginTop: 6,
  },
  codeInputFocused: {
    borderColor: '#fff',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  resendText: {
    fontSize: 13,
    color: '#999',
    marginRight: 6,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
});
