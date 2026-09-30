export const LOGIN = {
  SUCCESS: {
    LOGIN_SUCCESSFULLY: "SuperAdmin logged in successfully.",
    RESET_PASSWORD_LINK:
      "We've emailed you a password change link to your registered email address. You should receive it shortly.",
    REFRESH_TOKEN: "Refresh token received successfully.",
    USER_DETAILES: "User details fetched successfully.",
    RESET_PASSWORD: "Password reset successfully.",
    RESET_PASSWORD_TOKEN_VALID:
      "Password reset token is valid. Please reset your password.",
    PUBLIC_KEY_PATH: "Public key fetched successfully.",
  },
  ERROR: {
    CREDENTIALS: "Please provide an email and password.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    INVALID_EMAIL: "Invalid email. The email is not registered.",
    INVALID_USERNAME:
      "Credentials which you entered do not match with our records.",
    INVALID_PASSWORD: "Invalid password.",
    USER_NOT_FOUND: "User not found.",
    ACCOUNT_INACTIVE: "Your account is deactivated. Please contact support.",
    LOGIN_FAILED: "Login failed.",
    INVALID_REFRESH_TOKEN: "Invalid refresh token. Please try again.",
    PASSWORD_MISMATCH:
      "New password and confirm password mismatch. Please try again.",
  },
};

export const ADMIN_USER_DETAILES = {
  SUCCESS: {
    USER_DETAILES: "Admin details fetched successfully.",
    USER_CREATED: "Admin created successfully.",
    USER_UPDATED: "Admin updated successfully.",
    USER_DELETED: "Admin deleted successfully.",
  },
  ERROR: {
    MOBILE_ALREADY_EXISTS: "Mobile number already registered.",
    EMAIL_ALREADY_EXISTS: "Email already registered.",
    USER_NOT_FOUND: "Admin not found.",
    USER_EXISTS: "Admin already exists.",
  },
};

export const LOGOUT = {
  SUCCESS: {
    LOGOUT_SUCCESSFUL: "Logout successful.",
  },
  ERROR: {
    LOGOUT_FAILED: "Logout failed.",
  },
};

export const GYM_TENANT = {
  SUCCESS: {
    LISTED: "Gyms listed successfully.",
    FETCHED: "Gym details fetched successfully.",
    CREATED: "Gym created and tenant schema provisioned successfully.",
    UPDATED: "Gym updated successfully.",
    DELETED: "Gym marked as deleted successfully.",
  },
  ERROR: {
    NOT_FOUND: "Gym not found.",
    CODE_EXISTS: "A gym with this code already exists.",
    SCHEMA_EXISTS: "A gym with this schema name already exists.",
    EMAIL_EXISTS: "A gym with this contact email already exists.",
    PROVISIONING_FAILED: "Failed to provision database schema for this gym.",
  },
};

export const PLAN = {
  SUCCESS: {
    LISTED: "Plans retrieved successfully.",
    FETCHED: "Plan retrieved successfully.",
    CREATED: "Plan created successfully.",
    UPDATED: "Plan updated successfully.",
    DELETED: "Plan deleted successfully.",
    FEATURES_UPDATED: "Plan features updated successfully.",
    STATUS_TOGGLED: "Plan status updated successfully.",
  },
  ERROR: {
    NOT_FOUND: "Plan not found.",
    NAME_EXISTS: "A plan with this name already exists.",
    HAS_ACTIVE_SUBSCRIPTIONS: "Cannot delete plan because active gym subscriptions are associated with it.",
    INVALID_PAYLOAD: "Invalid plan payload provided.",
    DELETE_FAILED: "Failed to delete plan.",
  },
};

export const USER_MANAGEMENT = {
  SUCCESS: {
    LISTED: "Users listed successfully.",
    FETCHED: "User details fetched successfully.",
    CREATED: "User account created successfully.",
    UPDATED: "User account updated successfully.",
    STATUS_TOGGLED: "User account status updated successfully.",
    DELETED: "User account deleted successfully.",
  },
  ERROR: {
    NOT_FOUND: "User not found.",
    EMAIL_EXISTS: "A user with this email address already exists.",
    PHONE_EXISTS: "A user with this phone number already exists.",
    GYM_REQUIRED: "Gym selection is required for Gym Users.",
    ROLE_REQUIRED: "Role selection is required for Gym Users.",
    INVALID_TYPE: "Invalid user account category specified.",
  },
};

export const SUBSCRIPTION = {
  SUCCESS: {
    LISTED: "Gym subscriptions retrieved successfully.",
    FETCHED: "Subscription details retrieved successfully.",
    UPDATED: "Subscription updated successfully.",
    EXTENDED: "Subscription extended successfully.",
    STATUS_CHANGED: "Subscription status updated successfully.",
    PLAN_CHANGED: "Gym plan changed successfully.",
  },
  ERROR: {
    NOT_FOUND: "Subscription not found.",
    GYM_NOT_FOUND: "Gym not found.",
    PLAN_NOT_FOUND: "Plan not found.",
    UPDATE_FAILED: "Failed to update subscription.",
  },
};

export const REVENUE = {
  SUCCESS: {
    FETCHED: "Revenue statistics retrieved successfully.",
  },
  ERROR: {
    FETCH_FAILED: "Failed to retrieve revenue statistics.",
  },
};

export const REPORTS = {
  SUCCESS: {
    FETCHED: "Platform reports retrieved successfully.",
    EXPORTED: "Report export generated successfully.",
  },
  ERROR: {
    FETCH_FAILED: "Failed to retrieve platform reports.",
    EXPORT_FAILED: "Failed to generate report export.",
  },
};

export const SETTINGS = {
  SUCCESS: {
    FETCHED: "Platform settings retrieved successfully.",
    UPDATED: "Platform settings saved successfully.",
    PROFILE_UPDATED: "SuperAdmin profile updated successfully.",
  },
  ERROR: {
    FETCH_FAILED: "Failed to retrieve platform settings.",
    UPDATE_FAILED: "Failed to update platform settings.",
  },
};

export const SUPPORT = {
  SUCCESS: {
    LISTED: "Support tickets retrieved successfully.",
    FETCHED: "Support ticket details retrieved successfully.",
    CREATED: "Support ticket logged successfully.",
    RESOLVED: "Support ticket marked as resolved.",
  },
  ERROR: {
    NOT_FOUND: "Support ticket not found.",
    CREATE_FAILED: "Failed to create support ticket.",
  },
};

export const NOTIFICATIONS = {
  SUCCESS: {
    LISTED: "Notifications retrieved successfully.",
    MARKED_READ: "Notification marked as read.",
    ALL_MARKED_READ: "All notifications marked as read.",
  },
  ERROR: {
    NOT_FOUND: "Notification not found.",
    FETCH_FAILED: "Failed to fetch notifications.",
  },
};

export const DASHBOARD = {
  SUCCESS: {
    FETCHED: "Dashboard overview metrics retrieved successfully.",
  },
  ERROR: {
    FETCH_FAILED: "Failed to retrieve dashboard overview.",
  },
};

