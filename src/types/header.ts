export interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
