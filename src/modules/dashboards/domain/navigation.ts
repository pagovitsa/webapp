import type { NavigationCategory } from "./access";

export const navigation: readonly NavigationCategory[] = [
  { id: "category-a", title: "Κατηγορία Α", icon: "folder", permission: "dashboard.read",
    children: [
      { id: "item-a1", title: "Υποκατηγορία Α1", path: "category-a/item-a1", permission: "dashboard.read" },
      { id: "item-a2", title: "Υποκατηγορία Α2", path: "category-a/item-a2", permission: "dashboard.read" },
    ] },
  { id: "category-b", title: "Κατηγορία Β", icon: "settings", permission: "administration.read",
    children: [
      { id: "item-b1", title: "Υποκατηγορία Β1", path: "category-b/item-b1", permission: "administration.read" },
      { id: "item-b2", title: "Υποκατηγορία Β2", path: "category-b/item-b2", permission: "administration.read" },
    ] },
];
