import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statusLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  sliderContainer: {
    marginVertical: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  percentageDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  percentageAlertAmount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  presetButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  checkButton: {
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  saveButton: {
    backgroundColor: '#2ed573',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  helpSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 8,
  },
});
