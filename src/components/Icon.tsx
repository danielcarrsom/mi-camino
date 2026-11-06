import {
  House, Utensils, Bus, Users, HeartPulse, Shirt, PartyPopper, CreditCard, KeyRound, Zap, Droplet, Flame, Wifi,
  Smartphone, ShoppingCart, TrainFront, Fuel, Car, CarTaxiFront, Send, School, Baby, Pill, Stethoscope, Scissors,
  WashingMachine, Tv, HandCoins, CircleEllipsis, Hammer, Coins, Wrench, Gift, Wallet, Building2, ShieldCheck,
  GraduationCap, Store, Plane, HeartHandshake, Sprout, Star, ShieldAlert, Landmark, Scale, FileText, Phone, Package, Megaphone, Lightbulb, Check, X, Boxes, CalendarDays, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  house: House, utensils: Utensils, bus: Bus, users: Users, "heart-pulse": HeartPulse, shirt: Shirt,
  "party-popper": PartyPopper, "credit-card": CreditCard, "key-round": KeyRound, zap: Zap, droplet: Droplet,
  flame: Flame, wifi: Wifi, smartphone: Smartphone, "shopping-cart": ShoppingCart, "train-front": TrainFront,
  fuel: Fuel, car: Car, "car-taxi-front": CarTaxiFront, send: Send, school: School, baby: Baby, pill: Pill,
  stethoscope: Stethoscope, scissors: Scissors, "washing-machine": WashingMachine, tv: Tv, "hand-coins": HandCoins,
  "circle-ellipsis": CircleEllipsis, hammer: Hammer, coins: Coins, wrench: Wrench, gift: Gift, wallet: Wallet,
  "building-2": Building2, "shield-check": ShieldCheck, "graduation-cap": GraduationCap, store: Store, plane: Plane,
  "heart-handshake": HeartHandshake, sprout: Sprout, star: Star,
  "shield-alert": ShieldAlert, landmark: Landmark, scale: Scale, "file-text": FileText, phone: Phone, package: Package, megaphone: Megaphone, lightbulb: Lightbulb, check: Check, x: X, boxes: Boxes, "calendar-days": CalendarDays,
};

export function Icon({ name, size = 28, className, strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = MAP[name] ?? Star;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
