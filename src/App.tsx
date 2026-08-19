/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './core/components/Layout.tsx';
import { UnidadesMedidaFeature } from './features/unidades-medida/UnidadesMedidaFeature.tsx';
import { TiposProdutoFeature } from './features/tipos-produto/TiposProdutoFeature.tsx';
import { TiposInsumoFeature } from './features/tipos-insumo/TiposInsumoFeature.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('tipos-insumo');

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'unidades-medida' && <UnidadesMedidaFeature />}
      {currentView === 'tipos-produto' && <TiposProdutoFeature />}
      {currentView === 'tipos-insumo' && <TiposInsumoFeature />}
    </Layout>
  );
}



