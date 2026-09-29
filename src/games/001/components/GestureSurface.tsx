import { useEffect, useMemo } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

type Props = {
  enabled: boolean;
  cell: number;
  onStart: (size: number) => void;
  onMove: (dx: number, dy: number, touches: number) => void;
  onEnd: () => void;
  onCancel: () => void;
};
export function GestureSurface({
  enabled,
  cell,
  onStart,
  onMove,
  onEnd,
  onCancel,
}: Props) {
  useEffect(() => () => onCancel(), [enabled, cell, onCancel]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: () => enabled,
        onPanResponderGrant: (event) => {
          if (event.nativeEvent.touches.length === 1) onStart(cell);
          else onCancel();
        },
        onPanResponderStart: (event) => {
          if (event.nativeEvent.touches.length !== 1) onCancel();
        },
        onPanResponderMove: (event, gesture) =>
          onMove(gesture.dx, gesture.dy, event.nativeEvent.touches.length),
        onPanResponderRelease: onEnd,
        onPanResponderTerminate: onCancel,
        onPanResponderTerminationRequest: () => true,
      }),
    [enabled, cell, onStart, onMove, onEnd, onCancel],
  );
  return (
    <View
      testID="gesture-surface"
      pointerEvents={enabled ? "auto" : "none"}
      accessible={false}
      style={StyleSheet.absoluteFill}
      {...responder.panHandlers}
    />
  );
}
