/**
 * Employee Data Management API
 *
 * GET  /api/business/employee-data — Get own wellness reports
 * DELETE /api/business/employee-data — Delete own wellness reports (GDPR right to erasure)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { anonymizeEmployeeId } from '@/lib/business/data-encryption';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = anonymizeEmployeeId(user.id);

    const { data, error } = await supabase
      .from('employee_wellness_reports')
      .select('id, symptoms, severity, is_absent, reported_at, organization_id')
      .eq('employee_id', employeeId)
      .order('reported_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    console.error('[EmployeeData GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = anonymizeEmployeeId(user.id);

    const { count, error } = await supabase
      .from('employee_wellness_reports')
      .delete({ count: 'exact' })
      .eq('employee_id', employeeId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: count ?? 0,
      message: 'All your wellness data has been permanently deleted.',
    });
  } catch (error) {
    console.error('[EmployeeData DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
