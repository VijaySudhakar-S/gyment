import type { ThemeConfig } from 'antd';

export const gymentTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2FAE68',
    colorSuccess: '#2FAE68',
    colorWarning: '#B8791C',
    colorError: '#C5432E',
    colorInfo: '#3B6FB0',
    colorTextBase: '#232D27',
    colorBgBase: '#FFFFFF',
    colorBorder: '#E3E8E5',
    colorLink: '#22935A',
    borderRadius: 10,
    fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Table: {
      headerBg: '#FFFFFF',
      headerColor: '#6E7A73',
      borderColor: '#E3E8E5',
      cellPaddingBlock: 11,
      cellPaddingInline: 12,
      fontSize: 13,
      rowHoverBg: '#F6F9F7',
    },
    Button: {
      borderRadius: 9,
      colorPrimary: '#2FAE68',
      colorPrimaryHover: '#22935A',
      colorPrimaryActive: '#1c7849',
      colorText: '#232D27',
      borderColorDisabled: '#E3E8E5',
      defaultBorderColor: '#E3E8E5',
      defaultBg: '#FFFFFF',
      defaultHoverBg: '#F6F9F7',
      defaultHoverBorderColor: '#E3E8E5',
      defaultHoverColor: '#232D27',
    },
    Input: {
      borderRadius: 8,
      colorBorder: '#E3E8E5',
      hoverBorderColor: '#2FAE68',
      activeBorderColor: '#2FAE68',
      colorBgContainer: '#FFFFFF',
    },
    Select: {
      borderRadius: 8,
      colorBorder: '#E3E8E5',
      hoverBorderColor: '#2FAE68',
      activeBorderColor: '#2FAE68',
      colorBgContainer: '#FFFFFF',
    },
    Modal: {
      borderRadiusLG: 14,
      headerBg: '#FFFFFF',
      contentBg: '#FFFFFF',
      titleColor: '#232D27',
      titleFontSize: 16,
    },
    Drawer: {
      colorBgElevated: '#FFFFFF',
    },
    Tabs: {
      colorPrimary: '#2FAE68',
      itemColor: '#6E7A73',
      itemHoverColor: '#232D27',
      itemSelectedColor: '#232D27',
      inkBarColor: '#2FAE68',
    },
    Tag: {
      borderRadiusSM: 99,
    },
    Badge: {
      colorError: '#C5432E',
    },
    Pagination: {
      borderRadius: 8,
      colorPrimary: '#2FAE68',
    },
  },
};
