import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 64,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  toggleButton: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#f8fafc',
  },
  refreshButtonText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  emptyState: {
    paddingTop: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateDescription: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  errorStack: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
});
