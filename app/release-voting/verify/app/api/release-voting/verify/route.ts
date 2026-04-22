import { NextResponse } from 'next/server';
import { verifyVoteToken } from '@/lib/emailVerification';

export async function POST(request: Request) {
  const formData = await request.formData();
  const tokenValue = formData.get('token');
  const token = typeof tokenValue === 'string' ? tokenValue : '';

  if (!token) {
    return NextResponse.redirect(
      new URL(
        '/release-voting/verify?result=error&message=Der%20Best%C3%A4tigungslink%20ist%20unvollst%C3%A4ndig.',
        request.url
      )
    );
  }

  const result = await verifyVoteToken(token);

  const redirectUrl = new URL('/release-voting/verify', request.url);
  redirectUrl.searchParams.set('result', result.ok ? 'success' : 'error');
  redirectUrl.searchParams.set('message', result.message);

  return NextResponse.redirect(redirectUrl);
}
