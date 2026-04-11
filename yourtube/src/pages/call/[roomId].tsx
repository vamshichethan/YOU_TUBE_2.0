import { useRouter } from 'next/router';
import Head from 'next/head';
import CallRoom from '../../components/CallRoom';
import { useEffect, useState } from 'react';

export default function CallPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router.isReady]);

  if (!isReady || !roomId || typeof roomId !== 'string') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-medium tracking-tight">Joining Room...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Call {roomId} | YourTube</title>
      </Head>
      <CallRoom roomId={roomId} />
    </>
  );
}
