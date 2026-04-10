import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  grantedPermissionItem: {
    borderColor: 'rgba(15, 118, 110, 0.3)',
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginRight: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#999',
  },
  permissionRight: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantedBadge: {
    backgroundColor: 'rgba(15, 118, 110, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.4)',
  },
  grantedText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  reloadButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  reloadButtonText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
