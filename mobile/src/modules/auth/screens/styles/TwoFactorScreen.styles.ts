// src/modules/auth/screens/styles/TwoFactorScreen.styles.ts
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  phone: {
    fontWeight: '600',
    color: '#fff',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  timerText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#e74c3c',
    marginBottom: 12,
  },
  digitBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0f0f0f',
  },
  digitBoxFilled: {
    borderColor: '#fff',
    backgroundColor: '#1a1a1a',
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendLabel: {
    color: '#999',
    fontSize: 14,
  },
  resendLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#666',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
