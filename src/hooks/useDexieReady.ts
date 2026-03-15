import { useEffect, useState } from 'react';
import { db } from '../db';

export const useDexieReady = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    db.open()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};
