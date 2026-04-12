import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFF',
  },
  dotFilled: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  dotError: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
});
