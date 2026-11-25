"use client";

import {
  Sparkles, Truck, RefreshCw, Shield, MessageCircle, Heart, Star, Gift, Leaf, Gem, Crown, Zap,
  Award, Clock, Globe, Lock, Smile, Tag, Package, CreditCard, Phone, Mail, MapPin, Check, Flame,
  Sun, Moon, Scissors, Shirt, Watch, Megaphone, Image as ImageIcon, Columns2, MoveRight, Timer,
  ShoppingBag, LayoutGrid, Images, Camera, Play, Type, List, Users, Minus, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles, truck: Truck, refresh: RefreshCw, shield: Shield, chat: MessageCircle,
  heart: Heart, star: Star, gift: Gift, leaf: Leaf, gem: Gem, crown: Crown, zap: Zap, award: Award,
  clock: Clock, globe: Globe, lock: Lock, smile: Smile, tag: Tag, package: Package,
  creditcard: CreditCard, phone: Phone, mail: Mail, mappin: MapPin, check: Check, flame: Flame,
  sun: Sun, moon: Moon, scissors: Scissors, shirt: Shirt, watch: Watch,
  megaphone: Megaphone, image: ImageIcon, columns: Columns2, "move-right": MoveRight, timer: Timer,
  "shopping-bag": ShoppingBag, "layout-grid": LayoutGrid, images: Images, instagram: Camera,
  play: Play, type: Type, list: List, users: Users, minus: Minus, quote: MessageCircle,
};

export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const Cmp = MAP[name] ?? Sparkles;
  return <Cmp size={size} className={className} strokeWidth={1.8} aria-hidden />;
}

export const ICON_KEYS = Object.keys(MAP);
