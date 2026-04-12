import {
  LayoutDashboard,
  Disc,
  Package,
  Layers3,
  Calculator,
  Settings,
  Shield,
  Bookmark,
  QrCode,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Spools", href: "/spools", icon: Disc },
  { label: "Boxes", href: "/boxes", icon: Package },
  { label: "Prints", href: "/prints", icon: Layers3 },
];

export const toolNavItems: NavItem[] = [
  { label: "Calculator", href: "/calculator", icon: Calculator },
  { label: "Presets", href: "/presets", icon: Bookmark },
  { label: "Labels", href: "/labels", icon: QrCode },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const adminNavItems: NavItem[] = [
  { label: "Admin", href: "/admin", icon: Shield },
];
