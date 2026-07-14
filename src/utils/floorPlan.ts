import type { HouseLayout, RoomLayout } from '../types';

export const ROOM_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export function getLayoutDimensions(layout: HouseLayout) {
  const width = layout.buildingWidth || Math.max(...layout.rooms.map((r) => r.x + r.width), 6);
  const length = layout.buildingLength || Math.max(...layout.rooms.map((r) => r.y + r.length), 8);
  return { width, length };
}

export function getRoomColor(index: number) {
  return ROOM_COLORS[index % ROOM_COLORS.length];
}

export function layoutFromRooms(rooms: RoomLayout[]) {
  const width = Math.max(...rooms.map((room) => room.x + room.width), 1);
  const length = Math.max(...rooms.map((room) => room.y + room.length), 1);
  return { width, length };
}
