'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/shared/MotionContainer';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="flex-1 flex flex-col min-w-0"
    >
      {children}
    </motion.div>
  );
}
