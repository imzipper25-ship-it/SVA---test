import { supabase } from './supabase';
import { uploadFile, getFileUrl } from './storage';
import { ResumeAnalysis } from '../types/analysis';

export interface Candidate {
    id: string;
    user_id: string;
    file_url: string;
    parsed_data: ResumeAnalysis;
    contact_info?: {
        name: string;
        phone: string;
        email: string;
    };
    score_data?: any;
    created_at: string;
}

export const saveCandidate = async (
    userId: string,
    file: File,
    analysis: ResumeAnalysis
): Promise<Candidate> => {
    try {
        // 1. Upload file to R2
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = await uploadFile(file, fileName);

        // 2. Save record to Supabase
        const { data, error } = await supabase
            .from('candidates')
            .insert({
                user_id: userId,
                file_url: filePath,
                parsed_data: analysis,
                contact_info: analysis.contactInfo,
                score_data: { score: analysis.score } // Store score separately for easier querying
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving candidate:', error);
        throw error;
    }
};

export const getCandidates = async (userId: string): Promise<Candidate[]> => {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getCandidateById = async (id: string): Promise<Candidate | null> => {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const updateCandidate = async (id: string, analysis: ResumeAnalysis) => {
    const { data, error } = await supabase
        .from('candidates')
        .update({
            parsed_data: analysis,
            score_data: { score: analysis.score }
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getCandidateFileUrl = async (path: string) => {
    return getFileUrl(path);
}
