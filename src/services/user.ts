import { supabase } from './supabase';

export const ensureUserProfile = async (userId: string, email: string | undefined) => {
    try {
        // Check if profile exists
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching profile:', fetchError);
            return;
        }

        if (!profile) {
            // Create profile
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    role: 'recruiter' // Defaulting to recruiter for this context, or 'user'
                });

            if (insertError) {
                console.error('Error creating profile:', insertError);
            }
        }
    } catch (error) {
        console.error('Error in ensureUserProfile:', error);
    }
};
