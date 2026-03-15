import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ALL_FIRESTORE_COLLECTION_IDS } from '../constants';

const ALL_COLLECTIONS_TO_CHECK = ALL_FIRESTORE_COLLECTION_IDS;

export function useFirestoreCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        ALL_COLLECTIONS_TO_CHECK.map((name) =>
          getDocs(collection(db, name)).then(() => name)
        )
      );

      const valid = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      setCollections(valid.length > 0 ? valid : ['users']);
    } catch (err) {
      setError('Could not connect to Firestore. Check your Firebase config.');
      setCollections(['users']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, error, refetch: fetchCollections };
}

export function useCollectionData(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!collectionName) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Add a document to a Firestore collection. Use SERVER_TIMESTAMP for createdAt/updatedAt.
 * @param {string} collectionName
 * @param {Record<string, unknown>} data - field values; use { createdAt: 'SERVER_TIMESTAMP' } for server time
 * @returns {Promise<string>} new document ID
 */
export async function addDocument(collectionName, data) {
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === 'SERVER_TIMESTAMP' || sanitized[key] === '__SERVER_TIMESTAMP__') {
      sanitized[key] = serverTimestamp();
    }
  }
  const ref = await addDoc(collection(db, collectionName), sanitized);
  return ref.id;
}
