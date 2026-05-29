/**
 * Business Health Update Broadcast API
 *
 * POST /api/business/health-update
 * Allows business admins to send health updates to all employees.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { enqueueEmail } from '@/lib/email/email-queue';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      organizationId?: string;
      subject?: string;
      message?: string;
    };

    const { organizationId, subject, message } = body;

    if (!organizationId || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'organizationId, subject, and message are required' },
        { status: 400 }
      );
    }

    // Verify user is admin of this organization
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!businessUser || businessUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    // Get all employees in the organization
    const { data: employees } = await supabase
      .from('business_users')
      .select('user_id')
      .eq('organization_id', organizationId);

    if (!employees || employees.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sent = 0;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';

    for (const emp of employees) {
      if (!emp.user_id) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(emp.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      enqueueEmail({
        to: email,
        subject: `[Health Update] ${subject}`,
        html: `<p>${message.replace(/\n/g, '<br>')}</p><hr><p style="font-size:12px;color:#9ca3af;">Sent via <a href="${appUrl}">VigilHealth</a> Business Dashboard.</p>`,
        text: `${message}\n\n---\nSent via VigilHealth Business Dashboard.`,
      });
      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('[HealthUpdate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
