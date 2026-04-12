import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  keyPressed: {
    backgroundColor: '#D0D0D0',
    transform: [{scale: 0.95}],
  },
  keyDisabled: {
    opacity: 0.5,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  emptyKey: {
    width: '30%',
    aspectRatio: 1,
  },
  backspaceKey: {
    backgroundColor: '#FF6B6B',
  },
  backspaceKeyText: {
    color: '#FFF',
  },
});
