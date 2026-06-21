import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import './app/i18n/i18n';
import { AppRoutes } from './app/routes';

/**
 * Renders the application for a requested URL on the server.
 */
export function render(_url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={_url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
}
