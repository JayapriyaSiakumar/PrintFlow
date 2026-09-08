import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductDesignerPage } from './customizer/ProductDesignerPage';

export const DesignStudioModal: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <ProductDesignerPage
      onClose={() => {
        setActiveView('products');
      }}
    />
  );
};
