'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosClient from '@/lib/axios-client';

export default function ChannelCallbackPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider') || 'facebook';

    if (error) {
      setStatus('error');
      setMessage('OAuth cancelled or failed');
      notifyParent('error', error);
      setProcessed(true); // ✅ Mark as processed
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      notifyParent('error', 'No code');
      setProcessed(true); // ✅ Mark as processed
      return;
    }

    setProcessed(true);
    handleCallback(code, provider);
  }, [searchParams, processed]);

  const handleCallback = async (code: string, provider: string) => {
    try {
      const wsId = (session as any)?.user?.workspaceId || (session as any)?.user?.id;

      if (provider === 'facebook') {
        const res = await axiosClient.get(
          `/channels/facebook/oauth/callback?code=${code}&workspace_id=${wsId}`
        );
        const response = res.data || res;

        if (response.success && response.pages && response.pages.length > 0) {
          // ✅ FIX: Validate tempToken exists
          if (!response.tempToken) {
            setStatus('error');
            setMessage('Failed to get access token. Please try again.');
            notifyParent('error', 'No access token received');
            return;
          }

          setStatus('success');
          setMessage(`Found ${response.pages.length} page(s)`);
          
          notifyParent('success', 'facebook', {
            pages: response.pages,
            tempToken: response.tempToken,
          });
        } else {
          setStatus('error');
          setMessage('No pages found');
          notifyParent('error', 'No pages found');
        }
      } else {
        setStatus('success');
        setMessage('Connected successfully');
        notifyParent('success', provider);
      }
    } catch (error: any) {
      setStatus('error');
      
      // ✅ FIX: Better error messages
      let errorMessage = 'Failed to process callback';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Special handling for used authorization code
      if (errorMessage.includes('already been used')) {
        errorMessage = 'Authorization code expired. Please close this window and try connecting again.';
      }
      
      setMessage(errorMessage);
      notifyParent('error', errorMessage);
    }
  };

  const notifyParent = (status: string, channel?: string, data?: any) => {
    if (window.opener) {
      window.opener.postMessage(
        {
          status,
          channel,
          ...data,
        },
        window.location.origin
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-white/10">
        {status === 'loading' && (
          <>
           
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-400">Success!</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-4">You can close this window</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-400">Error</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-4">You can close this window</p>
          </>
        )}
      </div>
    </div>
  );
}
