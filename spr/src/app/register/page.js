'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import { FiUser, FiLock, FiMail, FiArrowRight, FiBook, FiChevronDown } from 'react-icons/fi';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    imie: '',
    nazwisko: ''
  });
  const [bookGenres, setBookGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreSelectOpen, setIsGenreSelectOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenresLoading, setIsGenresLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const pb = new PocketBase('http://192.168.2.9:8080');
        const genres = await pb.collection('gatunki').getFullList({
          sort: 'nazwa',
        });
        setBookGenres(genres.map(genre => genre.nazwa));
        setIsGenresLoading(false);
      } catch (err) {
        console.error('Error fetching genres:', err);
        setError('Nie udało się załadować listy gatunków');
        setIsGenresLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreChange = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const toggleGenreSelect = () => {
    setIsGenreSelectOpen(!isGenreSelectOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.passwordConfirm) {
      setError('Hasła nie są identyczne');
      return;
    }
    if (formData.password.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków');
      return;
    }

    setIsLoading(true);

    try {
      const pb = new PocketBase('http://192.168.2.9:8080');

      // Register in "users" collection
      await pb.collection('users').create({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        emailVisibility: true,
        imie: formData.imie,
        nazwisko: formData.nazwisko,
        gatunek: selectedGenres.join(', '),
        rola: 'user' // Automatyczne ustawienie roli na 'user'
      });

      // Auto-login after registration
      await pb.collection('users').authWithPassword(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Wystąpił problem podczas rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-indigo-600 py-6 px-8 text-center">
            <h1 className="text-2xl font-bold text-white">Dołącz do nas!</h1>
            <p className="text-indigo-100 mt-1">Stwórz nowe konto</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Imię</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.imie}
                      onChange={(e) => setFormData({...formData, imie: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Jan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Nazwisko</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.nazwisko}
                      onChange={(e) => setFormData({...formData, nazwisko: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Kowalski"
                    />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Nazwa użytkownika</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="jan_kowalski"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="twoj@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Hasło</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength="8"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Potwierdź hasło</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Favorite Genres - Dropdown Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Ulubione gatunki</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleGenreSelect}
                    disabled={isGenresLoading}
                    className={`w-full flex justify-between items-center pl-3 pr-4 py-2 text-left border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      isGenresLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      <FiBook className="text-gray-400 mr-2" />
                      {isGenresLoading ? 'Ładowanie gatunków...' : 
                       selectedGenres.length > 0 
                        ? selectedGenres.join(', ') 
                        : 'Wybierz gatunki...'}
                    </span>
                    {!isGenresLoading && (
                      <FiChevronDown className={`text-gray-400 transition-transform ${isGenreSelectOpen ? 'transform rotate-180' : ''}`} />
                    )}
                  </button>
                  
                  {isGenreSelectOpen && !isGenresLoading && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg py-1 border border-gray-300 max-h-60 overflow-auto">
                      {bookGenres.map((genre) => (
                        <div 
                          key={genre}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center"
                          onClick={() => handleGenreChange(genre)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre)}
                            readOnly
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">{genre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedGenres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedGenres.map(genre => (
                      <span 
                        key={genre} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => handleGenreChange(genre)}
                          className="ml-1.5 inline-flex text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <span className="sr-only">Usuń</span>
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
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
                    Rejestrowanie...
                  </>
                ) : (
                  <>
                    Zarejestruj się <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Masz już konto?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Twoja Aplikacja. Wszystkie prawa zastrzeżone.
        </div>
      </div>
    </div>
  );
}