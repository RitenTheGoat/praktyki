import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request) {
  const { email, password } = await request.json();

  try {
    // Inicjalizacja PocketBase z Twoim adresem
    const pb = new PocketBase('http://192.168.2.9:8080');
                           //  http://192.168.2.9:8080
                           //  http://192.168.0.147:8090
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
        name: authData.record.username || authData.record.email.split('@')[0]
      }
    });

    // Ustawienie ciasteczka sesji
    response.cookies.set('pb_auth', pb.authStore.exportToCookie(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30 // 30 dni
    });

    return response;

  } catch (err) {
    console.error('Błąd logowania:', {
      message: err.message,
      status: err.status,
      data: err.data
    });

    return NextResponse.json(
      { 
        success: false, 
        message: err.status === 400 ? 'Nieprawidłowy email lub hasło' : 'Błąd serwera'
      },
      { status: err.status || 500 }
    );
  }
}