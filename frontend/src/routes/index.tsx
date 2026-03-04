import { Route, Routes, HashRouter } from 'react-router-dom';
import ProtectedRoute from './protected.route';
import AuthRoute from './auth.route';
import {
  authenticationRoutePaths,
  //baseRoutePaths,
  protectedRoutePaths,
} from './common/routes';
import AppLayout from '@/layout/app.layout';
import BaseLayout from '@/layout/base.layout';
import NotFound from '@/page/errors/NotFound';
import { AUTH_ROUTES } from './common/routePaths';
import GoogleOAuth from '@/page/auth/GoogleOAuth';

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        {/* Google OAuth Callback - OUTSIDE AuthRoute */}
        <Route
          path={AUTH_ROUTES.GOOGLE_OAUTH_CALLBACK}
          element={<GoogleOAuth />}
        />
        {/* <Route element={<BaseLayout />}>
          {baseRoutePaths.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route> */}

        

        <Route path="/" element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
        </Route>

        {/* Protected Route */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {protectedRoutePaths.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
        </Route>
        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

export default AppRoutes;

