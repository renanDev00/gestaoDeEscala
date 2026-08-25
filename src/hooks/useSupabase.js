import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabase(tableName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: true });
    if (error) {
      console.error(`Erro ao buscar ${tableName}:`, error);
    } else {
      setData(result || []);
    }
    setLoading(false);
  };

  const add = async (payload) => {
    const { data: result, error } = await supabase.from(tableName).insert([payload]).select();
    if (error) {
      console.error(`Erro ao adicionar em ${tableName}:`, error);
      alert("Erro ao salvar no banco de dados.");
      return null;
    }
    if (result && result.length > 0) {
      setData((prev) => [...prev, result[0]]);
      return result[0];
    }
  };

  const update = async (id, payload) => {
    const { data: result, error } = await supabase.from(tableName).update(payload).eq('id', id).select();
    if (error) {
      console.error(`Erro ao atualizar em ${tableName}:`, error);
      alert("Erro ao atualizar no banco de dados.");
      return null;
    }
    if (result && result.length > 0) {
      setData((prev) => prev.map((item) => (item.id === id ? result[0] : item)));
      return result[0];
    }
  };

  const remove = async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.error(`Erro ao remover em ${tableName}:`, error);
      alert("Erro ao remover do banco de dados.");
      return false;
    }
    setData((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  return { data, loading, add, update, remove, refetch: fetchData };
}
