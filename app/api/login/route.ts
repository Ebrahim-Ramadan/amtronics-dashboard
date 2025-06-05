import { NextResponse } from 'next/server'

// Retrieve credentials from environment variable and parse JSON
const ADMIN_CREDENTIALS_STRING = process.env.ADMIN_CREDENTIALS;
let adminCredentials: { email: string; password: string }[] = [];

if (ADMIN_CREDENTIALS_STRING) {
  try {
    adminCredentials = JSON.parse(ADMIN_CREDENTIALS_STRING);
  } catch (error) {
    console.error("Failed to parse ADMIN_CREDENTIALS environment variable:", error);
    // In a real application, you might want to handle this error more gracefully
    // or prevent the server from starting if credentials are misconfigured.
  }
}

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Check if provided credentials match any in the array
  const isAuthenticated = adminCredentials.some(credential =>
    credential.email === email && credential.password === password
  );

  if (isAuthenticated) {
    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 })
    // Set an authenticated cookie (valid for 1 day)
    response.cookies.set('authenticated', 'true', { path: '/', maxAge: 60 * 60 * 24 })
    return response
  } else {
    // Return an error response for invalid credentials
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }
}