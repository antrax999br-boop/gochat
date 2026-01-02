import React from 'react';
import { Page, User, NotificationItem } from '../../types';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notifications: NotificationItem[];
  viewedNotifications: string[];
  onNotificationClick: (note: NotificationItem) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  activePage,
  onNavigate,
  onLogout,
  isDarkMode,
  toggleDarkMode,
  notifications,
  viewedNotifications,
  onNotificationClick
}) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          activePage={activePage}
          onNavigate={onNavigate}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          notifications={notifications}
          viewedNotifications={viewedNotifications}
          onNotificationClick={onNotificationClick}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
