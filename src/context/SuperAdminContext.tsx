'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Gym, GymStatus, SubscriptionStatus, PlanType, BillingCycle } from '@/types/gym';
import { User } from '@/types/user';
import { PlanConfig, FeatureLimits, PlanHistoryItem } from '@/types/plan';
import { SupportTicket } from '@/types/support';
import { AppNotification } from '@/types/notification';
import { ActivityItem } from '@/types/activity';
import { App } from 'antd';
import {
  plansApi,
  PlanData,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '@/lib/api/superadmin/plans.api';
import {
  gymsApi,
  GymData,
  CreateGymRequest,
  UpdateGymRequest,
} from '@/lib/api/superadmin/gyms.api';

interface ConfirmModalState {
  open: boolean;
  title: string;
  body: string;
  actionLabel: string;
  onConfirm: () => void;
  isDanger?: boolean;
}

interface SuperAdminContextType {
  gyms: Gym[];
  gymList: GymData[];
  isGymsLoading: boolean;
  fetchGyms: () => Promise<void>;
  users: User[];
  plans: Record<string, PlanConfig>;
  planList: PlanData[];
  isPlansLoading: boolean;
  fetchPlans: () => Promise<void>;
  createPlan: (data: CreatePlanRequest) => Promise<PlanData | undefined>;
  updatePlan: (id: string, data: UpdatePlanRequest) => Promise<PlanData | undefined>;
  deletePlan: (id: string) => Promise<void>;
  planFeatures: Record<string, Record<string, boolean>>;
  featureLimits: Record<string, FeatureLimits>;
  subHistory: Record<number, PlanHistoryItem[]>;
  supportTickets: SupportTicket[];
  notifications: AppNotification[];
  activity: ActivityItem[];
  unreadNotifCount: number;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  selectedGymId: number | null;
  setSelectedGymId: (id: number | null) => void;
  selectedUserId: number | null;
  setSelectedUserId: (id: number | null) => void;
  userDrawerOpen: boolean;
  setUserDrawerOpen: (open: boolean) => void;
  openUserDrawer: (userId: number) => void;
  closeUserDrawer: () => void;

  addGymModalOpen: boolean;
  setAddGymModalOpen: (open: boolean) => void;
  changePlanModalOpen: boolean;
  setChangePlanModalOpen: (open: boolean) => void;
  featureEditorModalOpen: boolean;
  setFeatureEditorModalOpen: (open: boolean) => void;
  editingPlanKey: string | null;
  setEditingPlanKey: (key: string | null) => void;

  confirmModal: ConfirmModalState;
  openConfirmModal: (params: Omit<ConfirmModalState, 'open'>) => void;
  closeConfirmModal: () => void;

  addGym: (data: CreateGymRequest) => Promise<GymData | undefined>;
  toggleGymStatus: (gymId: number | string) => Promise<void>;
  updateGymPlan: (gymId: number, newPlan: PlanType) => void;
  extendSubscription: (gymId: number) => void;
  cancelSubscription: (gymId: number) => void;
  suspendSubscription: (gymId: number) => void;
  toggleUserStatus: (userId: number) => void;
  togglePlanEnabled: (planKey: string) => Promise<void>;
  savePlanFeatures: (planKey: string, features: Record<string, boolean>, limits: FeatureLimits) => Promise<void>;
  resolveTicket: (ticketId: number) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = App.useApp();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymList, setGymList] = useState<GymData[]>([]);
  const [isGymsLoading, setIsGymsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);

  // Live Plans state loaded directly from the database API
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [planList, setPlanList] = useState<PlanData[]>([]);
  const [planFeatures, setPlanFeatures] = useState<Record<string, Record<string, boolean>>>({});
  const [featureLimits, setFeatureLimits] = useState<Record<string, FeatureLimits>>({});
  const [isPlansLoading, setIsPlansLoading] = useState<boolean>(true);

  const [subHistory, setSubHistory] = useState<Record<number, PlanHistoryItem[]>>({});
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState<boolean>(false);

  const [addGymModalOpen, setAddGymModalOpen] = useState<boolean>(false);
  const [changePlanModalOpen, setChangePlanModalOpen] = useState<boolean>(false);
  const [featureEditorModalOpen, setFeatureEditorModalOpen] = useState<boolean>(false);
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    title: '',
    body: '',
    actionLabel: 'Confirm',
    onConfirm: () => {},
    isDanger: false,
  });

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const openUserDrawer = (userId: number) => {
    setSelectedUserId(userId);
    setUserDrawerOpen(true);
  };

  const closeUserDrawer = () => {
    setUserDrawerOpen(false);
  };

  const openConfirmModal = (params: Omit<ConfirmModalState, 'open'>) => {
    setConfirmModal({
      ...params,
      open: true,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, open: false }));
  };

  // Fetch all gyms dynamically from the database API
  const fetchGyms = useCallback(async () => {
    try {
      setIsGymsLoading(true);
      const res = await gymsApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setGymList(res.data);
        
        // Map to legacy Gym interface for UI compatibility
        const mappedGyms: Gym[] = res.data.map((g, idx) => {
          const planName = g.activeSubscription?.planName || 'Growth';
          const subStatusStr = g.status === 'TRIAL' ? 'Trial' : (g.status === 'ACTIVE' ? 'Active' : 'Suspended');
          const billingCycleStr = g.activeSubscription?.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly';

          return {
            id: idx + 1001,
            name: g.name,
            owner: g.primaryAdmin?.name || g.ownerName || 'Admin Owner',
            email: g.primaryAdmin?.email || g.contactEmail || 'admin@email.com',
            phone: g.primaryAdmin?.phone || g.contactPhone || '+91',
            plan: (planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase()) as PlanType,
            members: 0,
            staff: 0,
            branches: 1,
            subStatus: subStatusStr as SubscriptionStatus,
            gymStatus: subStatusStr as GymStatus,
            joined: new Date(g.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            cycle: billingCycleStr as BillingCycle,
            amount: g.activeSubscription?.price || 0,
            start: new Date(g.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            nextBilling: g.activeSubscription?.renewalDate ? new Date(g.activeSubscription.renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            created: new Date(g.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            lastLogin: 'Active',
            activeMembers: 0,
            trainers: 0,
          };
        });

        if (mappedGyms.length > 0) {
          setGyms(mappedGyms);
        }
      }
    } catch (error: any) {
      console.error('Failed to load gyms:', error?.message);
    } finally {
      setIsGymsLoading(false);
    }
  }, []);

  // Fetch all plans dynamically from the server
  const fetchPlans = useCallback(async () => {
    try {
      setIsPlansLoading(true);
      const res = await plansApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        const plansMap: Record<string, PlanConfig> = {};
        const featuresMap: Record<string, Record<string, boolean>> = {};
        const limitsMap: Record<string, FeatureLimits> = {};

        res.data.forEach((p) => {
          const key = p.name.toLowerCase();
          const maxMembers = p.features?.limits?.["Max Members"] || "Unlimited";
          const maxStaff = p.features?.limits?.["Max Receptionists"] || "Unlimited";
          plansMap[key] = {
            id: p.id,
            name: p.name,
            price: p.monthlyPrice,
            yearly: p.yearlyPrice,
            members: maxMembers.toLowerCase() === 'unlimited' ? 'Unlimited members' : `Up to ${maxMembers} members`,
            staff: maxStaff.toLowerCase() === 'unlimited' ? 'Unlimited staff' : `Up to ${maxStaff} staff`,
            description: p.description,
            enabled: p.isActive,
          };
          featuresMap[key] = p.features?.enabledFeatures || {};
          limitsMap[key] = p.features?.limits || {};
        });

        setPlans(plansMap);
        setPlanList(res.data);
        setPlanFeatures(featuresMap);
        setFeatureLimits(limitsMap);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load plans from server');
    } finally {
      setIsPlansLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchPlans();
    fetchGyms();
  }, [fetchPlans, fetchGyms]);

  const createPlan = async (data: CreatePlanRequest): Promise<PlanData | undefined> => {
    try {
      const res = await plansApi.create(data);
      if (res.status && res.data) {
        message.success(res.message || 'Plan created successfully');
        await fetchPlans();
        return res.data;
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to create plan');
      throw error;
    }
  };

  const updatePlan = async (id: string, data: UpdatePlanRequest): Promise<PlanData | undefined> => {
    try {
      const res = await plansApi.update(id, data);
      if (res.status && res.data) {
        message.success(res.message || 'Plan updated successfully');
        await fetchPlans();
        return res.data;
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to update plan');
      throw error;
    }
  };

  const deletePlan = async (id: string): Promise<void> => {
    try {
      const res = await plansApi.delete(id);
      if (res.status) {
        message.success(res.message || 'Plan deleted successfully');
        await fetchPlans();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to delete plan');
      throw error;
    }
  };

  const addGym = async (data: CreateGymRequest): Promise<GymData | undefined> => {
    try {
      const res = await gymsApi.create(data);
      if (res.status && res.data) {
        message.success(res.message || `Gym "${data.name}" created and tenant schema provisioned successfully`);
        await fetchGyms();
        setAddGymModalOpen(false);
        return res.data;
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to create gym');
      throw error;
    }
  };

  const toggleGymStatus = async (gymId: number | string) => {
    const target = gymList.find(g => g.id === String(gymId));
    if (!target) {
      setGyms(prev => prev.map(g => {
        if (g.id !== gymId) return g;
        const willBeActive = g.gymStatus === 'Suspended' || g.gymStatus === 'Cancelled';
        return { ...g, gymStatus: willBeActive ? 'Active' : 'Suspended', subStatus: willBeActive ? 'Active' : 'Suspended' };
      }));
      return;
    }

    try {
      const res = await gymsApi.toggleStatus(target.id);
      if (res.status) {
        message.success(res.message || 'Gym status updated');
        await fetchGyms();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to update gym status');
    }
  };

  const updateGymPlan = (gymId: number, newPlan: PlanType) => {
    const gym = gyms.find(g => g.id === gymId);
    if (!gym) return;

    const oldPlan = gym.plan;
    const planObj = plans[newPlan.toLowerCase()];
    const newAmount = planObj ? (gym.cycle === 'Yearly' ? planObj.yearly : planObj.price) : gym.amount;

    setGyms(prev => prev.map(g => {
      if (g.id !== gymId) return g;
      return {
        ...g,
        plan: newPlan,
        amount: newAmount
      };
    }));

    setSubHistory(prev => ({
      ...prev,
      [gymId]: [
        ...(prev[gymId] || []),
        { from: oldPlan, to: newPlan, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
      ]
    }));

    message.success("Subscription updated successfully");
    setChangePlanModalOpen(false);
  };

  const extendSubscription = (_gymId: number) => {
    message.success("Subscription extended by 30 days");
  };

  const cancelSubscription = (gymId: number) => {
    setGyms(prev => prev.map(g => {
      if (g.id !== gymId) return g;
      return { ...g, subStatus: 'Cancelled' as SubscriptionStatus };
    }));
    message.success("Subscription updated successfully");
  };

  const suspendSubscription = (gymId: number) => {
    setGyms(prev => prev.map(g => {
      if (g.id !== gymId) return g;
      return { ...g, subStatus: 'Suspended' as SubscriptionStatus };
    }));
    message.success("Subscription updated successfully");
  };

  const toggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
      return { ...u, status: nextStatus };
    }));
    message.success("User account updated");
  };

  const togglePlanEnabled = async (planKey: string) => {
    const current = plans[planKey];
    if (!current || !current.id) return;

    try {
      const res = await plansApi.toggleStatus(current.id);
      if (res.status && res.data) {
        const nextEnabled = res.data.isActive;
        setPlans(prev => ({
          ...prev,
          [planKey]: { ...prev[planKey], enabled: nextEnabled }
        }));
        setPlanList(prev => prev.map(p => p.id === current.id ? res.data : p));
        message.success(`Plan "${res.data.name}" ${nextEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to toggle plan status');
    }
  };

  const savePlanFeatures = async (planKey: string, features: Record<string, boolean>, limits: FeatureLimits) => {
    try {
      const data = await plansApi.updateFeatures({
        planKey,
        features,
        limits,
      });
      if (data.status) {
        setPlanFeatures(prev => ({
          ...prev,
          [planKey]: features
        }));
        setFeatureLimits(prev => ({
          ...prev,
          [planKey]: limits
        }));
        message.success(data.message || "Plan features updated successfully");
        setFeatureEditorModalOpen(false);
      } else {
        message.error(data.message || "Failed to update plan features");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || "Failed to update plan features");
    }
  };

  const resolveTicket = (ticketId: number) => {
    setSupportTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return { ...t, status: 'Resolved' };
    }));
    message.success("Marked as resolved");
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, read: true };
    }));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    message.success("All notifications marked as read");
  };

  return (
    <SuperAdminContext.Provider
      value={{
        gyms,
        gymList,
        isGymsLoading,
        fetchGyms,
        users,
        plans,
        planList,
        isPlansLoading,
        fetchPlans,
        createPlan,
        updatePlan,
        deletePlan,
        planFeatures,
        featureLimits,
        subHistory,
        supportTickets,
        notifications,
        activity,
        unreadNotifCount,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        selectedGymId,
        setSelectedGymId,
        selectedUserId,
        setSelectedUserId,
        userDrawerOpen,
        setUserDrawerOpen,
        openUserDrawer,
        closeUserDrawer,
        addGymModalOpen,
        setAddGymModalOpen,
        changePlanModalOpen,
        setChangePlanModalOpen,
        featureEditorModalOpen,
        setFeatureEditorModalOpen,
        editingPlanKey,
        setEditingPlanKey,
        confirmModal,
        openConfirmModal,
        closeConfirmModal,
        addGym,
        toggleGymStatus,
        updateGymPlan,
        extendSubscription,
        cancelSubscription,
        suspendSubscription,
        toggleUserStatus,
        togglePlanEnabled,
        savePlanFeatures,
        resolveTicket,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};
