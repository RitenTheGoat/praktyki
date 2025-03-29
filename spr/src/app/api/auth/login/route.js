import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request) {
  const { email, password } = await request.json();

  // Walidacja danych wejściowych
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email i hasło są wymagane' },
      { status: 400 }
    );
  }

  try {
    // Inicjalizacja PocketBase - użyj zmiennej środowiskowej
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://192.168.2.9:8080');

    // Autentykacja użytkownika
    const authData = await pb.collection('users').authWithPassword(
      email.trim(),
      password.trim()
    );

    // Przygotowanie odpowiedzi
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name || authData.record.username || email.split('@')[0]
      },
      token: pb.authStore.token
    });

    // Ustawienie bezpiecznego ciasteczka sesji
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 30 // 30 dni
    };

    response.cookies.set('pb_auth', pb.authStore.exportToCookie(), cookieOptions);
    
    // Dodatkowe zabezpieczenie nagłówków
    response.headers.set('X-Auth-Success', 'true');
    response.headers.set('Cache-Control', 'no-store');

    return response;

  } catch (err) {
    console.error('Błąd logowania:', {
      message: err.message,
      status: err.status,
      data: err.data
    });

    // Dokładniejsze komunikaty błędów
    let errorMessage = 'Błąd serwera';
    if (err.status === 400) {
      errorMessage = 'Nieprawidłowy email lub hasło';
    } else if (err.status === 404) {
      errorMessage = 'Konto nie istnieje';
    }

    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: err.status || 500 }
    );
  }
}

export function OPTIONS() {
  // Obsługa preflight request dla CORS
  const response = new NextResponse(null, {
    status: 204,
  });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}