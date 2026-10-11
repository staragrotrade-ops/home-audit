import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { user, staff } = await authenticateInspector(request)
    return Response.json(
      {
        ok: true,
        apiVersion: 1,
        account: {
          userId: user.id,
          staffId: staff.id,
          email: staff.email,
          displayName: staff.display_name,
          role: staff.role,
          registrationNumber: staff.registration_number,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return appError(error, 'Unable to load the account.')
  }
}
