import { PageHeader } from '@/components/ui';
import { QuoteForm } from '../quote-form';

export const metadata = { title: 'Nueva cotización' };

export default function NuevaCotizacionPage() {
  return (
    <>
      <PageHeader back={{ href: '/cotizaciones', label: 'Cotizaciones' }} title="Nueva cotización" subtitle='No descuenta inventario. Se usa después al facturar con "Traer cotización".' />
      <QuoteForm />
    </>
  );
}
