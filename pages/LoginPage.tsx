import React, { useState } from 'react';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import CyberMatrixHero from '../components/ui/cyber-matrix-hero';
import { Shield, KeyRound, LogIn, School } from 'lucide-react';
import Loader from '../components/ui/Loader';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      let endpoint = '';
      const body: any = { username, password };

      if (loginType === 'student') {
        endpoint = `${API_URL}/auth/login`;
        if (!universityCode) {
          setError('University code is required for students');
          setIsLoggingIn(false);
          return;
        }
        body.universityCode = universityCode;
      } else {
        endpoint = `${API_URL}/auth/login-super-admin`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-zinc-900">
      <CyberMatrixHero onCTAClick={() => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.scrollIntoView({ behavior: 'smooth' });
        }
      }} />

      <ContainerScroll
        titleComponent={
          <h1 className="text-5xl font-black text-zinc-100 md:text-7xl">
            Enter Cyberخانه
          </h1>
        }
      >
        <img
          src="/assets/scroll.png"
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-center"
          draggable={false}
        />
      </ContainerScroll>

      <div id="login-form" className="flex items-center justify-center -mt-[25rem] md:-mt-[35rem] pb-20 relative z-10">
        <div className="w-full max-w-sm p-8 space-y-6 bg-zinc-800/80 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-100">
              {loginType === 'admin' ? 'Admin Login' : 'Student Login'}
            </h2>
            <p className="text-zinc-400 mt-2">
              {loginType === 'admin'
                ? 'Enter super admin credentials (no university code needed).'
                : 'Enter your university credentials to continue.'}
            </p>
          </div>
          {isLoggingIn ? (
            <div className="flex justify-center py-10">
              <Loader />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {loginType === 'student' && (
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="University Code (e.g., MIT123)"
                    value={universityCode}
                    onChange={(e) => setUniversityCode(e.target.value.toUpperCase())}
                    className="pl-10"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button type="submit" className="w-full">
                 Login
                 <LogIn className="w-4 h-4" />
              </Button>
            </form>
          )}
           <div className="text-center space-y-2">
              <div className="flex gap-2 justify-center">
                <Button
                  variant={loginType === 'student' ? 'default' : 'ghost'}
                  onClick={() => setLoginType('student')}
                  className="text-sm"
                >
                  Student
                </Button>
                <Button
                  variant={loginType === 'admin' ? 'default' : 'ghost'}
                  onClick={() => setLoginType('admin')}
                  className="text-sm"
                >
                  Admin
                </Button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;