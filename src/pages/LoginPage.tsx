import React, { useState } from 'react';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import { Shield, KeyRound, LogIn, School, Eye, EyeOff, Lock } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { useToast } from '../hooks/useToast';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!username.trim()) {
      toast('error', 'Please enter your username');
      return;
    }
    if (!password) {
      toast('error', 'Please enter your password');
      return;
    }
    if (loginType === 'student' && !universityCode.trim()) {
      toast('error', 'University code is required for students');
      return;
    }

    setIsLoggingIn(true);

    try {
      const API_URL = '/api';
      let endpoint = '';
      const body: any = { username, password };

      if (loginType === 'student') {
        endpoint = `${API_URL}/auth/login`;
        body.universityCode = universityCode.toUpperCase();
      } else {
        endpoint = `${API_URL}/auth/login`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast('success', 'Login successful! Welcome to CyberKhana');
      onLogin(data.user);
    } catch (err: any) {
      toast('error', err.message || 'Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-zinc-900 min-h-screen">
      <CyberMatrixHero onCTAClick={() => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
          loginForm.scrollIntoView({ behavior: 'smooth' });
        }
      }} />

      <ContainerScroll
        titleComponent={
          <h1 className="text-5xl font-black text-zinc-100 md:text-7xl">
            Enter CyberKhana
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

      <div id="login-form" className="flex items-center justify-center -mt-[25rem] md:-mt-[35rem] pb-20 relative z-10 px-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-800/90 border border-zinc-700/50 rounded-2xl shadow-2xl backdrop-blur-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">
                {loginType === 'admin' ? 'Admin Access' : 'Welcome Back'}
              </h2>
              <p className="text-zinc-400 text-sm">
                {loginType === 'admin'
                  ? 'Enter super admin credentials'
                  : 'Sign in to your student account'}
              </p>
            </div>

            {isLoggingIn ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader />
                <p className="text-zinc-400 mt-4">Authenticating...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Login Type Toggle */}
                <div className="flex gap-2 p-1 bg-zinc-700/50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLoginType('student')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-all ${
                      loginType === 'student'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType('admin')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-all ${
                      loginType === 'admin'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-zinc-500" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* University Code - Only for students */}
                {loginType === 'student' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">University Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <School className="h-5 w-5 text-zinc-500" />
                      </div>
                      <Input
                        type="text"
                        placeholder="e.g., MIT123"
                        value={universityCode}
                        onChange={(e) => setUniversityCode(e.target.value.toUpperCase())}
                        className="pl-10 h-12"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      Contact your instructor if you don't have this code
                    </p>
                  </div>
                )}

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-zinc-500" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  className="mt-6 h-12"
                  isLoading={isLoggingIn}
                  leftIcon={<LogIn className="w-5 h-5" />}
                >
                  Sign In
                </Button>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
                  <p className="text-xs text-zinc-400 text-center">
                    Your credentials are encrypted and secure. By signing in, you agree to our
                    terms of service and privacy policy.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              © 2024 CyberKhana. Premium CTF Platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
