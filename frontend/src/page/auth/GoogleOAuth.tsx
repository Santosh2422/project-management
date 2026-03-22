import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/store';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const GoogleOAuth = () => {
  const navigate = useNavigate();
  const { setAccessToekn } = useStore();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const currentWorkspace = searchParams.get('current_workspace');

    if (accessToken) {
      setAccessToekn(accessToken);
      navigate(`/workspace/${currentWorkspace}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, setAccessToekn, searchParams]);
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          Fortimark Project Management
        </Link>
        <div className="flex flex-col gap-6"></div>
      </div>
      <Card>
        <CardContent>
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Authentication Failed</h1>
            <p>We couldn't sign you in with Google. Please try again.</p>
            <Button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuth;

