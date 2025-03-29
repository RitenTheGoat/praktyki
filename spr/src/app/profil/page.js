'use client';
import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { FiUser, FiSettings, FiShield, FiAlertTriangle, FiLogOut } from 'react-icons/fi';

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const pb = new PocketBase('http://192.168.2.9:8080');
        
        // Sprawdź czy użytkownik jest zalogowany
        if (!pb.authStore.isValid) {
          window.location.href = '/login';
          return;
        }

        // Pobierz dane użytkownika
        const record = await pb.collection('users').getOne(pb.authStore.model.id);
        setUserData(record);
      } catch (err) {
        setError('Nie udało się załadować danych użytkownika');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    const pb = new PocketBase('http://192.168.2.9:8080');
    pb.authStore.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <FiAlertTriangle className="inline mr-2" />
          {error}
        </div>
      </div>
    );
  }

  // Renderowanie w zależności od roli
  const renderProfileByRole = () => {
    switch(userData?.rola) {
      case 'super_admin':
        return (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-purple-800 flex items-center">
              <FiShield className="mr-2" /> Panel Super Administratora
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-purple-700">Zarządzanie serwerem</h3>
                <p className="text-sm text-gray-600 mt-2">Pełny dostęp do wszystkich funkcji systemu</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-purple-700">Administratorzy</h3>
                <p className="text-sm text-gray-600 mt-2">Zarządzaj kontami administratorów</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-purple-700">Logi systemowe</h3>
                <p className="text-sm text-gray-600 mt-2">Przeglądaj pełne logi aplikacji</p>
              </div>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-blue-800 flex items-center">
              <FiSettings className="mr-2" /> Panel Administratora
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-blue-700">Zarządzanie użytkownikami</h3>
                <p className="text-sm text-gray-600 mt-2">Edytuj i usuwaj konta użytkowników</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-blue-700">Statystyki</h3>
                <p className="text-sm text-gray-600 mt-2">Przeglądaj statystyki systemu</p>
              </div>
            </div>
          </div>
        );
      default: // user
        return (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-green-800 flex items-center">
              <FiUser className="mr-2" /> Panel Użytkownika
            </h2>
            <p className="mt-2 text-gray-600">Witaj w swoim profilu! Tutaj możesz zarządzać swoimi danymi.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Nagłówek profilu */}
          <div className="bg-indigo-600 px-6 py-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-2xl font-bold">
                  {userData?.imie} {userData?.nazwisko}
                </h1>
                <p className="text-indigo-200 mt-1">{userData?.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-700 text-indigo-100">
                  {userData?.rola || 'user'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
              >
                <FiLogOut className="mr-2" /> Wyloguj się
              </button>
            </div>
          </div>

          {/* Zawartość profilu */}
          <div className="px-6 py-8">
            {renderProfileByRole()}

            {/* Sekcja informacji podstawowych */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Twoje dane</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Imię</p>
                  <p className="font-medium">{userData?.imie || 'Nie podano'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nazwisko</p>
                  <p className="font-medium">{userData?.nazwisko || 'Nie podano'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nazwa użytkownika</p>
                  <p className="font-medium">{userData?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ulubione gatunki</p>
                  <p className="font-medium">{userData?.gatunek || 'Nie wybrano'}</p>
                </div>
              </div>
            </div>

            {/* Sekcja specyficzna dla roli */}
            {userData?.rola === 'super_admin' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <h2 className="text-lg font-semibold text-yellow-800">Funkcje specjalne</h2>
                <div className="mt-2 space-y-2">
                  <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                    Zarządzanie całym systemem
                  </button>
                  <button className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
                    Awaryjne akcje
                  </button>
                </div>
              </div>
            )}

            {userData?.rola === 'admin' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h2 className="text-lg font-semibold text-blue-800">Narzędzia administracyjne</h2>
                <div className="mt-2 space-y-2">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                    Zarządzaj użytkownikami
                  </button>
                  <button className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
                    Przeglądaj raporty
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}