import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#0f0f0f',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#0f0f0f',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    backgroundColor: '#0f0f0f',
    color: '#fff',
  },
  errorMessage: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '500',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cardPickerContainer: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    backgroundColor: '#0f0f0f',
    paddingVertical: 8,
  },
  cardPickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cardPickerItemText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedCardContainer: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  selectedCardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 28,
    marginBottom: 24,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
