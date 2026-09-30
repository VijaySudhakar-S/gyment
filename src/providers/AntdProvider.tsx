'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { gymentTheme, gymentDarkTheme } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

export const AntdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <AntdRegistry>
      <ConfigProvider theme={theme === 'dark' ? gymentDarkTheme : gymentTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
};

