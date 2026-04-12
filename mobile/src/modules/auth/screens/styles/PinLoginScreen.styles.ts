import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 60,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E90FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  emailInputWrapper: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  emailInputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  emailInputText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  emailInputPlaceholder: {
    color: '#999',
  },
  emailValidIcon: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emailConfirm: {
    fontSize: 14,
    color: '#666',
    marginVertical: 12,
    fontWeight: '500',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 32,
  },
  pinDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFF',
  },
  pinDotFilled: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  pinDotError: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '600',
  },
  lockoutBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFB3B3',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 16,
  },
  lockoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  lockoutTime: {
    fontSize: 12,
    color: '#FF8888',
  },
  hintsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 8,
  },

  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#1E90FF',
  },
  buttonPrimaryPressed: {
    backgroundColor: '#1A7ACC',
    transform: [{scale: 0.98}],
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  buttonSecondaryPressed: {
    backgroundColor: '#F5F5F5',
    transform: [{scale: 0.98}],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLoading: {
    backgroundColor: '#1A7ACC',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 20,
  },
});
