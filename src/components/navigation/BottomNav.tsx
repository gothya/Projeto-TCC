import React from "react";

export type Tab = "social" | "home" | "conquistas";

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SocialIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export const BottomNav: React.FC<{
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isBellVisible: boolean;
  onBellClick: () => void;
  bellDisabled: boolean;
}> = ({ activeTab, onTabChange, isBellVisible, onBellClick, bellDisabled }) => {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "social",      label: "Social",      icon: <SocialIcon /> },
    { id: "home",        label: "Início",       icon: <HomeIcon /> },
    { id: "conquistas",  label: "Conquistas",   icon: <TrophyIcon /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Bell flutuante acima da nav — só quando visível */}
      {isBellVisible && (
        <div className="flex justify-center mb-2 pointer-events-none">
          <button
            onClick={onBellClick}
            disabled={bellDisabled}
            className="pointer-events-auto relative flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-400 text-slate-900 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 20px rgba(34,211,238,0.7), 0 0 40px rgba(34,211,238,0.3)" }}
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-30" />
            <BellIcon />
            <span className="text-sm relative z-10">Responder Ping</span>
          </button>
        </div>
      )}

      {/* Nav bar */}
      <nav
        className="flex items-center justify-around px-2 pt-2 pb-safe"
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(34,211,238,0.15)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {tabs.map(({ id, label, icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-1 flex-1 py-1 relative transition-all duration-200"
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-400"
                  style={{ boxShadow: "0 0 8px rgba(34,211,238,0.8)" }}
                />
              )}
              <span className={isActive ? "text-cyan-400" : "text-slate-500"}>
                {icon}
              </span>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? "text-cyan-400" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
