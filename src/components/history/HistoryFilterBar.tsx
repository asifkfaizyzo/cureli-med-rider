// src/components/history/HistoryFilterBar.tsx (do not remove this comment)

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { HistoryStatusFilter } from "../../types/delivery";

interface HistoryFilterBarProps {
  activeStatus: HistoryStatusFilter | "ALL";
  fromDate: Date | null;
  toDate: Date | null;
  onStatusChange: (status: HistoryStatusFilter | "ALL") => void;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  onClearDates: () => void;
}

const STATUS_OPTIONS: { key: HistoryStatusFilter | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "FAILED", label: "Failed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export function HistoryFilterBar({
  activeStatus,
  fromDate,
  toDate,
  onStatusChange,
  onFromDateChange,
  onToDateChange,
  onClearDates,
}: HistoryFilterBarProps) {
  const { colors } = useTheme();
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const formatDate = (d: Date | null) => {
    if (!d) return "Any";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const hasDateFilter = fromDate || toDate;

  return (
    <View style={styles.container}>
      {/* Status Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {STATUS_OPTIONS.map((opt) => {
          const active = activeStatus === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onStatusChange(opt.key)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? colors.brand.primary
                    : colors.background.card,
                  borderColor: active
                    ? colors.brand.primary
                    : colors.border.default,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active ? colors.brand.primaryText : colors.text.secondary,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date Range Row */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[
            styles.dateBtn,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
          onPress={() => setShowFrom(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.brand.primary} />
          <Text style={[styles.dateLabel, { color: colors.text.muted }]}>From:</Text>
          <Text style={[styles.dateValue, { color: colors.text.primary }]}>
            {formatDate(fromDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dateBtn,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
          onPress={() => setShowTo(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.brand.primary} />
          <Text style={[styles.dateLabel, { color: colors.text.muted }]}>To:</Text>
          <Text style={[styles.dateValue, { color: colors.text.primary }]}>
            {formatDate(toDate)}
          </Text>
        </TouchableOpacity>

        {hasDateFilter && (
          <TouchableOpacity
            onPress={onClearDates}
            style={[styles.clearBtn, { backgroundColor: colors.status.errorBg }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={colors.status.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Pickers */}
      {showFrom && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={toDate || new Date()}
          onChange={(_event, selectedDate) => {
            setShowFrom(false);
            if (selectedDate) onFromDateChange(selectedDate);
          }}
        />
      )}
      {showTo && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={fromDate || undefined}
          maximumDate={new Date()}
          onChange={(_event, selectedDate) => {
            setShowTo(false);
            if (selectedDate) onToDateChange(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 12,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  dateValue: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    flex: 1,
  },
  clearBtn: {
    padding: 8,
    borderRadius: 8,
  },
});