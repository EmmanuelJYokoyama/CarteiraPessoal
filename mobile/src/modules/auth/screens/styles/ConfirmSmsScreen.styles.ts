import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#1d3a6e',
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
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 18,
  },
  codeInputWrapper: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 13,
    color: '#0f172a',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  codeInputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 6,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 6,
  },
  codeInputFocused: {
    borderColor: '#0f766e',
  },
  linkWrapper: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#2a9d8f',
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
    borderTopColor: '#e2e8f0',
  },
  resendText: {
    fontSize: 13,
    color: '#475569',
    marginRight: 6,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendButtonText: {
    fontSize: 13,
    color: '#2a9d8f',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
});
