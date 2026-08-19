/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './core/components/Layout.tsx';
import { UnidadesMedidaFeature } from './features/unidades-medida/UnidadesMedidaFeature.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('unidades-medida');

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'unidades-medida' && <UnidadesMedidaFeature />}
    </Layout>
  );
}

