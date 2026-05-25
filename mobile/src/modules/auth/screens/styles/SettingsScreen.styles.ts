import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 50,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
  },
  telemetryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  telemetryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryTextBlock: {
    flex: 1,
  },
  telemetryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  telemetryDescription: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
