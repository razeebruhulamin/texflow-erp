import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organization, User, RoleType } from '../types';
import { StorageRepository } from '../services/storage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentOrg: Organization | null;
  currentUser: User;
  organizations: Organization[];
  users: User[];
  currentWarehouseId: string;
  toasts: Toast[];
  isPlatformAdminMode: boolean;
  setWarehouseId: (id: string) => void;
  switchOrganization: (orgId: string) => void;
  switchUser: (userId: string) => void;
  setPlatformAdminMode: (enabled: boolean) => void;
  hasPermission: (allowedRoles: RoleType[]) => boolean;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => void;
  resetAllDemoData: () => void;
  dataVersion: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-trading');
  const [currentUserId, setCurrentUserId] = useState<string>('user-a-owner');
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string>('ALL');
  const [isPlatformAdminMode, setIsPlatformAdminMode] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize storage repository
  useEffect(() => {
    StorageRepository.init();
    loadContextData();
  }, [dataVersion]);

  const loadContextData = () => {
    const orgs = StorageRepository.getOrganizations();
    const allUsers = StorageRepository.getUsers();
    setOrganizations(orgs);
    setUsers(allUsers);
  };

  const currentOrg = isPlatformAdminMode ? null : organizations.find(o => o.id === currentOrgId) || organizations[0] || null;
  const currentUser = users.find(u => u.id === currentUserId) || users[0] || {
    id: 'user-guest',
    organizationId: currentOrgId,
    name: 'Guest User',
    email: 'guest@texflow.com',
    role: 'VIEWER_AUDITOR' as RoleType,
    designation: 'Visitor',
    active: true
  };

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchOrganization = (orgId: string) => {
    setIsPlatformAdminMode(false);
    setCurrentOrgId(orgId);
    setCurrentWarehouseId('ALL');
    // Pick first user belonging to that org
    const orgUsers = users.filter(u => u.organizationId === orgId);
    if (orgUsers.length > 0) {
      setCurrentUserId(orgUsers[0].id);
    }
    const targetOrg = organizations.find(o => o.id === orgId);
    notify(`Switched workspace to: ${targetOrg?.name || 'Organization'}`, 'info');
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      if (user.role === 'PLATFORM_SUPER_ADMIN') {
        setIsPlatformAdminMode(true);
      } else {
        setIsPlatformAdminMode(false);
        if (user.organizationId && user.organizationId !== currentOrgId) {
          setCurrentOrgId(user.organizationId);
        }
      }
      notify(`Logged in as: ${user.name} (${user.role.replace(/_/g, ' ')})`, 'info');
    }
  };

  const setPlatformAdminMode = (enabled: boolean) => {
    setIsPlatformAdminMode(enabled);
    if (enabled) {
      const adminUser = users.find(u => u.role === 'PLATFORM_SUPER_ADMIN');
      if (adminUser) setCurrentUserId(adminUser.id);
      notify('Switched to Platform SaaS Administration area', 'info');
    } else {
      const defaultUser = users.find(u => u.organizationId === currentOrgId);
      if (defaultUser) setCurrentUserId(defaultUser.id);
    }
  };

  const hasPermission = (allowedRoles: RoleType[]): boolean => {
    if (currentUser.role === 'PLATFORM_SUPER_ADMIN') return true;
    if (currentUser.role === 'ORGANIZATION_OWNER') return true;
    return allowedRoles.includes(currentUser.role);
  };

  const resetAllDemoData = () => {
    StorageRepository.resetAll();
    setDataVersion(v => v + 1);
    setCurrentOrgId('org-trading');
    setCurrentUserId('user-a-owner');
    setIsPlatformAdminMode(false);
    notify('Demo data reset to factory initial state successfully!', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentOrg,
        currentUser,
        organizations,
        users,
        currentWarehouseId,
        toasts,
        isPlatformAdminMode,
        setWarehouseId: setCurrentWarehouseId,
        switchOrganization,
        switchUser,
        setPlatformAdminMode,
        hasPermission,
        notify,
        removeToast,
        refreshData,
        resetAllDemoData,
        dataVersion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
