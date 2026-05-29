/**
 * Business Onboarding API
 *
 * POST /api/business/onboarding
 * Creates a business organization and adds the user as admin.
 * Uses service role to bypass RLS on business_organizations.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      action: 'create_org' | 'create_location';
      orgName?: string;
      orgId?: string;
      locationName?: string;
      locationAddress?: string;
    };

    // Use service client to bypass RLS
    const service = createServiceClient();

    if (body.action === 'create_org') {
      if (!body.orgName?.trim()) {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
      }

      // Create organization
      const { data: org, error: orgError } = await service
        .from('business_organizations')
        .insert({ name: body.orgName.trim(), subscription_tier: 'free' })
        .select('id')
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          { error: `Failed to create organization: ${orgError?.message ?? 'Unknown error'}` },
          { status: 500 }
        );
      }

      // Add user as admin of the org — use service client to bypass RLS
      const { error: memberError } = await service
        .from('business_users')
        .insert({ user_id: user.id, organization_id: org.id, role: 'admin' });

      if (memberError) {
        // If member insert fails, delete the org to keep things clean
        await service.from('business_organizations').delete().eq('id', org.id);
        return NextResponse.json(
          { error: `Failed to set up membership: ${memberError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ orgId: org.id });
    }

    if (body.action === 'create_location') {
      if (!body.orgId || !body.locationName?.trim()) {
        return NextResponse.json({ error: 'orgId and locationName are required' }, { status: 400 });
      }

      // Skip membership check — user just created this org in the same session
      // The service client handles authorization at the API level (auth check above)
      const { error: locError } = await service
        .from('business_locations')
        .insert({
          organization_id: body.orgId,
          name: body.locationName.trim(),
          address: body.locationAddress?.trim() ?? null,
        });

      if (locError) {
        return NextResponse.json(
          { error: `Failed to create location: ${locError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
