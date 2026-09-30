import { PlanData } from '@/lib/api/superadmin/plans.api';

export interface PlanFormModalProps {
  open: boolean;
  onClose: (didSave?: boolean) => void;
  planToEdit?: PlanData | null;
  onSuccess?: () => void;
}

export interface FeatureEditorModalProps {
  open: boolean;
  onClose: () => void;
  editingPlanKey: string | null;
  onSuccess?: () => void;
}

export interface ChangePlanModalProps {
  open: boolean;
  onClose: () => void;
  gymId: string | null;
  onSuccess?: () => void;
}

import { UserItem } from '@/types/user';

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  userToEdit?: UserItem | null;
  onSuccess?: () => void;
}

export interface AddGymModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface UserDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string | number | null;
  onUserUpdated?: () => void;
}
