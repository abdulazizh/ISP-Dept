import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  variant = 'elevated',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      case 'elevated':
        return {
          backgroundColor: COLORS.surface,
          ...SHADOWS.medium,
        };
      default:
        return {
          backgroundColor: COLORS.surface,
        };
    }
  };

  return (
    <View style={[cardStyles.card, getVariantStyles(), style]}>
      {(title || subtitle) && (
        <View style={cardStyles.header}>
          {title && <Text style={cardStyles.title}>{title}</Text>}
          {subtitle && <Text style={cardStyles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={cardStyles.content}>{children}</View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginVertical: SIZES.base,
  },
  header: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  content: {
    padding: SIZES.padding,
  },
});

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = COLORS.primary,
  style,
}) => {
  return (
    <View style={[statStyles.statCard, { borderRightColor: color }, style]}>
      <View style={statStyles.statHeader}>
        {icon && <View style={statStyles.statIconContainer}>{icon}</View>}
        <Text style={statStyles.statTitle}>{title}</Text>
      </View>
      <Text style={[statStyles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={statStyles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
};

const statStyles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    margin: SIZES.base / 2,
    borderRightWidth: 4,
    ...SHADOWS.light,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SIZES.base,
  },
  statIconContainer: {
    marginLeft: SIZES.base,
  },
  statTitle: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  statValue: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    textAlign: 'right',
  },
  statSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
});

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  icon?: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  valueColor = COLORS.textPrimary,
  icon,
}) => {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.value, { color: valueColor }]}>{value}</Text>
      <View style={infoStyles.labelContainer}>
        {icon}
        <Text style={infoStyles.label}>{label}</Text>
      </View>
    </View>
  );
};

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  label: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  value: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    textAlign: 'left',
  },
});
