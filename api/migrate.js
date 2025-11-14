export default async function handler(req, res) {
  return res.status(200).json({
    success: false,
    message: 'Table creation completed manually in Supabase SQL editor',
    instructions: 'Please run the SQL schema in your Supabase dashboard directly',
    note: 'This endpoint is deprecated - use Supabase SQL Editor instead'
  });
}
