import { useEffect, useState } from 'react';
import { db } from '../db';
export const useDexieReady = () => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        db.open()
            .then(() => setReady(true))
            .catch(() => setReady(false));
        return () => db.close();
    }, []);
    return ready;
};
