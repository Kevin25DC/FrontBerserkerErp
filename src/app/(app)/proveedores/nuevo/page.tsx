import { PageHeader } from '@/components/ui';
import { SupplierForm } from '../supplier-form';

export default function NuevoProveedorPage() {
  return (
    <>
      <PageHeader back={{ href: '/proveedores', label: 'Proveedores' }} title="Nuevo proveedor"
        subtitle="Registra los datos del tercero y su forma de pago." />
      <SupplierForm />
    </>
  );
}
