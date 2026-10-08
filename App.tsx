import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { NewApplication } from './pages/NewApplication';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { UserManagement } from './pages/UserManagement';
import { Clients } from './pages/Clients';
import { Withdrawals } from './pages/Withdrawals';
import { UserWallet } from './pages/UserWallet';
import { AdminFinance } from './pages/AdminFinance';
import { InstallmentCompanyPortal } from './pages/InstallmentCompanyPortal';
import { CompaniesManagement } from './pages/CompaniesManagement';
import { CropsaSettings } from './pages/CropsaSettings';
import { ClientRequests } from './pages/ClientRequests';
import { ApplicationQuestionsManager } from './pages/ApplicationQuestionsManager';
import { FinancingProgramsManager } from './pages/FinancingProgramsManager';
import { CompanyExcelImport } from './pages/CompanyExcelImport';
import { NotificationTemplatesManager } from './pages/NotificationTemplatesManager';
import { Role } from './types';

const AppContent: React.FC = () => {
  const { currentUser, pendingNavigation, setNavigation } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [portalTab, setPortalTab] = useState<string>('applications');

  const handleNavigate = (page: string) => {
    if (page.startsWith('company-portal:')) {
      const tab = page.split(':')[1];
      setPortalTab(tab);
      setCurrentPage('company-portal');
    } else if (page === 'company-branches') {
      setPortalTab('branches');
      setCurrentPage('company-branches');
    } else if (page === 'company-reports') {
      setPortalTab('reports');
      setCurrentPage('company-reports');
    } else if (page === 'company-database') {
      setPortalTab('database');
      setCurrentPage('company-database');
    } else if (page === 'company-overdue') {
      setPortalTab('overdue');
      setCurrentPage('company-overdue');
    } else if (page === 'company-staff') {
      setPortalTab('staff');
      setCurrentPage('company-staff');
    } else if (page === 'company-ai') {
      setPortalTab('ai');
      setCurrentPage('company-ai');
    } else if (page === 'company-docs') {
      setPortalTab('shared_docs');
      setCurrentPage('company-docs');
    } else if (page === 'company-settings') {
      setPortalTab('settings');
      setCurrentPage('company-settings');
    } else if (page === 'company-dashboard') {
      setPortalTab('overview');
      setCurrentPage('company-dashboard');
    } else if (page === 'company-excel-import') {
      setCurrentPage('company-excel-import');
    } else if (page === 'company-portal' || page === 'company-applications') {
      setPortalTab('applications');
      setCurrentPage('company-portal');
    } else {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    if (pendingNavigation) {
      handleNavigate(pendingNavigation.page);
    }
  }, [pendingNavigation]);

  useEffect(() => {
    if (!currentUser) return;
    const isCompanyUser = currentUser.role === Role.INSTALLMENT_COMPANY || 
                          currentUser.role === Role.BRANCH_MANAGER || 
                          currentUser.role === Role.COMPANY_EMPLOYEE;
    if (isCompanyUser) {
      handleNavigate('company-dashboard');
    } else if (currentUser.role === Role.SALESMAN) {
      handleNavigate('applications');
    } else {
      handleNavigate('dashboard');
    }
  }, [currentUser?.id]);

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.mustChangePassword) {
    return <ChangePassword />;
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': 
        return (currentUser.role === Role.INSTALLMENT_COMPANY || 
                currentUser.role === Role.BRANCH_MANAGER) ? (
          <InstallmentCompanyPortal initialTab="overview" onTabChange={(tab) => setPortalTab(tab)} />
        ) : (currentUser.role === Role.COMPANY_EMPLOYEE) ? (
          <InstallmentCompanyPortal initialTab="applications" onTabChange={(tab) => setPortalTab(tab)} />
        ) : <Dashboard />;
      case 'company-dashboard':
        return (currentUser.role === Role.INSTALLMENT_COMPANY || 
                currentUser.role === Role.BRANCH_MANAGER) ? (
          <InstallmentCompanyPortal initialTab="overview" onTabChange={(tab) => setPortalTab(tab)} />
        ) : (currentUser.role === Role.COMPANY_EMPLOYEE) ? (
          <InstallmentCompanyPortal initialTab="applications" onTabChange={(tab) => setPortalTab(tab)} />
        ) : <Dashboard />;
      case 'company-portal': 
      case 'company-applications':
      case 'company-branches':
      case 'company-reports':
      case 'company-database':
      case 'company-overdue':
      case 'company-staff':
      case 'company-docs':
      case 'company-settings':
        return <InstallmentCompanyPortal 
          initialTab={portalTab as any} 
          onTabChange={(tab) => {
            setPortalTab(tab);
            if (tab === 'overview') {
              setCurrentPage('company-dashboard');
            } else {
              setCurrentPage('company-portal');
            }
          }} 
        />;
      case 'company-ai':
        return (
          currentUser.role === Role.SUPER_ADMIN || 
          currentUser.role === Role.ADMIN || 
          currentUser.role === Role.INSTALLMENT_COMPANY
        ) ? <InstallmentCompanyPortal initialTab="ai" onTabChange={(tab) => setPortalTab(tab)} /> : <Dashboard />;
      case 'company-excel-import':
        return <CompanyExcelImport onBack={() => handleNavigate('company-portal')} />;
      case 'crobsa-settings':
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <CropsaSettings /> : <Dashboard />;
      case 'companies': 
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <CompaniesManagement /> : <Dashboard />;
      case 'application-questions': 
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <FinancingProgramsManager initialTab="QUESTIONS" /> : <Dashboard />;
      case 'financing-programs':
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <FinancingProgramsManager initialTab="PROGRAMS" /> : <Dashboard />;
      case 'notification-templates':
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <NotificationTemplatesManager /> : <Dashboard />;
      case 'client-requests': 
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <ClientRequests /> : <Dashboard />;
      case 'applications': 
        return <Applications />;
      case 'new-application': 
        return <NewApplication onSuccess={() => handleNavigate('applications')} />;
      case 'users': 
        return currentUser.role === Role.SUPER_ADMIN ? <UserManagement /> : <Dashboard />;
      case 'clients': 
        return (
          currentUser.role === Role.SUPER_ADMIN || 
          currentUser.role === Role.ADMIN || 
          currentUser.role === Role.INSTALLMENT_COMPANY ||
          currentUser.role === Role.BRANCH_MANAGER ||
          currentUser.role === Role.COMPANY_EMPLOYEE ||
          currentUser.role === Role.SALESMAN ||
          currentUser.role === Role.SUPPLIER
        ) ? <Clients /> : <Dashboard />;
      case 'withdrawals': 
        return currentUser.role === Role.SUPER_ADMIN ? <Withdrawals /> : <Dashboard />;
      case 'audit-logs': 
        return currentUser.role === Role.SUPER_ADMIN ? <AuditLogs /> : <Dashboard />;
      case 'system-health': 
        return currentUser.role === Role.SUPER_ADMIN ? <SystemHealth /> : <Dashboard />;
      case 'user-wallet': 
        return (currentUser.role === Role.SUPPLIER || currentUser.role === Role.SALESMAN) ? <UserWallet /> : <Dashboard />;
      case 'admin-finance': 
        return (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) ? <AdminFinance /> : <Dashboard />;
      default: 
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} portalTab={portalTab} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
