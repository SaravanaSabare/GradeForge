-- ============================================================
-- StudyMatch: Connections & Chat Tables
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Connections table (like/pass/match system)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_sender ON public.connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- Direct messages between matched users
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created ON public.direct_messages(created_at);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Connections: users can see connections involving themselves
CREATE POLICY "View Own Connections" ON public.connections 
    FOR SELECT TO authenticated 
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Send Connection" ON public.connections 
    FOR INSERT TO authenticated 
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Respond Connection" ON public.connections 
    FOR UPDATE TO authenticated 
    USING (receiver_id = auth.uid());

-- Direct Messages: only between matched users (both can see)
CREATE POLICY "View Own Messages" ON public.direct_messages 
    FOR SELECT TO authenticated 
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Send Messages" ON public.direct_messages 
    FOR INSERT TO authenticated 
    WITH CHECK (
        sender_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.connections 
            WHERE status = 'accepted' 
            AND (
                (sender_id = auth.uid() AND receiver_id = public.direct_messages.receiver_id)
                OR (receiver_id = auth.uid() AND sender_id = public.direct_messages.receiver_id)
            )
        )
    );

-- View to calculate user CGPAs for matching (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_discover_users(current_user_id UUID, user_university_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    department_name TEXT,
    year INTEGER,
    cgpa NUMERIC,
    total_credits NUMERIC
) AS $$
    SELECT 
        u.id,
        u.name,
        d.name as department_name,
        u.year,
        CASE WHEN SUM(sg.credits) > 0 
            THEN ROUND((SUM(sg.credits * sg.grade_points) / SUM(sg.credits))::NUMERIC, 2)
            ELSE 0 
        END as cgpa,
        COALESCE(SUM(sg.credits), 0) as total_credits
    FROM public.users u
    LEFT JOIN public.departments d ON d.id = u.department_id
    LEFT JOIN public.semester_grades sg ON sg.user_id = u.id
    WHERE u.university_id = user_university_id
    AND u.id != current_user_id
    AND u.id NOT IN (
        SELECT receiver_id FROM public.connections WHERE sender_id = current_user_id
    )
    GROUP BY u.id, u.name, d.name, u.year
    HAVING COALESCE(SUM(sg.credits), 0) > 0
    ORDER BY RANDOM()
    LIMIT 20;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Done! 🎉
