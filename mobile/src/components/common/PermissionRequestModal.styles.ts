import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: '85%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 20,
    maxHeight: 100,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    textAlign: 'justify',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#aaa',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  denyButtonText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  allowButton: {
    backgroundColor: '#2ecc71',
  },
  allowButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoText: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
  },
});
