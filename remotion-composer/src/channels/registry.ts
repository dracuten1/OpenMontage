import type { ChannelTheme } from "../core/theme";
// <channel-registry-imports>
import { kyChuDiemTinTheme } from "./ky-chu-diem-tin/theme";
import { vnMythTheme } from "./vn-myth/theme";
import { kyChuPhapLuatTheme } from "./ky-chu-phap-luat/theme";
// </channel-registry-imports>

export const DEFAULT_CHANNEL_ID = "ky-chu-diem-tin" as const;

export const CHANNELS: Record<string, ChannelTheme> = {
  // <channel-registry-entries>
  "ky-chu-diem-tin": kyChuDiemTinTheme,
  "vn-myth": vnMythTheme,
  "ky-chu-phap-luat": kyChuPhapLuatTheme,
  // </channel-registry-entries>
};

export function listChannelIds(): string[] {
  return Object.keys(CHANNELS);
}

export function getChannelTheme(id?: string): ChannelTheme {
  if (!id) return CHANNELS[DEFAULT_CHANNEL_ID];
  const found = CHANNELS[id];
  if (!found) {
    throw new Error(`Unknown channel theme "${id}". Registered: ${listChannelIds().join(", ")}`);
  }
  return found;
}
