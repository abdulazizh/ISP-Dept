import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  icon,
  style,
  editable = true,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlign="right"
        />
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.textTertiary}
            style={styles.icon}
          />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.margin,
  },
  label: {
    fontSize: SIZES.body2,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
    textAlign: 'right',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.padding,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.backgroundDark,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.textPrimary,
    paddingVertical: SIZES.base,
    textAlign: 'right',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  icon: {
    marginLeft: SIZES.base,
  },
  eyeIcon: {
    marginLeft: SIZES.base,
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
    textAlign: 'right',
  },
});

// Search Input Component
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'بحث...',
  style,
}) => {
  return (
    <View style={[searchStyles.container, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={COLORS.textTertiary}
        style={searchStyles.icon}
      />
      <TextInput
        style={searchStyles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={onChangeText}
        textAlign="right"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons
            name="close-circle-outline"
            size={20}
            color={COLORS.textTertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.padding,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginHorizontal: SIZES.base,
  },
  icon: {
    marginLeft: SIZES.base,
  },
});
