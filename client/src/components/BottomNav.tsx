import { useLocation } from 'wouter';
import { Home, CalendarDays, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'ホーム', icon: Home },
  { path: '/schedule', label: 'スケジュール', icon: CalendarDays },
  { path: '/review', label: '振り返り', icon: BarChart3 },
  { path: '/settings', label: '設定', icon: Settings },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="max-w-[480px] mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 w-8 h-1 rounded-full bg-sunrise-orange"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={isActive ? 'text-sunrise-orange' : 'text-muted-foreground'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-sunrise-orange' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
