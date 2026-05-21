import { supabase } from '@/lib/supabase';

const RECEIPT_BUCKET = 'payment_receipts';

export interface ReceiptFile {
  name: string;
  id: string;
  updated_at: string;
  size: number;
  path: string;
}

export class ReceiptService {
  static async listReceipts() {
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  static async getReceiptUrl(path: string) {
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrl(path, 60);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }
}
