import { PageHeader } from '@/components/ui';
import { CustomerForm } from '../customer-form';

export const metadata = { title: 'Nuevo cliente' };

export default function NuevoClientePage() {
  return (
    <>
      <PageHeader back={{ href: '/clientes', label: 'Clientes' }} title="Nuevo cliente" subtitle="Registra los datos del cliente para poder facturarle." />
      <CustomerForm />
    </>
  );
}
