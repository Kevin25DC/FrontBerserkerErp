/** Tipos de la API (espejo de app/schemas en ../api). Decimales llegan como string. */
export type Dec = string;

export interface Page<T> { items: T[]; total: number; page: number; page_size: number }

export interface User { id: number; username: string; first_name: string; last_name: string; email: string; is_superuser: boolean; last_login: string | null }

export interface Customer { id: number; name: string; lastname: string; cedula: string; phone: string; email: string; address: string; city: string; record_date: string | null; has_pdf: boolean }
export type CustomerIn = Omit<Customer, 'id' | 'record_date' | 'has_pdf'>;

export interface Item { id: number; name: string; reference: string | null; description: string | null; price: Dec; stock: number; active: boolean; tax_id: number | null }

export interface Tax { id: number; name: string; rate: Dec; is_active: boolean; created_at: string | null }

export interface TransactionType { id: number; name: string; consecutive: number; prefix: string | null }

export interface Payment { id: number; amount: Dec; date: string }
export interface Quota { id: number; number: number; amount: Dec; paid_amount: Dec; balance: Dec; payment_date: string; is_paid: boolean; is_overdue: boolean; payments: Payment[] }
export interface QuotaRow extends Quota { invoice_id: number; invoice_number: number; customer_id: number; customer_name: string }
export interface QuotaPage extends Page<QuotaRow> { counters: { paid: number; unpaid: number; overdue: number } }

export interface InvoiceSummary {
  id: number; invoice_number: number; date: string; customer_id: number; customer_name: string; customer_email: string | null;
  total: Dec; paid: Dec; balance: Dec; payment_method: string; status: string; quotas: number | null; has_unpaid_quotas: boolean;
  delivery_amount: Dec; initial_fee: Dec; discount: Dec;
}
export interface InvoiceLine { item_id: number; name: string; reference: string | null; quantity: number; price: Dec; subtotal: Dec }
export interface InvoiceDetail extends InvoiceSummary {
  created_at: string | null; transaction_type: TransactionType; customer: Customer; notes: string | null; payment_frequency: string | null;
  lines: InvoiceLine[]; subtotal: Dec; quota_list: Quota[]; total_financed: Dec | null; quota_value: Dec | null;
  quota_value_is_range: boolean; quota_value_min: Dec | null; quota_value_max: Dec | null; cancel_number: string | null;
  cancel_reason: string | null; canceled_at: string | null; canceled_by: string | null;
  company_name: string; company_nit: string;
}
export interface InvoiceKpis {
  total_invoiced: Dec; invoice_count: number; cash_paid: Dec; cash_paid_count: number; credit_sold: Dec; credit_count: number;
  portfolio_balance: Dec; credits_with_balance: number; canceled_count: number;
}

export interface QuoteLine { item_id: number; name: string; quantity: number; price: Dec; subtotal: Dec; active: boolean; stock: number }
export interface Quote {
  id: number; code: string; number: number; customer_id: number; customer_name: string; customer_cedula: string;
  quote_date: string; valid_until: string | null; discount: Dec; delivery_amount: Dec; subtotal: Dec; total: Dec;
  notes: string | null; customer_phone: string | null; customer_email: string | null; status: 'pendiente' | 'facturada' | 'anulada'; is_expired: boolean; invoice_id: number | null; invoice_number: number | null;
}
export interface QuoteDetail extends Quote { lines: QuoteLine[] }

export interface Adjustment { id: number; item_id: number; item_name: string; adjustment_type: 'IN' | 'OUT'; quantity: number; reason: string | null; created_at: string; username: string; stock_before: number | null; stock_after: number | null }

export interface Point { label: string; value: Dec | number }
export interface Dashboard {
  cash_sales: Dec; credit_sales: Dec; customers: number; active_items: number; low_stock_count: number; low_stock: Item[];
  monthly_sales: Point[]; top_products: Point[]; new_customers: Point[];
}
