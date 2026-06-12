import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

const SearchBar = React.memo(({ placeholder = 'Search...', value, onChangeText }: SearchBarProps) => (
  <View style={styles.container}>
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={styles.searchbar}
      inputStyle={styles.input}
      elevation={0}
    />
  </View>
));

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 4 },
  searchbar: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  input: { fontSize: 14 },
});

export default SearchBar;
