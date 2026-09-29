'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { gymentTheme } from '../config/theme';

export const AntdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AntdRegistry>
      <ConfigProvider theme={gymentTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
};
