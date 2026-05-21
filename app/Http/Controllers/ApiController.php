<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ApiController extends Controller
{
    public function updateEmail(Request $request)
    {
        $userId = $request->input('userId');
        $newEmail = $request->input('newEmail');

        if (!$userId || !$newEmail) {
            return response()->json(['error' => 'Missing userId or newEmail'], 400);
        }

        if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Invalid email format'], 400);
        }

        $supabaseUrl = env('SUPABASE_URL') ?? env('NEXT_PUBLIC_SUPABASE_URL');
        $supabaseServiceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');

        if (!$supabaseUrl || !$supabaseServiceRoleKey) {
            return response()->json(['error' => 'Missing Supabase config'], 500);
        }

        $response = Http::withHeaders([
            'apikey' => $supabaseServiceRoleKey,
            'Authorization' => 'Bearer ' . $supabaseServiceRoleKey,
        ])->put(rtrim($supabaseUrl, '/') . '/auth/v1/admin/users/' . $userId, [
            'email' => $newEmail,
        ]);

        if ($response->failed()) {
            return response()->json(['error' => collect($response->json())->get('message', 'Supabase Error')], 400);
        }

        return response()->json(['message' => 'Email updated successfully']);
    }

    public function sendEmail(Request $request)
    {
        $email = $request->input('email');
        $name = $request->input('name');
        $booking = $request->input('booking');

        if (!$email || !$name || !$booking) {
            return response()->json(['success' => false, 'message' => 'Missing required fields'], 400);
        }

        try {
            $roomType = $booking['room']['room_type']['name'] ?? 'Room';
            $roomNumber = $booking['room']['room_number'] ?? 'N/A';
            
            // Format checkIn
            $checkIn = 'N/A';
            if (isset($booking['start_at'])) {
                $checkIn = \Carbon\Carbon::parse($booking['start_at'])->setTimezone('Asia/Manila')->format('F d, Y • h:i A');
            }

            $guests = $booking['guests'] ?? 'N/A';
            $total = isset($booking['total_amount']) ? '₱' . number_format($booking['total_amount'], 2) : 'N/A';
            
            $extraBedsStr = 'No Extra Bed';
            if (isset($booking['extra_beds'])) {
                if ($booking['extra_beds'] === 1) $extraBedsStr = '1 Extra Bed';
                if ($booking['extra_beds'] === 2) $extraBedsStr = '2 Extra Beds';
            }

            $status = strtoupper($booking['status'] ?? 'updated');
            $statusColor = '#2563eb';
            if (strtolower($status) === 'approved') $statusColor = '#16a34a';
            if (strtolower($status) === 'rejected') $statusColor = '#dc2626';

            $html = "
            <div style='font-family: Arial, sans-serif; max-width: 620px; margin: auto; padding: 24px; color: #333;'>
                <h2 style='margin-bottom: 6px;'>Hello {$name},</h2>
                <p style='font-size: 15px;'>Your booking has been <strong style='color: {$statusColor};'>{$status}</strong>.</p>
                <div style='margin-top: 16px; background: #f6f7f9; padding: 16px; border-radius: 10px;'>
                    <h3 style='margin-top: 0;'>Reservation Details</h3>
                    <p><strong>Room Type:</strong> {$roomType}</p>
                    <p><strong>Room Number:</strong> {$roomNumber}</p>
                    <hr style='margin: 10px 0;' />
                    <p><strong>Check-in:</strong> {$checkIn}</p>
                    <p><strong>Guests:</strong> {$guests}</p>
                    <p><strong>Extra Bed:</strong> {$extraBedsStr}</p>
                    <p><strong>Total Amount:</strong> {$total}</p>
                </div>
                <p style='margin-top: 18px; font-size: 14px; line-height: 1.6;'>
                    We are looking forward to welcoming you. If you need assistance, our front desk is available 24/7.
                </p>
                <p style='margin-top: 28px; font-size: 13px; color: #777;'>— Hotel Management</p>
            </div>
            ";

            Mail::html($html, function ($message) use ($email, $status, $roomType) {
                $message->to($email)
                        ->subject("Booking {$status} • {$roomType} 🏨");
            });

            return response()->json(['success' => true, 'message' => 'Email sent successfully']);
        } catch (\Exception $e) {
            Log::error('[EMAIL ROUTE ERROR]', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }
}
