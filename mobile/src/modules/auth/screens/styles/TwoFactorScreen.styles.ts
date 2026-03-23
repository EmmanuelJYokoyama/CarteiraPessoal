// src/modules/auth/screens/styles/TwoFactorScreen.styles.ts
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  phone: {
    fontWeight: '600',
    color: '#1a1a2e',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  timerText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 12,
  },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a2e',
    backgroundColor: '#f9f9f9',
  },
  digitBoxFilled: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendLabel: {
    color: '#777',
    fontSize: 14,
  },
  resendLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#9ca3af',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  backText: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '500',
  },
});
