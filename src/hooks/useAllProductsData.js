import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DIET_TABS } from '../constants';

export function useAllProductsData() {
  const [dataByTab, setDataByTab] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = {};
      for (const tab of DIET_TABS) {
        try {
          const snapshot = await getDocs(collection(db, tab.collection));
          result[tab.id] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            _category: tab.label,
            _collection: tab.collection,
            ...docSnap.data(),
          }));
        } catch {
          result[tab.id] = [];
        }
      }
      setDataByTab(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      setDataByTab({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const allData = Object.values(dataByTab).flat();
  const totalCount = allData.length;

  return { dataByTab, allData, loading, error, refetch: fetchAll, totalCount };
}
