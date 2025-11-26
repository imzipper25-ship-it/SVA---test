import { supabase } from './supabase';

export interface Vacancy {
    id: string;
    recruiter_id: string;
    title: string;
    description: string;
    requirements: string[];
    status: 'active' | 'closed' | 'draft';
    created_at: string;
}

export const createVacancy = async (vacancy: Omit<Vacancy, 'id' | 'created_at' | 'recruiter_id'>, recruiterId: string) => {
    const { data, error } = await supabase
        .from('vacancies')
        .insert({
            ...vacancy,
            recruiter_id: recruiterId
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getVacancies = async (recruiterId: string) => {
    const { data, error } = await supabase
        .from('vacancies')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const deleteVacancy = async (id: string) => {
    const { error } = await supabase
        .from('vacancies')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateVacancy = async (id: string, updates: Partial<Vacancy>) => {
    const { data, error } = await supabase
        .from('vacancies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
