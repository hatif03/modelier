import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Minus,
  Image as ImageIcon,
  Pencil,
  Type,
  Trash2,
  Eraser,
  MessageCircle,
  BringToFront,
  SendToBack,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from "lucide-react";

export const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

export const shapeElements = [
  {
    icon: Square,
    name: "Rectangle",
    value: "rectangle",
  },
  {
    icon: Circle,
    name: "Circle",
    value: "circle",
  },
  {
    icon: Triangle,
    name: "Triangle",
    value: "triangle",
  },
  {
    icon: Minus,
    name: "Line",
    value: "line",
  },
  {
    icon: ImageIcon,
    name: "Image",
    value: "image",
  },
  {
    icon: Pencil,
    name: "Free Drawing",
    value: "freeform",
  },
];

export const navElements = [
  {
    icon: MousePointer2,
    name: "Select",
    value: "select",
  },
  {
    icon: Square,
    name: "Rectangle",
    value: shapeElements,
  },
  {
    icon: Type,
    value: "text",
    name: "Text",
  },
  {
    icon: Trash2,
    value: "delete",
    name: "Delete",
  },
  {
    icon: Eraser,
    value: "reset",
    name: "Clear canvas",
  },
  {
    icon: MessageCircle,
    value: "comments",
    name: "Comments",
  },
];

export const defaultNavElement = {
  icon: MousePointer2,
  name: "Select",
  value: "select",
};

export const directionOptions = [
  { label: "Bring to Front", value: "front", icon: BringToFront },
  { label: "Send to Back", value: "back", icon: SendToBack },
];

export const fontFamilyOptions = [
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Brush Script MT", label: "Brush Script MT" },
];

export const fontSizeOptions = [
  {
    value: "10",
    label: "10",
  },
  {
    value: "12",
    label: "12",
  },
  {
    value: "14",
    label: "14",
  },
  {
    value: "16",
    label: "16",
  },
  {
    value: "18",
    label: "18",
  },
  {
    value: "20",
    label: "20",
  },
  {
    value: "22",
    label: "22",
  },
  {
    value: "24",
    label: "24",
  },
  {
    value: "26",
    label: "26",
  },
  {
    value: "28",
    label: "28",
  },
  {
    value: "30",
    label: "30",
  },
  {
    value: "32",
    label: "32",
  },
  {
    value: "34",
    label: "34",
  },
  {
    value: "36",
    label: "36",
  },
];

export const fontWeightOptions = [
  {
    value: "400",
    label: "Normal",
  },
  {
    value: "500",
    label: "Semibold",
  },
  {
    value: "600",
    label: "Bold",
  },
];

export const alignmentOptions = [
  { value: "left", label: "Align Left", icon: AlignLeft },
  {
    value: "horizontalCenter",
    label: "Align Horizontal Center",
    icon: AlignCenterHorizontal,
  },
  { value: "right", label: "Align Right", icon: AlignRight },
  { value: "top", label: "Align Top", icon: AlignStartVertical },
  {
    value: "verticalCenter",
    label: "Align Vertical Center",
    icon: AlignCenterVertical,
  },
  { value: "bottom", label: "Align Bottom", icon: AlignEndVertical },
];

export const shortcuts = [
  {
    key: "1",
    name: "Chat",
    shortcut: "/",
  },
  {
    key: "2",
    name: "Undo",
    shortcut: "⌘ + Z",
  },
  {
    key: "3",
    name: "Redo",
    shortcut: "⌘ + Y",
  },
  {
    key: "4",
    name: "Reactions",
    shortcut: "E",
  },
];
