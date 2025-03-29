'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import { FiUser, FiLock, FiMail, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Resetowanie sesji na początku
  useEffect(() => {
    const pb = new PocketBase('http://192.168.2.9:8080');
    pb.authStore.clear();
    document.cookie = 'pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('pocketbase_auth');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const pb = new PocketBase('http://192.168.2.9:8080');
      await pb.collection('users').authWithPassword(email.trim(), password.trim());
      router.push('/dashboard');
    } catch (err) {
      setError('Nieprawidłowe dane logowania. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Nagłówek karty */}
          <div className="bg-indigo-600 py-6 px-8 text-center">
            <h1 className="text-2xl font-bold text-white">Witaj z powrotem!</h1>
            <p className="text-indigo-100 mt-1">Zaloguj się, aby kontynuować</p>
          </div>

          {/* Formularz */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Pole email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Adres email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="twoj@email.com"
                    required
                  />
                </div>
              </div>

              {/* Pole hasła */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700 block">Hasło</label>
                  <a href="/reset-hasla" className="text-xs text-indigo-600 hover:underline">Zapomniałeś hasła?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Przycisk logowania */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-medium rounded-lg transition-all ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logowanie...
                  </>
                ) : (
                  <>
                    Zaloguj się <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Link do rejestracji */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Nie masz jeszcze konta?{' '}
              <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                Zarejestruj się
              </a>
            </div>
          </div>
        </div>

        {/* Stopka */}
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Twoja Aplikacja. Wszystkie prawa zastrzeżone.
        </div>
      </div>
    </div>
  );
}