import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // wait until client-side

  return <div>AI Music Player here</div>;
}
